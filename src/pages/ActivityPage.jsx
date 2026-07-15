import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es as esLocale, bg as bgLocale } from 'date-fns/locale';
import {
  FileText,
  Package,
  CalendarDays,
  MessageSquare,
  User,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useStore } from '@/lib/store';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

const CATEGORIES = ['all', 'proposal', 'inventory', 'appointment', 'message', 'client'];

const TYPE_ICONS = {
  proposal: FileText,
  inventory: Package,
  appointment: CalendarDays,
  message: MessageSquare,
  client: User,
};

const PRIORITY_STYLES = {
  high: 'border-l-destructive',
  medium: 'border-l-warning',
  low: 'border-l-muted-foreground/40',
};

const dateLocales = { es: esLocale, bg: bgLocale };

function ActivityRow({ item, onDone, onGo, t, relTime }) {
  const Icon = TYPE_ICONS[item.type] || User;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex items-center gap-3 rounded-md border border-border border-l-4 bg-card px-4 py-3 transition-colors duration-200 hover:bg-accent/40',
        PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.low
      )}
    >
      <Checkbox
        checked={item.done}
        onCheckedChange={() => onDone(item)}
        aria-label={t('activity.markDone')}
        className="shrink-0"
      />
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{item.text}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{relTime(item.time)}</p>
      </div>
      {item.link && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => onGo(item.link)}
        >
          {t('activity.go')}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      )}
    </motion.div>
  );
}

export default function ActivityPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const activities = useStore((s) => s.activities);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);

  const [filter, setFilter] = useState('all');
  const [completedOpen, setCompletedOpen] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const relTime = (iso) =>
    formatDistanceToNow(parseISO(iso), {
      addSuffix: true,
      locale: dateLocales[i18n.language],
    });

  const counts = useMemo(() => {
    const open = activities.filter((a) => !a.done);
    const c = { all: open.length };
    for (const cat of CATEGORIES.slice(1)) c[cat] = open.filter((a) => a.type === cat).length;
    return c;
  }, [activities]);

  const filtered = useMemo(
    () => (filter === 'all' ? activities : activities.filter((a) => a.type === filter)),
    [activities, filter]
  );

  const byPriority = useMemo(() => {
    const open = filtered
      .filter((a) => !a.done)
      .sort((a, b) => new Date(b.time) - new Date(a.time));
    return {
      high: open.filter((a) => a.priority === 'high'),
      medium: open.filter((a) => a.priority === 'medium'),
      low: open.filter((a) => a.priority !== 'high' && a.priority !== 'medium'),
    };
  }, [filtered]);

  const completed = useMemo(
    () =>
      filtered.filter((a) => a.done).sort((a, b) => new Date(b.time) - new Date(a.time)),
    [filtered]
  );

  const allDone = activities.every((a) => a.done);
  const openInFilter = byPriority.high.length + byPriority.medium.length + byPriority.low.length;

  const markDone = (item) => {
    update('activities', item.id, { done: !item.done });
    if (!item.done) toast({ title: t('activity.doneToast') });
  };

  const clearCompleted = () => {
    for (const item of completed) remove('activities', item.id);
    setClearConfirm(false);
    toast({ title: t('activity.clearedToast') });
  };

  const sections = [
    { key: 'high', items: byPriority.high },
    { key: 'medium', items: byPriority.medium },
    { key: 'low', items: byPriority.low },
  ].filter((s) => s.items.length > 0);

  return (
    <div>
      <PageHeader title={t('activity.title')} description={t('activity.description')} />

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              filter === cat
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {t(`activity.filters.${cat}`)}
            <span
              className={cn(
                'rounded-full px-1.5 text-xs',
                filter === cat ? 'bg-primary/20' : 'bg-muted'
              )}
            >
              {counts[cat] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {allDone ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <CheckCircle className="h-12 w-12 text-success" />
            </motion.div>
            <p className="font-display text-xl">{t('activity.allClearTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('activity.allClearDescription')}</p>
            <Button className="mt-2" onClick={() => navigate('/calendar')}>
              {t('activity.goToCalendar')}
            </Button>
          </CardContent>
        </Card>
      ) : openInFilter === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <CheckCircle className="h-10 w-10 text-muted-foreground" />
            <p className="font-display text-lg">{t('activity.emptyFilterTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('activity.emptyFilterDescription')}</p>
            <Button variant="outline" className="mt-2" onClick={() => setFilter('all')}>
              {t('activity.showAll')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sections.map(({ key, items }) => (
            <section key={key}>
              <h2 className="mb-3 font-display text-lg font-semibold">
                {t(`activity.priority.${key}`)}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {items.length}
                </span>
              </h2>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <ActivityRow
                      key={item.id}
                      item={item}
                      onDone={markDone}
                      onGo={navigate}
                      t={t}
                      relTime={relTime}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCompletedOpen((o) => !o)}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  completedOpen && 'rotate-180'
                )}
              />
              {t('activity.completed')} · {completed.length}
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setClearConfirm(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {t('activity.clearCompleted')}
            </Button>
          </div>
          {completedOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mt-3 space-y-2 opacity-60"
            >
              {completed.map((item) => (
                <ActivityRow
                  key={item.id}
                  item={item}
                  onDone={markDone}
                  onGo={navigate}
                  t={t}
                  relTime={relTime}
                />
              ))}
            </motion.div>
          )}
        </section>
      )}

      <AlertDialog open={clearConfirm} onOpenChange={setClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {t('activity.clearTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('activity.clearDescription', { count: completed.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={clearCompleted}
            >
              {t('activity.clear')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
