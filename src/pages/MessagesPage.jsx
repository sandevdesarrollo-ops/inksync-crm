import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { es as esLocale, bg as bgLocale } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Inbox, MessageSquare } from 'lucide-react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';
import ChannelBadge, { CHANNEL_ICONS } from '@/components/messages/ChannelBadge';
import MessageThread from '@/components/messages/MessageThread';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const DATE_LOCALES = { es: esLocale, bg: bgLocale };
const FILTERS = ['all', 'unread', 'instagram', 'whatsapp', 'facebook'];

export default function MessagesPage() {
  const { t, i18n } = useTranslation();
  const conversations = useStore((s) => s.conversations);
  const clients = useStore((s) => s.clients);
  const update = useStore((s) => s.update);

  const [filter, setFilter] = useState('all');
  const [activeId, setActiveId] = useState(null);

  const dateLocale = DATE_LOCALES[i18n.language];
  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);

  const sorted = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        const lastA = a.messages[a.messages.length - 1]?.at ?? 0;
        const lastB = b.messages[b.messages.length - 1]?.at ?? 0;
        return new Date(lastB) - new Date(lastA);
      }),
    [conversations]
  );

  const visible = sorted.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return c.unread > 0;
    return c.channel === filter;
  });

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  const openConversation = (c) => {
    setActiveId(c.id);
    if (c.unread > 0) update('conversations', c.id, { unread: 0 });
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t('messages.title')} description={t('messages.description')} />

      {/* Filter tabs: all / unread / per channel */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const Icon = CHANNEL_ICONS[f];
          const isActive = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {t(`messages.filters.${f}`)}
              {f === 'unread' && totalUnread > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {totalUnread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Two-pane inbox — collapses to a single pane below md */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex h-[calc(100dvh-19rem)] min-h-[26rem] overflow-hidden rounded-xl border border-border bg-card"
      >
        {/* Conversation list */}
        <div
          className={cn(
            'w-full flex-col overflow-y-auto md:flex md:w-80 md:shrink-0 md:border-r md:border-border',
            active ? 'hidden' : 'flex'
          )}
          aria-label={t('messages.conversations')}
        >
          {visible.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <Inbox className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-display text-lg">{t('messages.emptyList')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('messages.emptyListText')}</p>
            </div>
          ) : (
            visible.map((c, i) => {
              const client = clientById[c.clientId];
              const last = c.messages[c.messages.length - 1];
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openConversation(c)}
                  className={cn(
                    'flex w-full cursor-pointer items-start gap-3 p-3.5 text-left transition-colors duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                    i > 0 && 'border-t border-border',
                    isActive ? 'bg-primary/10' : 'hover:bg-muted/60'
                  )}
                >
                  <Avatar className="mt-0.5 h-10 w-10 shrink-0">
                    <AvatarImage src={client?.avatar} alt={client?.name} />
                    <AvatarFallback>{client?.name?.[0] ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('truncate text-sm', c.unread > 0 ? 'font-semibold' : 'font-medium')}>
                        {client?.name ?? '—'}
                      </p>
                      {last && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(last.at), { addSuffix: true, locale: dateLocale })}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <ChannelBadge channel={c.channel} iconOnly />
                      <p
                        className={cn(
                          'truncate text-xs',
                          c.unread > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {last?.from === 'studio' && `${t('messages.you')}: `}
                        {last?.text}
                      </p>
                    </div>
                  </div>
                  {c.unread > 0 && (
                    <span
                      className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
                      aria-label={t('messages.unreadCount', { count: c.unread })}
                    >
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Thread */}
        {active ? (
          <MessageThread
            conversation={active}
            client={clientById[active.clientId]}
            onBack={() => setActiveId(null)}
          />
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center p-8 text-center md:flex">
            <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-display text-lg">{t('messages.selectConversation')}</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {t('messages.selectConversationText')}
            </p>
          </div>
        )}
      </motion.div>

      <p className="mt-3 text-xs text-muted-foreground">{t('messages.syncFootnote')}</p>
    </div>
  );
}
