import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { firstName, statusStyle, dateLocale } from '@/components/calendar/calendarUtils';

const MAX_CHIPS = 3;

export default function MonthGrid({ cursor, appointments, clientById, onDayClick, onAppointmentClick }) {
  const { t, i18n } = useTranslation();
  const locale = dateLocale(i18n.language);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const weekdayLabels = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'EEE', { locale }));
  }, [locale]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const ap of appointments) {
      const key = format(parseISO(ap.start), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ap);
    }
    for (const list of map.values())
      list.sort((a, b) => parseISO(a.start) - parseISO(b.start));
    return map;
  }, [appointments]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="grid grid-cols-7 border-b border-border">
        {weekdayLabels.map((label) => (
          <div key={label} className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayAps = byDay.get(key) || [];
          const inMonth = isSameMonth(day, cursor);
          const today = isToday(day);
          const overflow = dayAps.length - MAX_CHIPS;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick(day)}
              className={cn(
                'group relative flex min-h-[76px] flex-col items-stretch gap-1 border-b border-r border-border p-1.5 text-left transition-colors duration-200 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:min-h-[112px] sm:p-2 [&:nth-child(7n)]:border-r-0',
                !inMonth && 'bg-muted/20'
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  today && 'ring-2 ring-primary text-primary',
                  !inMonth && !today && 'text-muted-foreground/60',
                  inMonth && !today && 'text-foreground'
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Chips on ≥sm screens */}
              <div className="hidden flex-col gap-1 sm:flex">
                {dayAps.slice(0, MAX_CHIPS).map((ap) => {
                  const client = clientById[ap.clientId];
                  return (
                    <span
                      key={ap.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(ap.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onAppointmentClick(ap.id);
                        }
                      }}
                      className={cn(
                        'block cursor-pointer truncate rounded border px-1.5 py-0.5 text-[11px] font-medium leading-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        statusStyle(ap.status).chip
                      )}
                    >
                      {format(parseISO(ap.start), 'HH:mm')} {firstName(client?.name)}
                    </span>
                  );
                })}
                {overflow > 0 && (
                  <span className="px-1 text-[11px] font-medium text-muted-foreground">
                    {t('calendar.more', { count: overflow })}
                  </span>
                )}
              </div>

              {/* Dots on mobile */}
              <div className="mt-auto flex flex-wrap gap-1 sm:hidden">
                {dayAps.slice(0, 4).map((ap) => (
                  <span key={ap.id} className={cn('h-1.5 w-1.5 rounded-full', statusStyle(ap.status).dot)} />
                ))}
                {dayAps.length > 4 && (
                  <span className="text-[10px] leading-none text-muted-foreground">+{dayAps.length - 4}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
