import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { CalendarPlus, CalendarX2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { statusStyle, dateLocale } from '@/components/calendar/calendarUtils';

export default function DayDetailDialog({ day, open, onOpenChange, appointments, clientById, artistById, onAppointmentClick, onNewAppointment }) {
  const { t, i18n } = useTranslation();
  const locale = dateLocale(i18n.language);

  const dayAps = useMemo(
    () => [...appointments].sort((a, b) => parseISO(a.start) - parseISO(b.start)),
    [appointments]
  );

  if (!day) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {format(day, 'EEEE d MMMM', { locale })}
          </DialogTitle>
          <DialogDescription>
            {t('calendar.appointments', { count: dayAps.length })}
          </DialogDescription>
        </DialogHeader>

        {dayAps.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CalendarX2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('calendar.emptyDay')}</p>
            <Button size="sm" onClick={() => onNewAppointment(day)}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              {t('calendar.emptyDayAction')}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {dayAps.map((ap) => {
              const client = clientById[ap.clientId];
              const artist = artistById[ap.artistId];
              return (
                <button
                  key={ap.id}
                  type="button"
                  onClick={() => onAppointmentClick(ap.id)}
                  className="flex w-full cursor-pointer items-center gap-3 py-3 text-left transition-colors duration-200 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 -mx-2"
                >
                  <div className="w-12 shrink-0 text-sm font-semibold tabular-nums">
                    {format(parseISO(ap.start), 'HH:mm')}
                  </div>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={client?.avatar} alt={client?.name} />
                    <AvatarFallback>{client?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{client?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ap.title} · {artist?.name}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                      statusStyle(ap.status).badge
                    )}
                  >
                    {t(`calendar.status.${ap.status}`)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
