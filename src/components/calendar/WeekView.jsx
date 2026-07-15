import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { addDays, format, getHours, getMinutes, isSameDay, isToday, parseISO, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { firstName, parseTimeToMinutes, statusStyle, dateLocale } from '@/components/calendar/calendarUtils';

const HOUR_PX = 56;

export default function WeekView({ cursor, appointments, clientById, settings, onAppointmentClick, onDayClick }) {
  const { i18n } = useTranslation();
  const locale = dateLocale(i18n.language);

  const days = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const openMin = parseTimeToMinutes(settings.openTime || '09:00');
  const closeMin = parseTimeToMinutes(settings.closeTime || '20:00');
  const startHour = Math.floor(openMin / 60);
  const endHour = Math.ceil(closeMin / 60);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const gridHeight = (endHour - startHour) * HOUR_PX;

  const parsed = useMemo(
    () => appointments.map((ap) => ({ ...ap, startDate: parseISO(ap.start) })),
    [appointments]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="overflow-x-auto rounded-xl border border-border bg-card"
    >
      <div className="min-w-[720px]">
        {/* Day headers */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: '52px repeat(7, minmax(0, 1fr))' }}>
          <div />
          {days.map((day) => (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick(day)}
              className="flex cursor-pointer flex-col items-center gap-0.5 border-l border-border py-2 transition-colors duration-200 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {format(day, 'EEE', { locale })}
              </span>
              <span
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-full font-display text-sm font-semibold',
                  isToday(day) ? 'ring-2 ring-primary text-primary' : 'text-foreground'
                )}
              >
                {format(day, 'd')}
              </span>
            </button>
          ))}
        </div>

        {/* Time grid */}
        <div className="grid" style={{ gridTemplateColumns: '52px repeat(7, minmax(0, 1fr))' }}>
          {/* Hour gutter */}
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h, i) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground"
                style={{ top: i * HOUR_PX }}
              >
                {i > 0 && `${String(h).padStart(2, '0')}:00`}
              </span>
            ))}
          </div>

          {days.map((day) => {
            const dayAps = parsed.filter((ap) => isSameDay(ap.startDate, day));
            return (
              <div key={day.toISOString()} className="relative border-l border-border" style={{ height: gridHeight }}>
                {hours.map((h, i) => (
                  <div
                    key={h}
                    className={cn('absolute inset-x-0 border-t border-border/60', i === 0 && 'border-t-0')}
                    style={{ top: i * HOUR_PX }}
                  />
                ))}
                {dayAps.map((ap) => {
                  const startMin = getHours(ap.startDate) * 60 + getMinutes(ap.startDate);
                  const top = ((startMin - startHour * 60) / 60) * HOUR_PX;
                  const height = Math.max(((ap.durationMinutes || 60) / 60) * HOUR_PX, 24);
                  const client = clientById[ap.clientId];
                  return (
                    <button
                      key={ap.id}
                      type="button"
                      onClick={() => onAppointmentClick(ap.id)}
                      className={cn(
                        'absolute inset-x-1 z-10 flex cursor-pointer flex-col overflow-hidden rounded-md border px-1.5 py-1 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        statusStyle(ap.status).block
                      )}
                      style={{ top: Math.max(top, 0), height }}
                    >
                      <span className="truncate text-[11px] font-semibold leading-tight">
                        {format(ap.startDate, 'HH:mm')} {firstName(client?.name)}
                      </span>
                      {height >= 44 && (
                        <span className="truncate text-[11px] leading-tight opacity-80">{ap.title}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
