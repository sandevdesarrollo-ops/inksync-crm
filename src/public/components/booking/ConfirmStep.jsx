import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CalendarPlus, CheckCircle2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { fmtMoney } from '@/lib/store';
import { downloadIcs } from '@/lib/publicApi';

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

// Step 4 — booking confirmed: summary card, .ics download, email note, way back.
export default function ConfirmStep({ studio, slug, design, variant, artist, result, email, bookingTitle }) {
  const { t, i18n } = useTranslation();

  const whenText = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, {
      timeZone: studio.timezone,
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(result.start_at)),
    [i18n.language, studio.timezone, result.start_at],
  );

  const price = Number(result.price) || 0;
  const deposit = Number(result.deposit) || 0;
  const designLabel = design
    ? (variant ? `${design.title} · ${variant.size_cm} cm` : design.title)
    : t('publicBook.confirmed.consultation');

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mt-4 font-display text-3xl font-semibold">{t('publicBook.confirmed.title')}</h2>
      <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <MailCheck className="h-4 w-4 shrink-0 text-primary" />
        {t('publicBook.confirmed.emailNote', { email })}
      </p>

      <div className="mt-6 rounded-lg border p-5 text-left">
        <Row label={t('publicBook.confirmed.design')} value={designLabel} />
        <Separator />
        <Row label={t('publicBook.confirmed.artist')} value={artist?.name || '—'} />
        <Separator />
        <Row label={t('publicBook.confirmed.when')} value={whenText} />
        {price > 0 && (
          <>
            <Separator />
            <Row label={t('publicBook.confirmed.price')} value={fmtMoney(price, studio.currency)} />
            <Separator />
            <Row
              label={t('publicBook.confirmed.deposit', { percent: studio.deposit_percent })}
              value={<span className="font-display text-base font-semibold">{fmtMoney(deposit, studio.currency)}</span>}
            />
          </>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          className="gap-2"
          onClick={() => downloadIcs({
            title: bookingTitle,
            start: result.start_at,
            durationMinutes: result.duration_minutes || 120,
            studioName: studio.name,
            address: studio.address,
          })}
        >
          <CalendarPlus className="h-4 w-4" />
          {t('publicBook.confirmed.addToCalendar')}
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link to={`/s/${slug}`}>
            <ArrowLeft className="h-4 w-4" />
            {t('publicBook.confirmed.backToStudio', { studio: studio.name })}
          </Link>
        </Button>
      </div>
    </div>
  );
}
