import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/lib/store';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const blank = { clientId: '', artistId: '', title: '', amount: '', deposit: '', notes: '' };

// "New proposal" dialog — deposit auto-calculated from settings.depositPercent
// but stays editable (manual edits stop the auto-calc).
export default function NewProposalDialog({ open, onOpenChange }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const clients = useStore((s) => s.clients);
  const artists = useStore((s) => s.artists);
  const settings = useStore((s) => s.settings);
  const add = useStore((s) => s.add);

  const [form, setForm] = useState(blank);
  const [depositTouched, setDepositTouched] = useState(false);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onAmountChange = (value) => {
    setForm((f) => ({
      ...f,
      amount: value,
      deposit: depositTouched
        ? f.deposit
        : value === '' ? '' : String(Math.round((Number(value) * settings.depositPercent) / 100)),
    }));
  };

  const valid =
    form.clientId && form.artistId && form.title.trim() && Number(form.amount) > 0;

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    add('proposals', {
      clientId: form.clientId,
      artistId: form.artistId,
      title: form.title.trim(),
      amount: Number(form.amount),
      deposit: Number(form.deposit) || 0,
      status: 'draft',
      sentAt: null,
      depositLink: null,
      notes: form.notes.trim(),
    });
    toast({ title: t('proposals.toast.created') });
    setForm(blank);
    setDepositTouched(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t('proposals.dialog.title')}</DialogTitle>
          <DialogDescription>{t('proposals.dialog.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('proposals.dialog.client')}</Label>
              <Select value={form.clientId} onValueChange={(v) => setField('clientId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('proposals.dialog.clientPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('proposals.dialog.artist')}</Label>
              <Select value={form.artistId} onValueChange={(v) => setField('artistId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('proposals.dialog.artistPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {artists.filter((a) => a.active).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposal-title">{t('proposals.dialog.proposalTitle')}</Label>
            <Input
              id="proposal-title"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder={t('proposals.dialog.titlePlaceholder')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proposal-amount">{t('proposals.dialog.amount')}</Label>
              <Input
                id="proposal-amount"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => onAmountChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal-deposit">
                {t('proposals.dialog.deposit', { percent: settings.depositPercent })}
              </Label>
              <Input
                id="proposal-deposit"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.deposit}
                onChange={(e) => { setDepositTouched(true); setField('deposit', e.target.value); }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposal-notes">{t('proposals.dialog.notes')}</Label>
            <Textarea
              id="proposal-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder={t('proposals.dialog.notesPlaceholder')}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!valid}>
              {t('proposals.dialog.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
