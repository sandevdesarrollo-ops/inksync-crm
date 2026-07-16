import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// mm:ss countdown against the 15-minute hold; fires onExpire exactly once.
function useCountdown(expiresAt, onExpire) {
  const [left, setLeft] = useState(() => Math.max(0, expiresAt - Date.now()));
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const tick = () => {
      const rem = expiresAt - Date.now();
      if (rem <= 0) {
        setLeft(0);
        if (!firedRef.current) { firedRef.current = true; expireRef.current(); }
      } else {
        setLeft(rem);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return left;
}

const pad = (n) => String(n).padStart(2, '0');

// Step 3 — hold countdown + client details + required policy acknowledgment.
export default function DetailsStep({
  expiresAt, onExpire, summary, depositPercent,
  name, email, phone, notes, policy, errors, submitting,
  onField, onSubmit,
}) {
  const { t } = useTranslation();
  const left = useCountdown(expiresAt, onExpire);
  const mm = Math.floor(left / 60000);
  const ss = Math.floor((left % 60000) / 1000);

  return (
    <div>
      {/* Hold banner */}
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3',
          left < 60000 && 'border-destructive/50 bg-destructive/5',
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Timer className={cn('h-4 w-4 shrink-0', left < 60000 ? 'text-destructive' : 'text-primary')} />
          <p className="truncate text-sm">{t('publicBook.details.holdBanner')}</p>
        </div>
        <span
          className={cn(
            'shrink-0 font-display text-lg font-semibold tabular-nums',
            left < 60000 && 'text-destructive',
          )}
          aria-live="polite"
        >
          {pad(mm)}:{pad(ss)}
        </span>
      </div>

      {/* What's being booked */}
      <p className="mt-3 text-sm text-muted-foreground">{summary}</p>

      <form
        className="mt-6 space-y-4"
        noValidate
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="bk-name">{t('publicBook.details.name')}</Label>
          <Input
            id="bk-name" value={name} autoComplete="name" required
            aria-invalid={!!errors.name}
            onChange={(e) => onField('name', e.target.value)}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bk-email">{t('publicBook.details.email')}</Label>
          <Input
            id="bk-email" type="email" value={email} autoComplete="email" inputMode="email" required
            aria-invalid={!!errors.email}
            onChange={(e) => onField('email', e.target.value)}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bk-phone">{t('publicBook.details.phone')}</Label>
          <Input
            id="bk-phone" type="tel" value={phone} autoComplete="tel" inputMode="tel"
            onChange={(e) => onField('phone', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bk-notes">{t('publicBook.details.notes')}</Label>
          <Textarea
            id="bk-notes" value={notes} rows={3}
            placeholder={t('publicBook.details.notesPlaceholder')}
            onChange={(e) => onField('notes', e.target.value)}
          />
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="bk-policy"
              checked={policy}
              onCheckedChange={(v) => onField('policy', v === true)}
              aria-invalid={!!errors.policy}
              className="mt-0.5"
            />
            <Label htmlFor="bk-policy" className="cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground">
              {t('publicBook.details.policy', { percent: depositPercent })}
            </Label>
          </div>
          {errors.policy && <p className="mt-2 text-xs text-destructive">{errors.policy}</p>}
        </div>

        <Button type="submit" disabled={submitting} className="w-full gap-2 sm:w-auto">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? t('publicBook.details.submitting') : t('publicBook.details.submit')}
        </Button>
      </form>
    </div>
  );
}
