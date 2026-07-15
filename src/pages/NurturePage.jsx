import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { Mail, MessageCircle, Pencil, Plus, Send, Sparkles, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import NurtureCampaignDialog from '@/components/clients/NurtureCampaignDialog';
import { dateLocale } from '@/components/clients/dateLocale';

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

const WINBACK_DAYS = 150;
const AFTERCARE_DAYS = 7;

export default function NurturePage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const locale = dateLocale(i18n.language);

  const nurtures = useStore((s) => s.nurtures);
  const clients = useStore((s) => s.clients);
  const appointments = useStore((s) => s.appointments);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [queued, setQueued] = useState(() => new Set());

  // Real eligibility computed from the store.
  const candidates = useMemo(() => {
    const now = new Date();
    const winback = clients
      .filter((c) => c.lastVisit && differenceInDays(now, new Date(c.lastVisit)) > WINBACK_DAYS)
      .map((c) => ({
        key: `winback-${c.id}`,
        type: 'winback',
        client: c,
        reason: t('nurture.eligible.winbackReason', { days: differenceInDays(now, new Date(c.lastVisit)) }),
      }));
    const aftercare = appointments
      .filter((ap) => {
        if (ap.status !== 'completed') return false;
        const d = differenceInDays(now, new Date(ap.start));
        return d >= 0 && d <= AFTERCARE_DAYS;
      })
      .map((ap) => {
        const client = clients.find((c) => c.id === ap.clientId);
        return client && {
          key: `aftercare-${ap.id}`,
          type: 'aftercare',
          client,
          reason: t('nurture.eligible.aftercareReason', {
            time: formatDistanceToNow(new Date(ap.start), { addSuffix: true, locale }),
          }),
        };
      })
      .filter(Boolean);
    return [...aftercare, ...winback];
  }, [clients, appointments, t, locale]);

  // Match a candidate to the most fitting campaign (keyword heuristic, fallback: first active).
  const campaignFor = (type) => {
    const patterns = type === 'winback' ? /win|back|180|quiet|recupera|връщане/i : /after|care|cuidad|грижа|appointment|cita|час/i;
    return (
      nurtures.find((n) => n.active && patterns.test(`${n.name} ${n.trigger}`)) ||
      nurtures.find((n) => n.active) ||
      nurtures[0]
    );
  };

  const queueSend = (candidate) => {
    const campaign = campaignFor(candidate.type);
    if (!campaign) return;
    update('nurtures', campaign.id, { sent: (campaign.sent || 0) + 1 });
    setQueued((prev) => new Set(prev).add(candidate.key));
    toast({
      title: t('nurture.eligible.queuedToast'),
      description: t('nurture.eligible.queuedToastDesc', { name: candidate.client.name, campaign: campaign.name }),
    });
  };

  const toggleCampaign = (campaign, active) => {
    update('nurtures', campaign.id, { active });
    toast({ title: active ? t('nurture.toggle.activated') : t('nurture.toggle.paused') });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    remove('nurtures', deleting.id);
    toast({ title: t('nurture.delete.deleted') });
    setDeleting(null);
  };

  const openRate = (n) => (n.sent > 0 ? Math.round(((n.opened || 0) / n.sent) * 100) : 0);

  return (
    <div>
      <PageHeader title={t('nurture.title')} description={t('nurture.description')}>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t('nurture.newCampaign')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        {/* Campaign cards */}
        <div className="space-y-4 xl:col-span-2">
          {nurtures.length === 0 ? (
            <motion.div {...fade} className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <Send className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">{t('nurture.empty.title')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('nurture.empty.hint')}</p>
              <Button size="sm" className="mt-4" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                {t('nurture.empty.action')}
              </Button>
            </motion.div>
          ) : (
            nurtures.map((n) => {
              const ChannelIcon = n.channel === 'whatsapp' ? MessageCircle : Mail;
              return (
                <motion.div key={n.id} {...fade}>
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-lg font-semibold">{n.name}</h2>
                          <Badge variant="secondary" className="gap-1 font-normal">
                            <ChannelIcon className="h-3 w-3" />
                            {t(`nurture.channel.${n.channel}`)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('nurture.card.trigger')}: {n.trigger}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {n.active ? t('nurture.card.active') : t('nurture.card.paused')}
                        </span>
                        <Switch
                          checked={n.active}
                          onCheckedChange={(v) => toggleCampaign(n, v)}
                          aria-label={n.name}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <blockquote className="rounded-md border-l-2 border-primary/60 bg-muted/40 px-4 py-3 text-sm italic text-muted-foreground">
                        {n.template}
                      </blockquote>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <span>
                          <span className="font-display text-lg font-semibold">{n.sent}</span>{' '}
                          <span className="text-xs text-muted-foreground">{t('nurture.card.sent')}</span>
                        </span>
                        <span>
                          <span className="font-display text-lg font-semibold">{n.opened}</span>{' '}
                          <span className="text-xs text-muted-foreground">{t('nurture.card.opened')}</span>
                        </span>
                        <div className="flex min-w-[140px] flex-1 items-center gap-2">
                          <Progress value={openRate(n)} className="h-1.5" />
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {openRate(n)}% {t('nurture.card.openRate')}
                          </span>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditing(n); setDialogOpen(true); }}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleting(n)}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Eligible now panel */}
        <motion.div {...fade}>
          <Card>
            <CardHeader className="pb-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                {t('nurture.eligible.title')}
              </h2>
              <p className="text-xs text-muted-foreground">{t('nurture.eligible.subtitle')}</p>
            </CardHeader>
            <CardContent>
              {candidates.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('nurture.eligible.empty')}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {candidates.map((cand) => {
                    const isQueued = queued.has(cand.key);
                    return (
                      <li key={cand.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={cand.client.avatar} alt={cand.client.name} />
                          <AvatarFallback>{cand.client.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{cand.client.name}</p>
                            <Badge
                              variant="outline"
                              className={
                                cand.type === 'winback'
                                  ? 'border-warning/30 bg-warning/10 text-warning'
                                  : 'border-success/30 bg-success/10 text-success'
                              }
                            >
                              {t(`nurture.eligible.${cand.type}`)}
                            </Badge>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{cand.reason}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isQueued ? 'ghost' : 'secondary'}
                          disabled={isQueued}
                          onClick={() => queueSend(cand)}
                        >
                          <Send className="mr-1.5 h-3.5 w-3.5" />
                          {isQueued ? t('nurture.eligible.queued') : t('nurture.eligible.queueSend')}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <NurtureCampaignDialog open={dialogOpen} onOpenChange={setDialogOpen} campaign={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t('nurture.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('nurture.delete.text', { name: deleting?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {t('nurture.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
