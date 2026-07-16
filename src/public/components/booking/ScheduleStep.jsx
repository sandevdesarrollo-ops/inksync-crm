import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { addDays, format, startOfToday } from 'date-fns';
import { es as esLocale, bg as bgLocale } from 'date-fns/locale';
import { CalendarX2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const DF_LOCALES = { es: esLocale, bg: bgLocale };

const chipFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

// Step 2 — artist chips → 30-day date strip → slot grid (studio-timezone times).
export default function ScheduleStep({
  studio, artists, artistId, day, slots, slotsLoading, pendingSlot, holding,
  onSelectArtist, onSelectDay, onPickSlot,
}) {
  const { t, i18n } = useTranslation();
  const dfLocale = DF_LOCALES[i18n.language];
  const days = useMemo(() => Array.from({ length: 30 }, (_, i) => addDays(startOfToday(), i)), []);
  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { timeZone: studio.timezone, hour: '2-digit', minute: '2-digit' }),
    [i18n.language, studio.timezone],
  );
  const dayIndex = days.findIndex((d) => format(d, 'yyyy-MM-dd') === day);

  return (
    <div className="space-y-7">
      {/* Artist */}
      <section>
        <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {t('publicBook.schedule.artist')}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {artists.map((a) => {
            const selected = a.id === artistId;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelectArtist(a.id)}
                aria-pressed={selected}
                className={cn(
                  'flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 transition-colors duration-200 hover:border-primary/60',
                  selected && 'border-primary bg-primary/10',
                  chipFocus,
                )}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={a.avatar} alt="" />
                  <AvatarFallback className="text-xs">{a.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{a.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Day strip */}
      <section>
        <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {t('publicBook.schedule.day')}
        </h3>
        {!artistId ? (
          <p className="mt-3 text-sm text-muted-foreground">{t('publicBook.schedule.pickArtistFirst')}</p>
        ) : (
          <div className="-mx-4 mt-3 overflow-x-auto px-4">
            <div className="flex w-max gap-2 pb-1.5">
              {days.map((d) => {
                const key = format(d, 'yyyy-MM-dd');
                const selected = key === day;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectDay(key)}
                    aria-pressed={selected}
                    className={cn(
                      'flex w-14 shrink-0 flex-col items-center rounded-lg border py-2 transition-colors duration-200 hover:border-primary/60',
                      selected && 'border-primary bg-primary/10',
                      chipFocus,
                    )}
                  >
                    <span className="text-[11px] uppercase text-muted-foreground">
                      {format(d, 'EEE', { locale: dfLocale })}
                    </span>
                    <span className="font-display text-lg font-semibold leading-tight">{format(d, 'd')}</span>
                    <span className="text-[10px] text-muted-foreground">{format(d, 'MMM', { locale: dfLocale })}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Slots */}
      {artistId && (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t('publicBook.schedule.time')}
          </h3>
          {!day ? (
            <p className="mt-3 text-sm text-muted-foreground">{t('publicBook.schedule.pickDay')}</p>
          ) : slotsLoading ? (
            <div className="mt-3 flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {t('publicBook.schedule.loadingSlots')}
            </div>
          ) : !slots || slots.length === 0 ? (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
              <CalendarX2 className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('publicBook.schedule.noSlots')}</p>
              {dayIndex >= 0 && dayIndex < days.length - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1"
                  onClick={() => onSelectDay(format(days[dayIndex + 1], 'yyyy-MM-dd'))}
                >
                  {t('publicBook.schedule.tryNextDay')}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {slots.map((iso) => (
                  <Button
                    key={iso}
                    variant="outline"
                    disabled={holding}
                    onClick={() => onPickSlot(iso)}
                    className={cn('font-medium tabular-nums', pendingSlot === iso && 'border-primary')}
                  >
                    {holding && pendingSlot === iso
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : timeFmt.format(new Date(iso))}
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {t('publicBook.schedule.timesIn', { tz: studio.timezone })}
              </p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
