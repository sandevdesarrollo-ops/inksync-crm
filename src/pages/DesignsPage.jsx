import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useStore, fmtMoney } from '@/lib/store';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';
import DesignFormDialog from '@/components/designs/DesignFormDialog';
import DesignDetailDialog from '@/components/designs/DesignDetailDialog';
import TryOnModal from '@/components/designs/TryOnModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Heart, Palette } from 'lucide-react';

export default function DesignsPage() {
  const { t } = useTranslation();
  const designs = useStore((s) => s.designs);
  const artists = useStore((s) => s.artists);
  const settings = useStore((s) => s.settings);

  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState('all');
  const [artistFilter, setArtistFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [tryOnId, setTryOnId] = useState(null);

  const styles = useMemo(
    () => [...new Set(designs.map((d) => d.style).filter(Boolean))],
    [designs]
  );

  const filtered = designs.filter(
    (d) =>
      (styleFilter === 'all' || d.style === styleFilter) &&
      (artistFilter === 'all' || d.artistId === artistFilter) &&
      d.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  const artistById = (id) => artists.find((a) => a.id === id);
  const detail = designs.find((d) => d.id === detailId);
  const tryOn = designs.find((d) => d.id === tryOnId);

  const clearFilters = () => {
    setSearch('');
    setStyleFilter('all');
    setArtistFilter('all');
  };

  const openTryOn = (design) => {
    setDetailId(null);
    setTryOnId(design.id);
  };

  return (
    <div>
      <PageHeader title={t('designs.title')} description={t('designs.description')}>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('designs.addDesign')}
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('designs.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <Select value={artistFilter} onValueChange={setArtistFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('designs.allArtists')}</SelectItem>
            {artists.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {['all', ...styles].map((s) => {
          const active = styleFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStyleFilter(s)}
              className={cn(
                'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              )}
            >
              {s === 'all' ? t('designs.allStyles') : s}
            </button>
          );
        })}
      </div>

      {/* Gallery */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Palette className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{t('designs.empty.title')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('designs.empty.text')}</p>
          </div>
          <Button variant="outline" onClick={clearFilters}>
            {t('designs.empty.clear')}
          </Button>
        </div>
      ) : (
        <div className="columns-2 gap-4 md:columns-3 xl:columns-4">
          {filtered.map((d, i) => {
            const artist = artistById(d.artistId);
            return (
              <motion.button
                key={d.id}
                type="button"
                onClick={() => setDetailId(d.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3), ease: 'easeOut' }}
                className="group mb-4 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-lg border border-border bg-card text-left transition-colors duration-200 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={d.image}
                    alt={d.title}
                    loading="lazy"
                    className="w-full transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                  <Badge variant="secondary" className="absolute left-2 top-2 bg-background/85">
                    {d.style}
                  </Badge>
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug">{d.title}</p>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Heart className="h-3.5 w-3.5" />
                      {d.likes || 0}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={artist?.avatar} alt={artist?.name} />
                        <AvatarFallback className="text-[9px]">
                          {artist?.name?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{artist?.name}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">
                      {fmtMoney(d.price, settings.currency)}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <DesignFormDialog open={addOpen} onOpenChange={setAddOpen} artists={artists} />
      <DesignDetailDialog
        design={detail}
        artist={detail ? artistById(detail.artistId) : null}
        currency={settings.currency}
        open={!!detail}
        onOpenChange={(v) => !v && setDetailId(null)}
        onTryOn={openTryOn}
      />
      <TryOnModal
        design={tryOn}
        open={!!tryOn}
        onOpenChange={(v) => !v && setTryOnId(null)}
      />
    </div>
  );
}
