import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/lib/store';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const EMPTY = { name: '', trigger: '', channel: 'email', template: '' };

// Edit an existing campaign (pass `campaign`) or create a new one (campaign = null).
export default function NurtureCampaignDialog({ open, onOpenChange, campaign }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) {
      setForm(campaign
        ? { name: campaign.name, trigger: campaign.trigger, channel: campaign.channel, template: campaign.template }
        : EMPTY);
    }
  }, [open, campaign]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.template.trim()) return;
    const payload = {
      name: form.name.trim(),
      trigger: form.trigger.trim(),
      channel: form.channel,
      template: form.template.trim(),
    };
    if (campaign) {
      update('nurtures', campaign.id, payload);
      toast({ title: t('nurture.edit.saved') });
    } else {
      add('nurtures', { ...payload, active: true, sent: 0, opened: 0 });
      toast({ title: t('nurture.edit.created') });
    }
    onOpenChange(false);
  };

  // Literal placeholders — passed as interpolation values so i18next
  // renders "{{name}}" / "{{artist}}" verbatim in the hint.
  const lit = { name: '{{name}}', artist: '{{artist}}' };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {campaign ? t('nurture.edit.titleEdit') : t('nurture.edit.titleNew')}
          </DialogTitle>
          <DialogDescription>{t('nurture.edit.subtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">{t('nurture.edit.name')}</Label>
            <Input id="campaign-name" value={form.name} onChange={set('name')} placeholder={t('nurture.edit.namePlaceholder')} required autoFocus />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-trigger">{t('nurture.edit.trigger')}</Label>
              <Input id="campaign-trigger" value={form.trigger} onChange={set('trigger')} placeholder={t('nurture.edit.triggerPlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label>{t('nurture.edit.channelLabel')}</Label>
              <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">{t('nurture.channel.email')}</SelectItem>
                  <SelectItem value="whatsapp">{t('nurture.channel.whatsapp')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-template">{t('nurture.edit.template')}</Label>
            <Textarea
              id="campaign-template"
              rows={5}
              value={form.template}
              onChange={set('template')}
              placeholder={t('nurture.edit.templatePlaceholder', lit)}
              required
            />
            <p className="text-xs text-muted-foreground">{t('nurture.edit.placeholderHint', lit)}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!form.name.trim() || !form.template.trim()}>
              {campaign ? t('nurture.edit.save') : t('nurture.edit.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
