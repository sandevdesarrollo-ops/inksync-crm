import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, ExternalLink } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ChannelBadge from '@/components/messages/ChannelBadge';

const QUICK_REPLIES = ['bookingConfirm', 'aftercare', 'depositReminder'];

// Right pane: message bubbles + quick replies + composer.
export default function MessageThread({ conversation, client, onBack }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const sendMessage = useStore((s) => s.sendMessage);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Keep the newest message in view when the thread changes or grows.
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conversation.id, conversation.messages.length]);

  useEffect(() => setDraft(''), [conversation.id]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    sendMessage(conversation.id, text);
    setDraft('');
    toast({ title: t('messages.messageSent') });
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Header: client + channel, link to profile */}
      <div className="flex items-center gap-3 border-b border-border p-3 sm:p-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
          aria-label={t('messages.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={client?.avatar} alt={client?.name} />
          <AvatarFallback>{client?.name?.[0] ?? '?'}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight">{client?.name ?? '—'}</p>
          <ChannelBadge channel={conversation.channel} className="mt-0.5" />
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/clients">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            {t('messages.viewProfile')}
          </Link>
        </Button>
      </div>

      {/* Bubbles */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {conversation.messages.map((m) => {
          const mine = m.from === 'studio';
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={cn('flex', mine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[70%]',
                  mine
                    ? 'rounded-br-sm bg-primary/15 text-foreground'
                    : 'rounded-bl-sm bg-muted text-foreground'
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className={cn('mt-1 text-[11px] text-muted-foreground', mine && 'text-right')}>
                  {mine && <span>{t('messages.you')} · </span>}
                  {format(new Date(m.at), 'd MMM, HH:mm')}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick replies + composer */}
      <div className="border-t border-border p-3 sm:p-4">
        <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          {t('messages.quickReplies.label')}
        </p>
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {QUICK_REPLIES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setDraft(t(`messages.quickReplies.${key}`));
                textareaRef.current?.focus();
              }}
              className="cursor-pointer rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t(`messages.quickReplyNames.${key}`)}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('messages.composerPlaceholder')}
            className="min-h-[44px] resize-none"
          />
          <Button onClick={send} disabled={!draft.trim()} aria-label={t('messages.send')}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
