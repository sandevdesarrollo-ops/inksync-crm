import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye } from 'lucide-react';
import { fmtMoney } from '@/lib/store';

// One public design card: image, title, style, artist, "from" price
// (cheapest active variant) and the two client actions.
export default function DesignCard({ design, artist, variants, studio, onTryOn, onConsult }) {
  const { t } = useTranslation();
  const prices = variants
    .filter((v) => v.design_id === design.id)
    .map((v) => Number(v.price))
    .filter((p) => !Number.isNaN(p));
  const minPrice = prices.length ? Math.min(...prices) : null;
  const bookTo = `/s/${studio.slug}/book?design=${design.id}${
    design.artist_id ? `&artist=${design.artist_id}` : ''
  }`;

  return (
    <div className="group mb-5 break-inside-avoid overflow-hidden rounded-xl border border-border bg-card transition-colors duration-200 hover:border-primary/40">
      <div className="overflow-hidden">
        <img
          src={design.image}
          alt={design.title}
          loading="lazy"
          className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold leading-tight">{design.title}</h3>
          {design.style && <Badge variant="secondary" className="shrink-0">{design.style}</Badge>}
        </div>

        <div className="flex items-center justify-between gap-2">
          {artist ? (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={artist.avatar} alt={artist.name} />
                <AvatarFallback className="text-[10px]">{artist.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="truncate text-sm text-muted-foreground">{artist.name}</span>
            </div>
          ) : (
            <span />
          )}
          <span className="shrink-0 text-sm font-medium">
            {minPrice != null
              ? t('publicSite.designs.from', { price: fmtMoney(minPrice, studio.currency) })
              : t('publicSite.designs.consultation')}
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          {minPrice != null ? (
            <Button asChild size="sm" className="flex-1">
              <Link to={bookTo}>{t('publicSite.designs.tattooThis')}</Link>
            </Button>
          ) : (
            <Button size="sm" className="flex-1" onClick={() => onConsult(design)}>
              {t('publicSite.designs.requestConsult')}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onTryOn(design)}>
            <Eye className="mr-1.5 h-4 w-4" />
            {t('publicSite.designs.tryOn')}
          </Button>
        </div>
      </div>
    </div>
  );
}
