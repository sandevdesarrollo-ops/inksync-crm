import React, { useState } from 'react';
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

const EMPTY = { name: '', email: '', phone: '', preferredArtistId: 'none', styles: '', notes: '' };

export default function AddClientDialog({ open, onOpenChange }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const artists = useStore((s) => s.artists);
  const add = useStore((s) => s.add);
  const logActivity = useStore((s) => s.logActivity);
  const [form, setForm] = useState(EMPTY);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    add('clients', {
      name,
      email: form.email.trim(),
      phone: form.phone.trim(),
      preferredArtistId: form.preferredArtistId === 'none' ? null : form.preferredArtistId,
      styles: form.styles.split(',').map((s) => s.trim()).filter(Boolean),
      notes: form.notes.trim(),
      visits: 0,
      totalSpent: 0,
      status: 'new',
      joinDate: new Date().toISOString(),
      lastVisit: null,
      avatar: `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(name)}`,
    });
    logActivity({ type: 'client', priority: 'low', text: t('clients.add.activityLog', { name }), link: '/clients' });
    toast({ title: t('clients.add.created'), description: t('clients.add.createdDesc', { name }) });
    setForm(EMPTY);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t('clients.add.title')}</DialogTitle>
          <DialogDescription>{t('clients.add.subtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">{t('clients.add.name')}</Label>
            <Input id="client-name" value={form.name} onChange={set('name')} placeholder={t('clients.add.namePlaceholder')} required autoFocus />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-email">{t('clients.add.email')}</Label>
              <Input id="client-email" type="email" value={form.email} onChange={set('email')} placeholder="name@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">{t('clients.add.phone')}</Label>
              <Input id="client-phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+44 …" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('clients.add.artist')}</Label>
            <Select value={form.preferredArtistId} onValueChange={(v) => setForm((f) => ({ ...f, preferredArtistId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder={t('clients.add.artistPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('clients.add.noArtist')}</SelectItem>
                {artists.filter((a) => a.active).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-styles">{t('clients.add.styles')}</Label>
            <Input id="client-styles" value={form.styles} onChange={set('styles')} placeholder={t('clients.add.stylesPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-notes">{t('clients.add.notes')}</Label>
            <Textarea id="client-notes" rows={3} value={form.notes} onChange={set('notes')} placeholder={t('clients.add.notesPlaceholder')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!form.name.trim()}>
              {t('clients.add.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
