import { es as esLocale, bg as bgLocale } from 'date-fns/locale';

// Single source of truth for status → color mapping.
// pending=warning, confirmed=gold/primary, completed=success, cancelled=muted.
export const STATUS_STYLES = {
  pending: {
    chip: 'border-warning/40 bg-warning/15 text-warning hover:bg-warning/25',
    dot: 'bg-warning',
    badge: 'border-warning/40 bg-warning/15 text-warning',
    block: 'border-warning/50 bg-warning/15 text-warning hover:bg-warning/25',
  },
  confirmed: {
    chip: 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/25',
    dot: 'bg-primary',
    badge: 'border-primary/40 bg-primary/15 text-primary',
    block: 'border-primary/50 bg-primary/15 text-primary hover:bg-primary/25',
  },
  completed: {
    chip: 'border-success/40 bg-success/15 text-success hover:bg-success/25',
    dot: 'bg-success',
    badge: 'border-success/40 bg-success/15 text-success',
    block: 'border-success/50 bg-success/15 text-success hover:bg-success/25',
  },
  cancelled: {
    chip: 'border-border bg-muted/60 text-muted-foreground line-through hover:bg-muted',
    dot: 'bg-muted-foreground/60',
    badge: 'border-destructive/30 bg-destructive/10 text-muted-foreground',
    block: 'border-border bg-muted/50 text-muted-foreground line-through hover:bg-muted',
  },
};

export const statusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES.pending;

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || '';

// "10:00" -> minutes since midnight
export const parseTimeToMinutes = (hhmm = '00:00') => {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
};

// date-fns locale for the active i18n language (undefined = English default)
export const dateLocale = (lang) =>
  lang?.startsWith('es') ? esLocale : lang?.startsWith('bg') ? bgLocale : undefined;
