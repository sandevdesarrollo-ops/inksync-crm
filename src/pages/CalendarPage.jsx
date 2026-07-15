import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addMonths, addWeeks, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfWeek } from 'date-fns';
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useStore } from '@/lib/store';
import MonthGrid from '@/components/calendar/MonthGrid';
import WeekView from '@/components/calendar/WeekView';
import DayDetailDialog from '@/components/calendar/DayDetailDialog';
import NewAppointmentDialog from '@/components/calendar/NewAppointmentDialog';
import AppointmentDetailDialog from '@/components/calendar/AppointmentDetailDialog';
import { dateLocale } from '@/components/calendar/calendarUtils';

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const locale = dateLocale(i18n.language);

  const appointments = useStore((s) => s.appointments);
  const clients = useStore((s) => s.clients);
  const artists = useStore((s) => s.artists);
  const settings = useStore((s) => s.settings);

  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState('month');
  const [artistFilter, setArtistFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayOpen, setDayOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newDefaultDate, setNewDefaultDate] = useState(null);

  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);
  const artistById = useMemo(() => Object.fromEntries(artists.map((a) => [a.id, a])), [artists]);

  const filtered = useMemo(
    () => (artistFilter === 'all' ? appointments : appointments.filter((a) => a.artistId === artistFilter)),
    [appointments, artistFilter]
  );

  const selectedDayAps = useMemo(
    () => (selectedDay ? filtered.filter((a) => isSameDay(parseISO(a.start), selectedDay)) : []),
    [filtered, selectedDay]
  );

  const navigate = (dir) =>
    setCursor((c) => (view === 'month' ? addMonths(c, dir) : addWeeks(c, dir)));

  const periodLabel = useMemo(() => {
    if (view === 'month') return format(cursor, 'MMMM yyyy', { locale });
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    return isSameMonth(start, end)
      ? `${format(start, 'd', { locale })}–${format(end, 'd MMM yyyy', { locale })}`
      : `${format(start, 'd MMM', { locale })} – ${format(end, 'd MMM yyyy', { locale })}`;
  }, [cursor, view, locale]);

  const openDay = (day) => {
    setSelectedDay(day);
    setDayOpen(true);
  };

  const openAppointment = (id) => {
    setDayOpen(false);
    setDetailId(id);
    setDetailOpen(true);
  };

  const openNew = (day = null) => {
    setDayOpen(false);
    setNewDefaultDate(day || selectedDay || cursor);
    setNewOpen(true);
  };

  return (
    <div>
      <PageHeader title={t('calendar.title')} description={t('calendar.description')}>
        <Button onClick={() => openNew(new Date())}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          {t('calendar.newAppointment')}
        </Button>
      </PageHeader>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label={t('calendar.prevPeriod')} onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label={t('calendar.nextPeriod')} onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            {t('common.today')}
          </Button>
        </div>

        <h2 className="min-w-[10rem] px-1 font-display text-lg font-semibold capitalize">{periodLabel}</h2>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={artistFilter} onValueChange={setArtistFilter}>
            <SelectTrigger className="w-[180px]" aria-label={t('calendar.filterByArtist')}>
              <SelectValue placeholder={t('calendar.allArtists')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('calendar.allArtists')}</SelectItem>
              {artists.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <span className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={a.avatar} alt={a.name} />
                      <AvatarFallback>{a.name[0]}</AvatarFallback>
                    </Avatar>
                    {a.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="month">{t('calendar.views.month')}</TabsTrigger>
              <TabsTrigger value="week">{t('calendar.views.week')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {view === 'month' ? (
        <MonthGrid
          cursor={cursor}
          appointments={filtered}
          clientById={clientById}
          onDayClick={openDay}
          onAppointmentClick={openAppointment}
        />
      ) : (
        <WeekView
          cursor={cursor}
          appointments={filtered}
          clientById={clientById}
          settings={settings}
          onAppointmentClick={openAppointment}
          onDayClick={openDay}
        />
      )}

      <DayDetailDialog
        day={selectedDay}
        open={dayOpen}
        onOpenChange={setDayOpen}
        appointments={selectedDayAps}
        clientById={clientById}
        artistById={artistById}
        onAppointmentClick={openAppointment}
        onNewAppointment={openNew}
      />

      <NewAppointmentDialog open={newOpen} onOpenChange={setNewOpen} defaultDate={newDefaultDate} />

      <AppointmentDetailDialog appointmentId={detailId} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
