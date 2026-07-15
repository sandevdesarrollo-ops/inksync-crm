import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { Crown, Phone, Plus, Search, UserPlus, Users, UserX } from 'lucide-react';
import { useStore, fmtMoney } from '@/lib/store';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/clients/StatusBadge';
import AddClientDialog from '@/components/clients/AddClientDialog';
import ClientDetailSheet from '@/components/clients/ClientDetailSheet';
import { dateLocale } from '@/components/clients/dateLocale';

const FILTERS = ['all', 'new', 'active', 'vip', 'inactive'];

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

export default function ClientsPage() {
  const { t, i18n } = useTranslation();
  const locale = dateLocale(i18n.language);
  const clients = useStore((s) => s.clients);
  const artists = useStore((s) => s.artists);
  const settings = useStore((s) => s.settings);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const artistById = useMemo(
    () => Object.fromEntries(artists.map((a) => [a.id, a])),
    [artists]
  );

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: clients.length,
      vips: clients.filter((c) => c.status === 'vip').length,
      newThisMonth: clients.filter((c) => c.joinDate && differenceInDays(now, new Date(c.joinDate)) <= 30).length,
      inactive: clients.filter((c) => c.status === 'inactive').length,
    };
  }, [clients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (filter !== 'all' && c.status !== filter) return false;
      if (!q) return true;
      return [c.name, c.email, c.phone].some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [clients, query, filter]);

  const lastVisitLabel = (c) =>
    c.lastVisit
      ? formatDistanceToNow(new Date(c.lastVisit), { addSuffix: true, locale })
      : t('clients.detail.never');

  const statCards = [
    { key: 'total', icon: Users, value: stats.total },
    { key: 'vips', icon: Crown, value: stats.vips },
    { key: 'newThisMonth', icon: UserPlus, value: stats.newThisMonth },
    { key: 'inactive', icon: UserX, value: stats.inactive },
  ];

  return (
    <div>
      <PageHeader title={t('clients.title')} description={t('clients.description')}>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t('clients.addClient')}
        </Button>
      </PageHeader>

      {/* Stats strip */}
      <motion.div {...fade} className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ key, icon: Icon, value }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl font-semibold leading-none">{value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{t(`clients.stats.${key}`)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Search + filter chips */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('clients.searchPlaceholder')}
            className="pl-9"
            aria-label={t('common.search')}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                filter === f
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {t(`clients.filters.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <motion.div {...fade} className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Users className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">{t('clients.empty.title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('clients.empty.hint')}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => { setQuery(''); setFilter('all'); }}>
            {t('clients.empty.action')}
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Desktop table */}
          <motion.div {...fade} className="hidden overflow-hidden rounded-lg border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('clients.table.client')}</TableHead>
                  <TableHead>{t('clients.table.phone')}</TableHead>
                  <TableHead className="text-right">{t('clients.table.visits')}</TableHead>
                  <TableHead className="text-right">{t('clients.table.spent')}</TableHead>
                  <TableHead>{t('clients.table.artist')}</TableHead>
                  <TableHead>{t('clients.table.status')}</TableHead>
                  <TableHead>{t('clients.table.lastVisit')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const artist = artistById[c.preferredArtistId];
                  return (
                    <TableRow
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className="cursor-pointer transition-colors"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') setSelectedId(c.id); }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={c.avatar} alt={c.name} />
                            <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{c.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.phone}</TableCell>
                      <TableCell className="text-right text-sm">{c.visits}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {fmtMoney(c.totalSpent, settings.currency)}
                      </TableCell>
                      <TableCell>
                        {artist ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={artist.avatar} alt={artist.name} />
                              <AvatarFallback>{artist.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{artist.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lastVisitLabel(c)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </motion.div>

          {/* Mobile cards */}
          <motion.div {...fade} className="space-y-3 md:hidden">
            {filtered.map((c) => {
              const artist = artistById[c.preferredArtistId];
              return (
                <Card
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(c.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelectedId(c.id); }}
                  className="cursor-pointer transition-colors duration-200 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={c.avatar} alt={c.name} />
                        <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-medium">{c.name}</p>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                        {c.phone && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                      <span>{t('clients.table.visits')}: <span className="font-medium text-foreground">{c.visits}</span></span>
                      <span className="font-medium text-foreground">{fmtMoney(c.totalSpent, settings.currency)}</span>
                      <span>{lastVisitLabel(c)}</span>
                    </div>
                    {artist && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={artist.avatar} alt={artist.name} />
                          <AvatarFallback>{artist.name[0]}</AvatarFallback>
                        </Avatar>
                        {artist.name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        </>
      )}

      <AddClientDialog open={addOpen} onOpenChange={setAddOpen} />
      <ClientDetailSheet
        clientId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
      />
    </div>
  );
}
