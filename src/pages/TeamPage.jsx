import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { isSameMonth, parseISO } from 'date-fns';
import { Plus, Pencil, Trash2, Phone, Mail, Users, Banknote, Globe } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import MemberDialog, { DAY_KEYS } from '@/components/team/MemberDialog';
import { useStore, fmtMoney } from '@/lib/store';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const AVATAR_BASE = 'https://api.dicebear.com/9.x/notionists-neutral/svg?seed=';

const roleBadgeClass = {
  owner: 'border-transparent bg-primary/15 text-primary',
  artist: 'border-transparent bg-secondary text-secondary-foreground',
  apprentice: 'border-transparent bg-muted text-muted-foreground',
};

function ScheduleStrip({ schedule, t }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={t('team.weeklySchedule')}>
      {DAY_KEYS.map((day) => (
        <div key={day} className="flex flex-col items-center gap-1">
          <span className="text-[10px] leading-none text-muted-foreground">
            {t(`team.days.${day}`)}
          </span>
          <span
            title={t(`team.daysFull.${day}`)}
            className={cn(
              'h-2 w-2 rounded-full transition-colors duration-200',
              schedule?.[day] ? 'bg-primary' : 'bg-muted'
            )}
          />
        </div>
      ))}
    </div>
  );
}

export default function TeamPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const artists = useStore((s) => s.artists);
  const appointments = useStore((s) => s.appointments);
  const settings = useStore((s) => s.settings);
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const logActivity = useStore((s) => s.logActivity);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);

  const statsByArtist = useMemo(() => {
    const now = new Date();
    const map = {};
    for (const ap of appointments) {
      const start = parseISO(ap.start);
      if (!isSameMonth(start, now)) continue;
      map[ap.artistId] ??= { count: 0, revenue: 0 };
      map[ap.artistId].count += 1;
      if (ap.status === 'completed') map[ap.artistId].revenue += ap.price || 0;
    }
    return map;
  }, [appointments]);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (member) => {
    setEditing(member);
    setDialogOpen(true);
  };

  const handleSubmit = (data) => {
    if (editing) {
      update('artists', editing.id, data);
      toast({ title: t('team.updatedToast', { name: data.name }) });
    } else {
      add('artists', {
        ...data,
        avatar: `${AVATAR_BASE}${encodeURIComponent(data.name)}`,
        active: true,
      });
      toast({ title: t('team.addedToast', { name: data.name }) });
      logActivity({
        type: 'client',
        priority: 'low',
        text: t('team.activityAdded', { name: data.name, role: t(`team.roles.${data.role}`) }),
        link: '/team',
      });
    }
  };

  const requestRemove = (member) => {
    if (member.role === 'owner') {
      toast({
        title: t('team.ownerBlockedTitle'),
        description: t('team.ownerBlockedDescription'),
        variant: 'destructive',
      });
      return;
    }
    setRemoving(member);
  };

  const confirmRemove = () => {
    if (!removing) return;
    remove('artists', removing.id);
    toast({ title: t('team.removedToast', { name: removing.name }) });
    logActivity({
      type: 'client',
      priority: 'low',
      text: t('team.activityRemoved', { name: removing.name }),
      link: '/team',
    });
    setRemoving(null);
  };

  const togglePublished = (member, published) => {
    update('artists', member.id, { published });
    toast({
      title: published
        ? t('variantsUi.artistPublishedToast', { name: member.name })
        : t('variantsUi.artistUnpublishedToast', { name: member.name }),
    });
  };

  const toggleActive = (member, active) => {
    update('artists', member.id, { active });
    toast({
      title: active
        ? t('team.activatedToast', { name: member.name })
        : t('team.deactivatedToast', { name: member.name }),
    });
  };

  return (
    <div>
      <PageHeader title={t('team.title')} description={t('team.description')}>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t('team.addMember')}
        </Button>
      </PageHeader>

      {artists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="font-display text-lg">{t('team.emptyTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('team.emptyDescription')}</p>
            <Button onClick={openAdd} className="mt-2">
              <Plus className="mr-2 h-4 w-4" />
              {t('team.addMember')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {artists.map((member, i) => {
            const stats = statsByArtist[member.id] || { count: 0, revenue: 0 };
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3), ease: 'easeOut' }}
              >
                <Card
                  className={cn(
                    'h-full transition-opacity duration-200',
                    !member.active && 'opacity-60'
                  )}
                >
                  <CardContent className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-border">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-display text-lg font-semibold leading-tight">
                            {member.name}
                          </p>
                          <Badge className={cn('mt-1', roleBadgeClass[member.role])}>
                            {t(`team.roles.${member.role}`)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={t('common.edit')}
                          onClick={() => openEdit(member)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive"
                          aria-label={t('common.delete')}
                          onClick={() => requestRemove(member)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {member.styles?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {member.styles.map((style) => (
                          <Badge
                            key={style}
                            variant="outline"
                            className="font-normal text-muted-foreground"
                          >
                            {style}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Banknote className="h-3.5 w-3.5" />
                        <span className="text-foreground">
                          {fmtMoney(member.hourlyRate, settings.currency)}
                          {t('team.perHour')}
                        </span>
                      </p>
                      {member.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          {member.phone}
                        </p>
                      )}
                      {member.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="font-display text-2xl font-semibold">{stats.count}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('team.apptsThisMonth')} · {t('team.thisMonth')}
                        </p>
                      </div>
                      <div>
                        <p className="font-display text-2xl font-semibold">
                          {fmtMoney(stats.revenue, settings.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('team.revenueThisMonth')} · {t('team.thisMonth')}
                        </p>
                      </div>
                    </div>

                    <label className="flex cursor-pointer items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        {t('variantsUi.publicProfile')}
                      </span>
                      <Switch
                        checked={!!member.published}
                        onCheckedChange={(v) => togglePublished(member, v)}
                        aria-label={t('variantsUi.publicProfile')}
                      />
                    </label>

                    <div className="mt-auto flex items-end justify-between gap-3 pt-1">
                      <ScheduleStrip schedule={member.schedule} t={t} />
                      <label className="flex cursor-pointer items-center gap-2">
                        <span className="text-xs text-muted-foreground">{t('team.active')}</span>
                        <Switch
                          checked={!!member.active}
                          onCheckedChange={(c) => toggleActive(member, c)}
                          aria-label={t('team.active')}
                        />
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <MemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={editing}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {t('team.removeTitle', { name: removing?.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('team.removeDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmRemove}
            >
              {t('team.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
