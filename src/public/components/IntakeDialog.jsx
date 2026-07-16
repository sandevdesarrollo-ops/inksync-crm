import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { submitIntake } from '@/lib/publicApi';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ANY = '__any__';

const emptyForm = {
  name: '', email: '', phone: '', artistId: ANY, placement: '',
  sizeCm: '', budgetMin: '', budgetMax: '', description: '',
};

// Structured custom-tattoo brief. Pass `artistId` to pre-select an
// artist (e.g. from the artist page).
export default function IntakeDialog({ studio, artists, open, onOpenChange, artistId = null }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, artistId: artistId || ANY });
      setDone(false);
    }
  }, [open, artistId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const valid = form.name.trim() && EMAIL_RE.test(form.email) && form.description.trim();
  const presetArtist = artists.find((a) => a.id === artistId);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    try {
      await submitIntake({
        studioId: studio.id,
        artistId: form.artistId === ANY ? null : form.artistId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        placement: form.placement.trim() || null,
        approxSizeCm: form.sizeCm ? Number(form.sizeCm) : null,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
        description: form.description.trim(),
      });
      setDone(true);
    } catch {
      toast({ variant: 'destructive', description: t('publicSite.intake.error') });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="font-display text-2xl font-semibold">{t('publicSite.intake.successTitle')}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t('publicSite.intake.successBody', { name: form.name.trim(), email: form.email.trim() })}
            </p>
            <Button className="mt-2" onClick={() => onOpenChange(false)}>
              {t('publicSite.intake.close')}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {presetArtist
                  ? t('publicSite.intake.titleWith', { name: presetArtist.name })
                  : t('publicSite.intake.title')}
              </DialogTitle>
              <DialogDescription>{t('publicSite.intake.description')}</DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="intake-name">{t('publicSite.intake.name')}</Label>
                  <Input id="intake-name" required value={form.name} onChange={set('name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intake-email">{t('publicSite.intake.email')}</Label>
                  <Input id="intake-email" type="email" required value={form.email} onChange={set('email')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intake-phone">{t('publicSite.intake.phone')}</Label>
                  <Input id="intake-phone" type="tel" value={form.phone} onChange={set('phone')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('publicSite.intake.artist')}</Label>
                  <Select
                    value={form.artistId}
                    onValueChange={(v) => setForm((f) => ({ ...f, artistId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>{t('publicSite.intake.anyArtist')}</SelectItem>
                      {artists.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intake-placement">{t('publicSite.intake.placement')}</Label>
                  <Input
                    id="intake-placement"
                    value={form.placement}
                    onChange={set('placement')}
                    placeholder={t('publicSite.intake.placementPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intake-size">{t('publicSite.intake.size')}</Label>
                  <Input
                    id="intake-size"
                    type="number"
                    min="1"
                    max="100"
                    value={form.sizeCm}
                    onChange={set('sizeCm')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('publicSite.intake.budget')} ({studio.currency})</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={form.budgetMin}
                    onChange={set('budgetMin')}
                    placeholder={t('publicSite.intake.budgetMin')}
                    aria-label={t('publicSite.intake.budgetMin')}
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="number"
                    min="0"
                    value={form.budgetMax}
                    onChange={set('budgetMax')}
                    placeholder={t('publicSite.intake.budgetMax')}
                    aria-label={t('publicSite.intake.budgetMax')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intake-desc">{t('publicSite.intake.describe')}</Label>
                <Textarea
                  id="intake-desc"
                  required
                  rows={4}
                  value={form.description}
                  onChange={set('description')}
                  placeholder={t('publicSite.intake.describePlaceholder')}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={!valid || sending}>
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('publicSite.intake.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t('publicSite.intake.submit')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
