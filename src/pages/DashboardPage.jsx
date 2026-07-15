import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  format,
  parseISO,
  isSameDay,
  isSameMonth,
  startOfWeek,
  addDays,
  subMonths,
} from 'date-fns';
import { es as esLocale, bg as bgLocale } from 'date-fns/locale';
import {
  Banknote,
  CalendarClock,
  UserPlus,
  PackageOpen,
  MessageCircle,
  ChevronRight,
  Inbox,
  CheckCircle2,
  CalendarX2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useStore, fmtMoney } from '@/lib/store';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const GOLD = 'hsl(41 86% 56%)';
const GOLD_DIM = 'hsl(41 40% 34%)';
const DATE_LOCALES = { es: esLocale, bg: bgLocale };

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(240 6% 10%)',
  border: '1px solid hsl(240 5% 17%)',
  borderRadius: 12,
  color: 'hsl(40 20% 92%)',
  fontSize: 12,
  padding: '8px 12px',
};

const STATUS_BADGE = {
  confirmed: 'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]',
  pending: 'bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]',
  completed: 'bg-[hsl(var(--muted))] text-muted-foreground',
  cancelled: 'bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))]',
};

const PRIORITY_DOT = {
  high: 'bg-[hsl(var(--destructive))]',
  medium: 'bg-[hsl(var(--warning))]',
  low: 'bg-muted-foreground',
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut', delay },
});

