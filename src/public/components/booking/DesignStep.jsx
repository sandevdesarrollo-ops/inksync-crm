import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Clock, ImageOff, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fmtMoney } from '@/lib/store';

const cardFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

// Step 1 — pick a design (or a consultation), then one of its variants.
export default function DesignStep({
  designs, variants, currency, designId, variantId, consultation,
  onPickDesign, onPickConsultation, onPickVariant, onClearDesign, onContinue,
}) {
  const { t } = useTranslation();
  const design = designs.find((d) => d.id === designId) || null;
  const designVariants = design ? variants.filter((v) => v.design_id === design.id) : [];
  const canContinue = consultation || (design && (variantId || designVariants.length === 0));

  // --- Mode A: compact design picker grid (no design chosen yet) ---
  if (!design && !consultation) {
    return (
      <div>
        <h2 className="font-display text-2xl font-semibold">{t('publicBook.design.pickTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('publicBook.design.pickHint')}</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={onPickConsultation}
            className={cn(
              'flex flex-col items-start justify-between gap-3 rounded-lg border border-dashed p-4 text-left transition-colors duration-200 hover:border-primary/70',
              cardFocus,
            )}
          >
            <MessagesSquare className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-medium">{t('publicBook.design.consultCard')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('publicBook.design.consultCardDesc')}</p>
            </div>
          </button>
          {designs.map((d) => {
            const prices = variants.filter((v) => v.design_id === d.id).map((v) => Number(v.price)).filter((p) => p > 0);
            const minPrice = prices.length ? Math.min(...prices) : (d.price || null);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onPickDesign(d.id)}
                className={cn(
                  'group overflow-hidden rounded-lg border text-left transition-colors duration-200 hover:border-primary/70',
                  cardFocus,
                )}
              >
                {d.image ? (
                  <img
                    src={d.image}
                    alt={d.title}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-muted">
                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {minPrice != null
                      ? t('publicBook.design.from', { price: fmtMoney(minPrice, currency) })
                      : d.style}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Mode B: consultation chosen ---
  if (consultation) {
    return (
      <div>
        <h2 className="font-display text-2xl font-semibold">{t('publicBook.design.consultSelectedTitle')}</h2>
        <div className="mt-4 flex items-start gap-4 rounded-lg border border-primary/40 bg-primary/5 p-5">
          <MessagesSquare className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div>
            <p className="text-sm">{t('publicBook.design.consultSelectedDesc')}</p>
            <Badge variant="secondary" className="mt-3 gap-1">
              <Clock className="h-3 w-3" />
              {t('publicBook.design.approxDuration')}
            </Badge>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={onClearDesign}>{t('publicBook.design.change')}</Button>
          <Button onClick={onContinue} className="gap-2">
            {t('publicBook.continue')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // --- Mode C: design chosen → variant radio cards ---
  return (
    <div>
      <div className="flex items-center gap-4">
        {design.image ? (
          <img src={design.image} alt={design.title} className="h-16 w-16 shrink-0 rounded-lg border object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border bg-muted">
            <ImageOff className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-xl font-semibold">{design.title}</h2>
          {design.style && <p className="truncate text-sm text-muted-foreground">{design.style}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={onClearDesign}>{t('publicBook.design.change')}</Button>
      </div>

      <h3 className="mt-7 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {t('publicBook.design.variantTitle')}
      </h3>

      {designVariants.length === 0 ? (
        <div className="mt-3 flex items-start gap-3 rounded-lg border border-dashed p-4">
          <MessagesSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">{t('publicBook.design.noVariants')}</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2.5" role="radiogroup" aria-label={t('publicBook.design.variantTitle')}>
          {designVariants.map((v) => {
            const selected = v.id === variantId;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onPickVariant(v.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg border p-4 text-left transition-colors duration-200 hover:border-primary/60',
                  selected && 'border-primary bg-primary/5 ring-1 ring-primary',
                  cardFocus,
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {v.size_cm} cm · {(v.placements || []).join(', ')}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {t('publicBook.design.minutes', { count: v.duration_minutes })}
                  </p>
                </div>
                <span className="shrink-0 font-display text-lg font-semibold">{fmtMoney(v.price, currency)}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={onContinue} disabled={!canContinue} className="w-full gap-2 sm:w-auto">
          {t('publicBook.continue')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
