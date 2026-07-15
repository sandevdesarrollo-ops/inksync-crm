import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// new = gold tint, active = success tint, vip = primary solid, inactive = muted.
const STYLES = {
  new: 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15',
  active: 'border-success/30 bg-success/10 text-success hover:bg-success/15',
  vip: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
  inactive: 'border-border bg-muted text-muted-foreground hover:bg-muted/80',
};

export default function StatusBadge({ status, className }) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={cn('border', STYLES[status] || STYLES.inactive, className)}>
      {t(`clients.status.${status}`)}
    </Badge>
  );
}
