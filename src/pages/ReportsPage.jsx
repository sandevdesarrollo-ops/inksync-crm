import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { format, parseISO, isSameMonth, subMonths } from 'date-fns';
import { es as esLocale, bg as bgLocale } from 'date-fns/locale';
import { Banknote, Receipt, CheckCircle2, Repeat, Download, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useStore, fmtMoney } from '@/lib/store';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';

const GOLD = 'hsl(41 86% 56%)';
const MUTED_TINTS = ['hsl(240 6% 44%)', 'hsl(240 6% 34%)', 'hsl(240 6% 26%)', 'hsl(240 6% 20%)'];
const DATE_LOCALES = { es: esLocale, bg: bgLocale };

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(240 6% 10%)',
  border: '1px solid hsl(240 5% 17%)',
  borderRadius: 12,
  color: 'hsl(40 20% 92%)',
  fontSize: 12,
  padding: '8px 12px',
};

const AXIS_TICK = { fill: 'hsl(240 6% 64%)', fontSize: 12 };

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut', delay },
});

function KpiTile({ icon: Icon, label, value, caption, delay }) {
  return (
    <motion.div {...fade(delay)} className="min-w-0">
      <Card className="h-full">
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
    </motion.div>
  );
}

function ChartCard({ title, caption, children, delay, className = '' }) {
  return (
    <motion.div {...fade(delay)} className={`min-w-0 ${className}`}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl font-semibold">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </CardHeader>
        <CardContent className="pt-2">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const settings = useStore((s) => s.settings);
  const appointments = useStore((s) => s.appointments);
  const clients = useStore((s) => s.clients);
  const artists = useStore((s) => s.artists);
  const proposals = useStore((s) => s.proposals);

  const dateLocale = DATE_LOCALES[i18n.language];
  const now = new Date();
  const money = (n) => fmtMoney(n, settings.currency);

  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);
  const artistById = useMemo(() => Object.fromEntries(artists.map((a) => [a.id, a])), [artists]);

  const completed = useMemo(
    () => appointments.filter((a) => a.status === 'completed'),
    [appointments]
  );

  // KPI row
  const revenueThisMonth = useMemo(() => {
    const sessions = completed
      .filter((a) => isSameMonth(parseISO(a.start), now))
      .reduce((sum, a) => sum + (a.price || 0), 0);
    const deposits = proposals
      .filter(
        (p) =>
          ['deposit_paid', 'accepted'].includes(p.status) &&
          p.paidAt &&
          isSameMonth(parseISO(p.paidAt), now)
      )
      .reduce((sum, p) => sum + (p.deposit || 0), 0);
    return sessions + deposits;
  }, [completed, proposals]); // eslint-disable-line react-hooks/exhaustive-deps

  const avgTicket =
    completed.length > 0
      ? completed.reduce((sum, a) => sum + (a.price || 0), 0) / completed.length
      : 0;

  const retentionPct =
    clients.length > 0
      ? Math.round((clients.filter((c) => (c.visits || 0) > 1).length / clients.length) * 100)
      : 0;

  // Revenue by month — last 6 months, zero-filled
  const revenueByMonth = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const month = subMonths(now, 5 - i);
        return {
          label: format(month, 'MMM', { locale: dateLocale }),
          revenue: completed
            .filter((a) => isSameMonth(parseISO(a.start), month))
            .reduce((sum, a) => sum + (a.price || 0), 0),
        };
      }),
    [completed, dateLocale] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Revenue by artist — completed sessions
  const revenueByArtist = useMemo(
    () =>
      artists
        .map((artist) => ({
          name: artist.name,
          revenue: completed
            .filter((a) => a.artistId === artist.id)
            .reduce((sum, a) => sum + (a.price || 0), 0),
        }))
        .sort((a, b) => b.revenue - a.revenue),
    [artists, completed]
  );

  // Appointments by status
  const byStatus = useMemo(() => {
    const counts = {};
    appointments.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([status, count]) => ({ status, name: t(`reports.status.${status}`), count }))
      .sort((a, b) => b.count - a.count);
  }, [appointments, t]);

  const topClients = useMemo(
    () => [...clients].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)).slice(0, 5),
    [clients]
  );

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = [
      t('reports.csv.date'),
      t('reports.csv.client'),
      t('reports.csv.artist'),
      t('reports.csv.title'),
      t('reports.csv.duration'),
      t('reports.csv.price'),
      t('reports.csv.deposit'),
      t('reports.csv.status'),
    ];
    const rows = [...appointments]
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .map((a) =>
        [
          format(parseISO(a.start), 'yyyy-MM-dd HH:mm'),
          clientById[a.clientId]?.name || a.clientId,
          artistById[a.artistId]?.name || a.artistId,
          a.title,
          a.durationMinutes,
          a.price,
          a.deposit,
          a.status,
        ]
          .map(esc)
          .join(',')
      );
    const csv = [header.map(esc).join(','), ...rows].join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `inksync-appointments-${format(now, 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast({ description: t('reports.exported') });
  };

  return (
    <div>
      <PageHeader title={t('reports.title')} description={t('reports.description')}>
        <Button onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('reports.exportCsv')}
        </Button>
      </PageHeader>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          icon={Banknote}
          label={t('reports.kpis.revenueMonth')}
          value={money(revenueThisMonth)}
          caption={t('reports.kpis.revenueCaption')}
          delay={0}
        />
        <KpiTile
          icon={Receipt}
          label={t('reports.kpis.avgTicket')}
          value={money(Math.round(avgTicket))}
          caption={t('reports.kpis.avgTicketCaption')}
          delay={0.05}
        />
        <KpiTile
          icon={CheckCircle2}
          label={t('reports.kpis.completedSessions')}
          value={completed.length}
          caption={t('reports.kpis.completedCaption')}
          delay={0.1}
        />
        <KpiTile
          icon={Repeat}
          label={t('reports.kpis.retention')}
          value={`${retentionPct}%`}
          caption={t('reports.kpis.retentionCaption')}
          delay={0.15}
        />
      </div>

      {/* Revenue by month + status pie */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title={t('reports.charts.revenueByMonth')}
          caption={t('reports.charts.revenueByMonthCaption')}
          delay={0.1}
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} width={56} />
                <Tooltip
                  cursor={{ stroke: 'hsl(240 5% 24%)' }}
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [money(value), t('reports.charts.revenue')]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={GOLD}
                  strokeWidth={2}
                  fill="url(#goldFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: GOLD, stroke: 'hsl(240 6% 10%)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title={t('reports.charts.byStatus')}
          caption={t('reports.charts.byStatusCaption')}
          delay={0.15}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, name) => [value, name]}
                />
                <Pie
                  data={byStatus}
                  dataKey="count"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={3}
                  stroke="hsl(240 6% 10%)"
                  strokeWidth={2}
                >
                  {byStatus.map((entry, i) => (
                    <Cell
                      key={entry.status}
                      fill={i === 0 ? GOLD : MUTED_TINTS[(i - 1) % MUTED_TINTS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5">
            {byStatus.map((entry, i) => (
              <li key={entry.status} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{
                    backgroundColor: i === 0 ? GOLD : MUTED_TINTS[(i - 1) % MUTED_TINTS.length],
                  }}
                  aria-hidden="true"
                />
                <span className="flex-1 text-muted-foreground">{entry.name}</span>
                <span className="font-medium">{entry.count}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      {/* Revenue by artist + top clients */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title={t('reports.charts.revenueByArtist')}
          caption={t('reports.charts.revenueByArtistCaption')}
          delay={0.2}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueByArtist}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS_TICK} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={AXIS_TICK}
                  width={96}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(240 5% 14% / 0.5)' }}
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [money(value), t('reports.charts.revenue')]}
                />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {revenueByArtist.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={i === 0 ? GOLD : MUTED_TINTS[(i - 1) % MUTED_TINTS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title={t('reports.topClients.title')}
          caption={t('reports.topClients.caption')}
          delay={0.25}
        >
          {topClients.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{t('reports.topClients.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t('reports.topClients.client')}</TableHead>
                    <TableHead className="text-right">{t('reports.topClients.visits')}</TableHead>
                    <TableHead className="text-right">{t('reports.topClients.totalSpent')}</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {t('reports.topClients.preferredArtist')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={client.avatar} alt={client.name} />
                            <AvatarFallback>{client.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm font-medium">{client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{client.visits}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {money(client.totalSpent)}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {artistById[client.preferredArtistId]?.name || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