function StatTile({ icon: Icon, label, value, caption, to, delay }) {
  const body = (
    <Card className="h-full transition-colors duration-200 hover:border-[hsl(var(--primary)/0.4)]">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--primary)/0.12)]">
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          </span>
        </div>
        <div className="font-display text-4xl font-semibold leading-none tracking-tight">{value}</div>
        <p className="mt-auto text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
  return (
    <motion.div {...fade(delay)} className="min-w-0">
      {to ? (
        <Link
          to={to}
          className="block h-full cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const settings = useStore((s) => s.settings);
  const appointments = useStore((s) => s.appointments);
  const clients = useStore((s) => s.clients);
  const artists = useStore((s) => s.artists);
  const proposals = useStore((s) => s.proposals);
  const inventory = useStore((s) => s.inventory);
  const activities = useStore((s) => s.activities);
  const conversations = useStore((s) => s.conversations);

  const dateLocale = DATE_LOCALES[i18n.language];
  const now = new Date();

  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);
  const artistById = useMemo(() => Object.fromEntries(artists.map((a) => [a.id, a])), [artists]);

  const monthRevenue = (ref) => {
    const fromAppointments = appointments
      .filter((a) => a.status === 'completed' && isSameMonth(parseISO(a.start), ref))
      .reduce((sum, a) => sum + (a.price || 0), 0);
    const fromDeposits = proposals
      .filter(
        (p) =>
          ['deposit_paid', 'accepted'].includes(p.status) &&
          p.paidAt &&
          isSameMonth(parseISO(p.paidAt), ref)
      )
      .reduce((sum, p) => sum + (p.deposit || 0), 0);
    return fromAppointments + fromDeposits;
  };

  const revenueThisMonth = monthRevenue(now);
  const revenueLastMonth = monthRevenue(subMonths(now, 1));
  const revenueTrend =
    revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : null;
  const revenueCaption =
    revenueTrend === null || revenueTrend === 0
      ? t('dashboard.kpis.revenueTrendFlat')
      : revenueTrend > 0
        ? t('dashboard.kpis.revenueTrendUp', { pct: revenueTrend })
        : t('dashboard.kpis.revenueTrendDown', { pct: revenueTrend });

  const todaysAppointments = useMemo(
    () =>
      appointments
        .filter((a) => isSameDay(parseISO(a.start), now) && a.status !== 'cancelled')
        .sort((a, b) => new Date(a.start) - new Date(b.start)),
    [appointments] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const confirmedToday = todaysAppointments.filter((a) => a.status === 'confirmed').length;

  const newClientsThisMonth = clients.filter((c) => isSameMonth(parseISO(c.joinDate), now)).length;
  const lowStockCount = inventory.filter((i) => i.stock < i.minStock).length;

  const weekData = useMemo(() => {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      return {
        label: format(day, 'EEE', { locale: dateLocale }),
        isToday: isSameDay(day, now),
        count: appointments.filter(
          (a) => isSameDay(parseISO(a.start), day) && a.status !== 'cancelled'
        ).length,
      };
    });
  }, [appointments, dateLocale]); // eslint-disable-line react-hooks/exhaustive-deps

  const attention = useMemo(
    () =>
      activities
        .filter((a) => !a.done)
        .sort(
          (a, b) =>
            (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3) ||
            new Date(b.time) - new Date(a.time)
        )
        .slice(0, 4),
    [activities]
  );

  const unreadConversations = useMemo(
    () => conversations.filter((c) => c.unread > 0),
    [conversations]
  );

  const hour = now.getHours();
  const greeting =
    hour < 12
      ? t('dashboard.greetingMorning')
      : hour < 18
        ? t('dashboard.greetingAfternoon')
        : t('dashboard.greetingEvening');

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${settings.studioName}`}
        description={`${format(now, 'EEEE, d MMMM yyyy', { locale: dateLocale })} — ${t('dashboard.subtitle', { studio: settings.studioName })}`}
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Banknote}
          label={t('dashboard.kpis.revenueMonth')}
          value={fmtMoney(revenueThisMonth, settings.currency)}
          caption={revenueCaption}
          delay={0}
        />
        <StatTile
          icon={CalendarClock}
          label={t('dashboard.kpis.apptsToday')}
          value={todaysAppointments.length}
          caption={t('dashboard.kpis.apptsConfirmed', { n: confirmedToday })}
          delay={0.05}
        />
        <StatTile
          icon={UserPlus}
          label={t('dashboard.kpis.newClients')}
          value={newClientsThisMonth}
          caption={t('dashboard.kpis.newClientsCaption')}
          delay={0.1}
        />
        <StatTile
          icon={PackageOpen}
          label={t('dashboard.kpis.lowStock')}
          value={lowStockCount}
          caption={t('dashboard.kpis.lowStockCaption')}
          to="/inventory"
          delay={0.15}
        />
      </div>

      {/* Week chart + today's schedule */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div {...fade(0.1)} className="min-w-0 lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-xl font-semibold">
                {t('dashboard.week.title')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t('dashboard.week.caption')}</p>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(240 6% 64%)', fontSize: 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(240 6% 64%)', fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(240 5% 14% / 0.5)' }}
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value) => [value, t('dashboard.week.appointments')]}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {weekData.map((d) => (
                        <Cell key={d.label} fill={d.isToday ? GOLD : GOLD_DIM} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fade(0.15)} className="min-w-0">
          <Card className="flex h-full flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="font-display text-xl font-semibold">
                  {t('dashboard.schedule.title')}
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(now, 'd MMMM', { locale: dateLocale })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/calendar')}
              >
                {t('common.viewAll')}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-2">
              {todaysAppointments.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
                  <CalendarX2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.schedule.empty')}</p>
                  <Button size="sm" onClick={() => navigate('/calendar')}>
                    {t('dashboard.schedule.openCalendar')}
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {todaysAppointments.map((ap) => {
                    const client = clientById[ap.clientId];
                    const artist = artistById[ap.artistId];
                    return (
                      <li key={ap.id}>
                        <button
                          type="button"
                          onClick={() => navigate('/calendar')}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-md px-1 py-3 text-left transition-colors duration-200 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={client?.avatar} alt={client?.name || ''} />
                            <AvatarFallback>{(client?.name || '?').slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{ap.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {format(parseISO(ap.start), 'HH:mm')} · {client?.name}{' '}
                              {artist ? t('dashboard.schedule.with', { artist: artist.name }) : ''}
                            </p>
                          </div>
                          <Badge className={`shrink-0 border-transparent text-[11px] font-medium ${STATUS_BADGE[ap.status] || STATUS_BADGE.pending}`}>
                            {t(`dashboard.status.${ap.status}`)}
                          </Badge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Needs attention + unread messages */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div {...fade(0.2)} className="min-w-0 lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-display text-xl font-semibold">
                {t('dashboard.attention.title')}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/activity')}
              >
                {t('common.viewAll')}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-2">
              {attention.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.attention.empty')}</p>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/activity')}>
                    {t('dashboard.attention.goToFocus')}
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {attention.map((act) => (
                    <li key={act.id}>
                      <button
                        type="button"
                        onClick={() => navigate(act.link || '/activity')}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-md px-1 py-3 text-left transition-colors duration-200 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[act.priority] || PRIORITY_DOT.low}`}
                          aria-hidden="true"
                        />
                        <p className="min-w-0 flex-1 truncate text-sm">{act.text}</p>
                        <span className="hidden shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground sm:block">
                          {t(`dashboard.priority.${act.priority}`)}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fade(0.25)} className="min-w-0">
          <Card className="flex h-full flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-display text-xl font-semibold">
                {t('dashboard.messages.title')}
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-2">
              {unreadConversations.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
                  <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.messages.empty')}</p>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/messages')}>
                    {t('dashboard.messages.openInbox')}
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {unreadConversations.map((cv) => {
                    const client = clientById[cv.clientId];
                    const last = cv.messages[cv.messages.length - 1];
                    return (
                      <li key={cv.id}>
                        <button
                          type="button"
                          onClick={() => navigate('/messages')}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-md px-1 py-3 text-left transition-colors duration-200 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={client?.avatar} alt={client?.name || ''} />
                            <AvatarFallback>{(client?.name || '?').slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{client?.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{last?.text}</p>
                          </div>
                          <Badge className="shrink-0 border-transparent bg-[hsl(var(--primary)/0.15)] text-[11px] font-semibold text-primary">
                            {t('dashboard.messages.unread', { n: cv.unread })}
                          </Badge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
