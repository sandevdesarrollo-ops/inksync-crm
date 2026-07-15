import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Send, CheckCircle2, Clock, Link as LinkIcon, Trash2, FileText, BadgeCheck, XCircle,
} from 'lucide-react';
import { useStore, fmtMoney } from '@/lib/store';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';
import NewProposalDialog from '@/components/proposals/NewProposalDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

const STATUSES = ['draft', 'sent', 'deposit_paid', 'accepted', 'expired'];

const STATUS_STYLES = {
  draft: 'bg-muted text-muted-foreground border-transparent',
  sent: 'bg-primary/15 text-primary border-primary/25',
  deposit_paid: 'bg-success/15 text-success border-success/25',
  accepted: 'bg-success text-white border-transparent',
  expired: 'bg-destructive/15 text-destructive border-destructive/25',
};

export default function ProposalsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const proposals = useStore((s) => s.proposals);
  const clients = useStore((s) => s.clients);
  const artists = useStore((s) => s.artists);
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const logActivity = useStore((s) => s.logActivity);

  const [filter, setFilter] = useState(null); // null = all statuses
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);
  const artistById = useMemo(() => Object.fromEntries(artists.map((a) => [a.id, a])), [artists]);

  const pipeline = useMemo(
    () =>
      STATUSES.map((status) => {
        const items = proposals.filter((p) => p.status === status);
        return { status, count: items.length, total: items.reduce((sum, p) => sum + (p.amount || 0), 0) };
      }),
    [proposals]
  );

  const visible = filter ? proposals.filter((p) => p.status === filter) : proposals;

  const sendProposal = (p) => {
    const client = clientById[p.clientId];
    update('proposals', p.id, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      depositLink: `https://pay.inksync.studio/${p.id}`,
    });
    logActivity({
      type: 'proposal',
      priority: 'medium',
      text: t('proposals.activity.sent', {
        title: p.title,
        client: client?.name ?? '—',
        amount: fmtMoney(p.amount, settings.currency),
      }),
      link: '/proposals',
    });
    toast({
      title: t('proposals.toast.sent'),
      description: t('proposals.toast.sentDesc', { client: client?.name ?? '—' }),
    });
  };

  const markDepositPaid = (p) => {
    update('proposals', p.id, { status: 'deposit_paid', paidAt: new Date().toISOString() });
    toast({ title: t('proposals.toast.depositPaid') });
  };

  const markExpired = (p) => {
    update('proposals', p.id, { status: 'expired' });
    toast({ title: t('proposals.toast.expired') });
  };

  const markAccepted = (p) => {
    update('proposals', p.id, { status: 'accepted' });
    toast({ title: t('proposals.toast.accepted') });
  };

  const copyLink = async (p) => {
    try {
      await navigator.clipboard.writeText(p.depositLink);
      toast({ title: t('proposals.toast.linkCopied'), description: p.depositLink });
    } catch {
      toast({ title: t('common.copied'), description: p.depositLink });
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    remove('proposals', deleteTarget.id);
    toast({ title: t('proposals.toast.deleted') });
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHeader title={t('proposals.title')} description={t('proposals.description')}>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('proposals.newProposal')}
        </Button>
      </PageHeader>

      {/* Pipeline summary chips — click to filter */}
      <div aria-label={t('proposals.pipeline')} className="mb-6 flex flex-wrap gap-2">
        {pipeline.map(({ status, count, total }) => {
          const active = filter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(active ? null : status)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              <span className="font-medium">{t(`proposals.status.${status}`)}</span>
              <span className={cn('font-display text-base font-semibold', active ? 'text-primary' : 'text-foreground')}>
                {count}
              </span>
              <span className="hidden text-xs sm:inline">{fmtMoney(total, settings.currency)}</span>
            </button>
          );
        })}
      </div>

      {/* Proposal list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-display text-lg">{t('proposals.empty.title')}</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {filter ? t('proposals.empty.filtered') : t('proposals.empty.text')}
          </p>
          {!filter && (
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('proposals.empty.cta')}
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <AnimatePresence initial={false}>
            {visible.map((p, i) => {
              const client = clientById[p.clientId];
              const artist = artistById[p.artistId];
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={cn('p-4 sm:p-5', i > 0 && 'border-t border-border')}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar className="mt-0.5 h-10 w-10 shrink-0">
                        <AvatarImage src={client?.avatar} alt={client?.name} />
                        <AvatarFallback>{client?.name?.[0] ?? '?'}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {client?.name ?? '—'}
                          <span className="mx-1.5 opacity-50">·</span>
                          {artist?.name ?? '—'}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {p.sentAt
                            ? t('proposals.sentDate', { date: format(new Date(p.sentAt), 'd MMM yyyy') })
                            : t('proposals.notSent')}
                        </p>
                        {p.notes && (
                          <p className="mt-1.5 text-sm text-muted-foreground">{p.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant="outline" className={cn('border', STATUS_STYLES[p.status])}>
                        {t(`proposals.status.${p.status}`)}
                      </Badge>
                      <p className="font-display text-lg font-semibold">
                        {fmtMoney(p.amount, settings.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('proposals.deposit')}: {fmtMoney(p.deposit, settings.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Status flow actions */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {p.status === 'draft' && (
                      <Button size="sm" onClick={() => sendProposal(p)}>
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        {t('proposals.actions.send')}
                      </Button>
                    )}
                    {p.status === 'sent' && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => markDepositPaid(p)}>
                          <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />
                          {t('proposals.actions.markDepositPaid')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => markExpired(p)}>
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          {t('proposals.actions.markExpired')}
                        </Button>
                      </>
                    )}
                    {p.status === 'deposit_paid' && (
                      <Button size="sm" variant="secondary" onClick={() => markAccepted(p)}>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        {t('proposals.actions.markAccepted')}
                      </Button>
                    )}
                    {p.depositLink && (
                      <Button size="sm" variant="outline" onClick={() => copyLink(p)}>
                        <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                        {t('proposals.actions.copyLink')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(p)}
                      aria-label={t('proposals.actions.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <NewProposalDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {t('proposals.deleteConfirm.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('proposals.deleteConfirm.text', { title: deleteTarget?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
