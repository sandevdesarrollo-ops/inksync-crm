import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import { CalendarPlus, FileText, History, Mail, MessageSquare, Phone } from 'lucide-react';
import { useStore, fmtMoney } from '@/lib/store';
import { useToast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/clients/StatusBadge';
import { dateLocale } from '@/components/clients/dateLocale';

const STATUSES = ['new', 'active', 'vip', 'inactive'];

const APPT_BADGE = {
  confirmed: 'border-success/30 bg-success/10 text-success',
  pending: 'border-warning/30 bg-warning/10 text-warning',
  completed: 'border-border bg-muted text-muted-foreground',
  cancelled: 'border-destructive/30 bg-destructive/10 text-destructive',
};

const PROPOSAL_BADGE = {
  draft: 'border-border bg-muted text-muted-foreground',
  sent: 'border-primary/30 bg-primary/10 text-primary',
  deposit_paid: 'border-success/30 bg-success/10 text-success',
  accepted: 'border-success/30 bg-success/10 text-success',
  expired: 'border-destructive/30 bg-destructive/10 text-destructive',
};

export default function ClientDetailSheet({ clientId, open, onOpenChange }) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const locale = dateLocale(i18n.language);

  const client = useStore((s) => s.clients.find((c) => c.id === clientId));
  const artists = useStore((s) => s.artists);
  const appointments = useStore((s) => s.appointments);
  const proposals = useStore((s) => s.proposals);
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.update);

  const [notes, setNotes] = useState('');
  useEffect(() => { setNotes(client?.notes ?? ''); }, [clientId, client?.notes]);

  if (!client) return null;

  const artist = artists.find((a) => a.id === client.preferredArtistId);
  const clientAppointments = appointments
    .filter((ap) => ap.clientId === client.id)
    .sort((a, b) => new Date(b.start) - new Date(a.start));
  const clientProposals = proposals.filter((p) => p.clientId === client.id);

  const saveNotes = () => {
    if (notes === (client.notes ?? '')) return;
    update('clients', client.id, { notes });
    toast({ title: t('clients.detail.notesSaved') });
  };

  const changeStatus = (status) => {
    if (status === client.status) return;
    update('clients', client.id, { status });
    toast({ title: t('clients.detail.statusChanged') });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border p-6 pb-4 text-left">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border border-border">
              <AvatarImage src={client.avatar} alt={client.name} />
              <AvatarFallback>{client.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="font-display text-xl">{client.name}</SheetTitle>
              <SheetDescription>
                {t('clients.detail.clientSince', { date: format(new Date(client.joinDate), 'PP', { locale }) })}
              </SheetDescription>
            </div>
            <StatusBadge status={client.status} />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-6">
            {/* Quick actions + status */}
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm">
                <Link to="/calendar">
                  <CalendarPlus className="mr-1.5 h-4 w-4" />
                  {t('clients.detail.bookSession')}
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link to="/messages">
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  {t('clients.detail.sendMessage')}
                </Link>
              </Button>
              <div className="ml-auto">
                <Select value={client.status} onValueChange={changeStatus}>
                  <SelectTrigger className="h-9 w-[130px]" aria-label={t('common.status')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{t(`clients.status.${s}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 rounded-lg border border-border p-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('clients.detail.visits')}</p>
                <p className="font-display text-2xl font-semibold">{client.visits}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('clients.detail.totalSpent')}</p>
                <p className="font-display text-2xl font-semibold">{fmtMoney(client.totalSpent, settings.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('clients.detail.lastVisit')}</p>
                <p className="text-sm font-medium leading-8">
                  {client.lastVisit
                    ? formatDistanceToNow(new Date(client.lastVisit), { addSuffix: true, locale })
                    : t('clients.detail.never')}
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{t('clients.detail.contact')}</h3>
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <Mail className="h-4 w-4" /> {client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <Phone className="h-4 w-4" /> {client.phone}
                </a>
              )}
              {artist && (
                <div className="flex items-center gap-2 pt-1 text-sm">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={artist.avatar} alt={artist.name} />
                    <AvatarFallback>{artist.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">{artist.name}</span>
                </div>
              )}
              {client.styles?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {client.styles.map((s) => (
                    <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="detail-notes" className="text-sm font-semibold">{t('clients.detail.notes')}</Label>
              <Textarea
                id="detail-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder={t('clients.detail.notesPlaceholder')}
              />
            </div>

            <Separator />

            {/* Appointment history */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <History className="h-4 w-4 text-muted-foreground" />
                {t('clients.detail.appointments')}
              </h3>
              {clientAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('clients.detail.noAppointments')}</p>
              ) : (
                <ul className="space-y-3">
                  {clientAppointments.map((ap) => (
                    <li key={ap.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{ap.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(ap.start), 'PP · p', { locale })}
                          {ap.price > 0 && <> · {fmtMoney(ap.price, settings.currency)}</>}
                        </p>
                      </div>
                      <Badge variant="outline" className={`shrink-0 border ${APPT_BADGE[ap.status] || ''}`}>
                        {t(`clients.detail.apptStatus.${ap.status}`)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Separator />

            {/* Proposals */}
            <div className="space-y-3 pb-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {t('clients.detail.proposals')}
              </h3>
              {clientProposals.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('clients.detail.noProposals')}</p>
              ) : (
                <ul className="space-y-3">
                  {clientProposals.map((p) => (
                    <li key={p.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{fmtMoney(p.amount, settings.currency)}</p>
                      </div>
                      <Badge variant="outline" className={`shrink-0 border ${PROPOSAL_BADGE[p.status] || ''}`}>
                        {t(`clients.detail.proposalStatus.${p.status}`)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
