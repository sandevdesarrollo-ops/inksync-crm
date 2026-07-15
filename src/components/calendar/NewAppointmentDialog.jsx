import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, formatISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useStore } from '@/lib/store';
import { dateLocale } from '@/components/calendar/calendarUtils';

export default function NewAppointmentDialog({ open, onOpenChange, defaultDate }) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const clients = useStore((s) => s.clients);
  const artists = useStore((s) => s.artists);
  const settings = useStore((s) => s.settings);
  const add = useStore((s) => s.add);
  const logActivity = useStore((s) => s.logActivity);

  const [clientId, setClientId] = useState('');
  const [artistId, setArtistId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(settings.defaultSessionMinutes || 120);
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [depositTouched, setDepositTouched] = useState(false);
  const [notes, setNotes] = useState('');

  // Reset form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setClientId('');
    setArtistId('');
    setTitle('');
    setDate(format(defaultDate || new Date(), 'yyyy-MM-dd'));
    setTime(settings.openTime || '10:00');
    setDuration(settings.defaultSessionMinutes || 120);
    setPrice('');
    setDeposit('');
    setDepositTouched(false);
    setNotes('');
  }, [open, defaultDate, settings.openTime, settings.defaultSessionMinutes]);

  const handlePrice = (value) => {
    setPrice(value);
    if (!depositTouched) {
      const p = parseFloat(value);
      setDeposit(
        Number.isFinite(p) && p > 0
          ? String(Math.round((p * (settings.depositPercent || 0)) / 100))
          : ''
      );
    }
  };

  const save = () => {
    if (!clientId || !artistId || !title.trim() || !date || !time) {
      toast({
        variant: 'destructive',
        title: t('calendar.toast.missingFields'),
        description: t('calendar.toast.missingFieldsDesc'),
      });
      return;
    }
    // Build a local Date from the date + time inputs, store as ISO with offset.
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const start = new Date(y, m - 1, d, hh, mm, 0, 0);

    const record = {
      clientId,
      artistId,
      title: title.trim(),
      start: formatISO(start),
      durationMinutes: parseInt(duration, 10) || settings.defaultSessionMinutes || 60,
      price: parseFloat(price) || 0,
      deposit: parseFloat(deposit) || 0,
      status: 'pending',
      notes: notes.trim(),
    };
    add('appointments', record);

    const client = clients.find((c) => c.id === clientId);
    logActivity({
      type: 'appointment',
      priority: 'medium',
      text: t('calendar.activity.created', { client: client?.name, title: record.title }),
      link: '/calendar',
    });
    toast({
      title: t('calendar.toast.created'),
      description: t('calendar.toast.createdDesc', {
        title: record.title,
        date: format(start, 'd MMM, HH:mm', { locale: dateLocale(i18n.language) }),
      }),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t('calendar.newAppointment')}</DialogTitle>
          <DialogDescription>{t('calendar.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="ap-client">{t('calendar.form.client')}</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="ap-client">
                <SelectValue placeholder={t('calendar.form.selectClient')} />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={c.avatar} alt={c.name} />
                        <AvatarFallback>{c.name[0]}</AvatarFallback>
                      </Avatar>
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ap-artist">{t('calendar.form.artist')}</Label>
            <Select value={artistId} onValueChange={setArtistId}>
              <SelectTrigger id="ap-artist">
                <SelectValue placeholder={t('calendar.form.selectArtist')} />
              </SelectTrigger>
              <SelectContent>
                {artists.filter((a) => a.active).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={a.avatar} alt={a.name} />
                        <AvatarFallback>{a.name[0]}</AvatarFallback>
                      </Avatar>
                      {a.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ap-title">{t('calendar.form.titleLabel')}</Label>
            <Input
              id="ap-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('calendar.form.titlePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ap-date">{t('calendar.form.date')}</Label>
              <Input id="ap-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ap-time">{t('calendar.form.time')}</Label>
              <Input id="ap-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ap-duration">{t('calendar.form.duration')}</Label>
              <Input
                id="ap-duration"
                type="number"
                min="15"
                step="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ap-price">{t('calendar.form.price')}</Label>
              <Input
                id="ap-price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => handlePrice(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ap-deposit">{t('calendar.form.deposit')}</Label>
              <Input
                id="ap-deposit"
                type="number"
                min="0"
                value={deposit}
                onChange={(e) => {
                  setDepositTouched(true);
                  setDeposit(e.target.value);
                }}
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            {t('calendar.form.depositHint', { percent: settings.depositPercent })}
          </p>

          <div className="grid gap-2">
            <Label htmlFor="ap-notes">{t('calendar.form.notes')}</Label>
            <Textarea
              id="ap-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('calendar.form.notesPlaceholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save}>{t('calendar.form.create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
