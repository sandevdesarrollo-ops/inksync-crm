import React from 'react';
import { useTranslation } from 'react-i18next';
import { Instagram, MessageCircle, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CHANNEL_ICONS = {
  instagram: Instagram,
  whatsapp: MessageCircle,
  facebook: Facebook,
};

// Small neutral channel pill (icon + name) used in the list and thread header.
export default function ChannelBadge({ channel, iconOnly = false, className }) {
  const { t } = useTranslation();
  const Icon = CHANNEL_ICONS[channel] ?? MessageCircle;
  if (iconOnly) {
    return <Icon className={cn('h-3.5 w-3.5 text-muted-foreground', className)} aria-label={t(`messages.filters.${channel}`)} />;
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground',
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {t(`messages.filters.${channel}`)}
    </span>
  );
}
