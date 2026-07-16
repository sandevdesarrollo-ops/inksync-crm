import React, { useMemo, useState } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createBooking, createHold, fetchSlots } from '@/lib/publicApi';
import Stepper from './components/booking/Stepper';
import DesignStep from './components/booking/DesignStep';
import ScheduleStep from './components/booking/ScheduleStep';
import DetailsStep from './components/booking/DetailsStep';
import ConfirmStep from './components/booking/ConfirmStep';

const HOLD_MS = 15 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public booking wizard: Design → Artist & time → Your details → Confirmed.
export default function PublicBookingPage() {
  const { studio, artists, designs, variants } = useOutletContext();
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();

  // Validate query params once against the bundle.
  const initial = useMemo(() => {
    const design = designs.find((d) => d.id === params.get('design')) || null;
    const variant = design
      ? variants.find((v) => v.id === params.get('variant') && v.design_id === design.id) || null
      : null;
    const paramArtist = params.get('artist');
    const artistId =
      (paramArtist && artists.some((a) => a.id === paramArtist) && paramArtist) ||
      (design?.artist_id && artists.some((a) => a.id === design.artist_id) && design.artist_id) ||
      null;
    return { designId: design?.id || null, variantId: variant?.id || null, artistId };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [s, setS] = useState({
    step: 1,
    designId: initial.designId,
    variantId: initial.variantId,
    consultation: false,
    artistId: initial.artistId,
    day: null,
    slots: null,
    slotsLoading: false,
    pendingSlot: null,
    holding: false,
    holdId: null,
    holdExpiresAt: null,
    slot: null,
    name: '',
    email: '',
    phone: '',
    notes: '',
    policy: false,
    errors: {},
    submitting: false,
    result: null,
  });
  const patch = (p) => setS((prev) => ({ ...prev, ...p }));

  const design = designs.find((d) => d.id === s.designId) || null;
  const variant = variants.find((v) => v.id === s.variantId) || null;
  const artist = artists.find((a) => a.id === s.artistId) || null;
  // Variant drives duration; null lets the RPC apply the studio default (consultation path).
  const slotDuration = variant ? variant.duration_minutes : null;
  const holdDuration = variant ? variant.duration_minutes : 120;
  const bookingTitle = design ? design.title : t('publicBook.confirmed.consultation');

  const stepLabels = [
    t('publicBook.steps.design'),
    t('publicBook.steps.schedule'),
    t('publicBook.steps.details'),
    t('publicBook.steps.confirmed'),
  ];

  const genericError = () =>
    toast({ variant: 'destructive', description: t('publicBook.errors.generic') });

  async function loadSlots(day, artistId) {
    patch({ day, slots: null, slotsLoading: true, pendingSlot: null });
    try {
      const slots = await fetchSlots({ studioId: studio.id, artistId, day, durationMinutes: slotDuration });
      patch({ slots, slotsLoading: false });
    } catch {
      patch({ slots: [], slotsLoading: false });
      genericError();
    }
  }

  function selectArtist(artistId) {
    if (artistId === s.artistId) return;
    if (s.day) {
      patch({ artistId });
      loadSlots(s.day, artistId);
    } else {
      patch({ artistId, slots: null, pendingSlot: null });
    }
  }

  async function pickSlot(iso) {
    patch({ pendingSlot: iso, holding: true });
    try {
      const holdId = await createHold({
        studioId: studio.id,
        artistId: s.artistId,
        variantId: s.variantId,
        clientEmail: '',
        startAt: iso,
        durationMinutes: holdDuration,
      });
      patch({
        holdId, slot: iso, holdExpiresAt: Date.now() + HOLD_MS,
        holding: false, pendingSlot: null, policy: false, errors: {}, step: 3,
      });
    } catch {
      patch({ holding: false, pendingSlot: null });
      toast({ variant: 'destructive', description: t('publicBook.schedule.holdFailed') });
      loadSlots(s.day, s.artistId);
    }
  }

  // hold_expired / slot_taken / countdown at zero → back to slots with a fresh fetch.
  function recoverToSlots(errorKey) {
    toast({ variant: 'destructive', description: t(`publicBook.errors.${errorKey}`) });
    setS((prev) => ({
      ...prev, step: 2, holdId: null, holdExpiresAt: null, slot: null, submitting: false,
    }));
    if (s.day) loadSlots(s.day, s.artistId);
  }

  async function submit() {
    const errors = {};
    if (!s.name.trim()) errors.name = t('publicBook.details.nameRequired');
    if (!EMAIL_RE.test(s.email.trim())) errors.email = t('publicBook.details.emailInvalid');
    if (!s.policy) errors.policy = t('publicBook.details.policyRequired');
    if (Object.keys(errors).length) { patch({ errors }); return; }

    patch({ errors: {}, submitting: true });
    try {
      const res = await createBooking({
        holdId: s.holdId,
        name: s.name.trim(),
        email: s.email.trim(),
        phone: s.phone.trim() || null,
        notes: s.notes.trim() || null,
        title: bookingTitle,
        variantId: s.variantId,
        designId: s.designId,
      });
      if (res?.ok) {
        patch({ result: res, submitting: false, holdExpiresAt: null, step: 4 });
      } else if (res?.error === 'hold_expired' || res?.error === 'slot_taken') {
        recoverToSlots(res.error === 'hold_expired' ? 'holdExpired' : 'slotTaken');
      } else {
        patch({ submitting: false });
        genericError();
      }
    } catch {
      patch({ submitting: false });
      genericError();
    }
  }

  function goBack() {
    if (s.step === 2) {
      patch({ step: 1 });
    } else if (s.step === 3) {
      // Abandon the hold; refresh availability so the released picture is honest.
      patch({ step: 2, holdId: null, holdExpiresAt: null, slot: null });
      if (s.day) loadSlots(s.day, s.artistId);
    }
  }

  const whenSummary = s.slot
    ? new Intl.DateTimeFormat(i18n.language, {
        timeZone: studio.timezone,
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      }).format(new Date(s.slot))
    : '';

  const motionProps = reduceMotion
    ? { initial: false, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.2, ease: 'easeOut' },
      };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-semibold">{t('publicBook.pageTitle')}</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">
        {t('publicBook.pageSubtitle', { studio: studio.name })}
      </p>

      <Stepper
        labels={stepLabels}
        current={s.step}
        stepText={t('publicBook.stepLabel', { current: s.step, total: 4 })}
      />

      {(s.step === 2 || s.step === 3) && (
        <Button variant="ghost" size="sm" className="-ml-2 mb-4 gap-1.5" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
          {t('publicBook.back')}
        </Button>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={s.step} {...motionProps}>
          {s.step === 1 && (
            <DesignStep
              designs={designs}
              variants={variants}
              currency={studio.currency}
              designId={s.designId}
              variantId={s.variantId}
              consultation={s.consultation}
              onPickDesign={(id) => patch({ designId: id, variantId: null, consultation: false })}
              onPickConsultation={() => patch({ consultation: true, designId: null, variantId: null })}
              onPickVariant={(id) => patch({ variantId: id })}
              onClearDesign={() => patch({ designId: null, variantId: null, consultation: false })}
              onContinue={() => {
                const nextArtist =
                  s.artistId ||
                  (design?.artist_id && artists.some((a) => a.id === design.artist_id) ? design.artist_id : null);
                // Duration may have changed with the variant → any cached slots are stale.
                patch({ step: 2, artistId: nextArtist, day: null, slots: null, pendingSlot: null });
              }}
            />
          )}

          {s.step === 2 && (
            <ScheduleStep
              studio={studio}
              artists={artists}
              artistId={s.artistId}
              day={s.day}
              slots={s.slots}
              slotsLoading={s.slotsLoading}
              pendingSlot={s.pendingSlot}
              holding={s.holding}
              onSelectArtist={selectArtist}
              onSelectDay={(day) => loadSlots(day, s.artistId)}
              onPickSlot={pickSlot}
            />
          )}

          {s.step === 3 && (
            <DetailsStep
              expiresAt={s.holdExpiresAt}
              onExpire={() => recoverToSlots('holdExpired')}
              summary={`${bookingTitle}${variant ? ` · ${variant.size_cm} cm` : ` · ${t('publicBook.design.approxDuration')}`} · ${artist?.name || ''} · ${whenSummary}`}
              depositPercent={studio.deposit_percent}
              name={s.name}
              email={s.email}
              phone={s.phone}
              notes={s.notes}
              policy={s.policy}
              errors={s.errors}
              submitting={s.submitting}
              onField={(field, value) => patch({ [field]: value })}
              onSubmit={submit}
            />
          )}

          {s.step === 4 && s.result && (
            <ConfirmStep
              studio={studio}
              slug={slug}
              design={design}
              variant={variant}
              artist={artist}
              result={s.result}
              email={s.email.trim()}
              bookingTitle={bookingTitle}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
