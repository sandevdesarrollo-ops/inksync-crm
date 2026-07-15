import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addMinutes, format, parseISO } from 'date-fns';
import { BadgeCheck, CheckCircle2, Clock, StickyNote, Trash2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useStore, fmtMoney } from '@/lib/store';
import { cn } from '@/lib/utils';
import { statusStyle, dateLocale } from '@/components/calendar/calendarUtils';

export default function AppointmentDetailDialog({ appointmentId, open, onOpenChange }) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const appointment = useStore((s) => s.appointments.find((a) => a.id === appointmentId));
  const client = useStore((s) => s.clients.find((c) => c.id === appointment?.clientId));
  const artist = useStore((s) => s.artists.find((a) => a.id === appointment?.artistId));
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const logActivity = useStore((s) => s.logActivity);

  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (open) setConfirmDelete(false);
  }, [open, appointmentId]);

  if (!appointment) return null;

  const locale = dateLocale(i18n.language);
  const start = parseISO(appointment.start);
  const end = addMinutes(start, appointment.durationMinutes || 0);

  const setStatus = (status) => {
    update('appointments', appointment.id, { status });
    logActivity({
      type: 'appointment',
      priority: 'low',
      text: t('calendar.activity.statusChanged', {
        status: t(`calendar.status.${status}`).toLowerCase(),
        client: client?.name,
        title: appointment.title,
      }),
      link: '/calendar',
    });
    toast({
      title: t('calendar.toast.statusUpdated'),
      description: t('calendar.toast.statusUpdatedDesc', { status: t(`calendar.status.${status}`).toLowerCase() }),
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    remove('appointments', appointment.id);
    logActivity({
      type: 'appointment',
      priority: 'low',
      text: t('calendar.activity.deleted', { client: client?.name, title: appointment.title }),
      link: '/calendar',
    });
    toast({ title: t('calendar.toast.deleted') });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <DialogTitle className="font-display text-xl leading-snug">{appointment.title}</DialogTitle>
            <span
              className={cn(
                'mt-1 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                statusStyle(appointment.status).badge
              )}
            >
              {t(`calendar.status.${appointment.status}`)}
            </span>
          </div>
          <DialogDescription className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {format(start, 'EEEE d MMMM · HH:mm', { locale })}–{format(end, 'HH:mm')} ·{' '}
            {t('calendar.detail.minutes', { count: appointment.durationMinutes || 0 })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={client?.avatar} alt={client?.name} />
              <AvatarFallback>{client?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{client?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {client?.phone} · {client?.email}
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Artist */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={artist?.avatar} alt={artist?.name} />
              <AvatarFallback>{artist?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t('calendar.detail.artist')}</p>
              <p className="truncate text-sm font-medium">{artist?.name}</p>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Money */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t('calendar.detail.price')}</p>
              <p className="font-display text-lg font-semibold">
                {fmtMoney(appointment.price, settings.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('calendar.detail.deposit')}</p>
              <p className="font-display text-lg font-semibold">
                {fmtMoney(appointment.deposit, settings.currency)}
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Notes */}
          <div className="flex items-start gap-2">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className={cn('text-sm', !appointment.notes && 'text-muted-foreground italic')}>
              {appointment.notes || t('calendar.detail.noNotes')}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant={confirmDelete ? 'destructive' : 'ghost'}
            size="sm"
            onClick={handleDelete}
            className={cn(!confirmDelete && 'text-destructive hover:text-destructive')}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {confirmDelete ? t('calendar.detail.confirmDelete') : t('calendar.detail.delete')}
          </Button>
          <div className="flex flex-wrap justify-end gap-2">
            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
              <Button variant="outline" size="sm" onClick={() => setStatus('cancelled')}>
                <XCircle className="mr-2 h-4 w-4" />
                {t('calendar.detail.cancelAppointment')}
              </Button>
            )}
            {appointment.status === 'pending' && (
              <Button size="sm" onClick={() => setStatus('confirmed')}>
                <BadgeCheck className="mr-2 h-4 w-4" />
                {t('calendar.detail.confirm')}
              </Button>
            )}
            {appointment.status === 'confirmed' && (
              <Button size="sm" onClick={() => setStatus('completed')}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t('calendar.detail.complete')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
