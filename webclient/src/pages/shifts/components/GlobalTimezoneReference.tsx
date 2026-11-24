import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { TimezoneHub } from '../types';
import { shiftService } from '@/services/shiftService';
import { useLocaleStore } from '@/stores/localeStore';

export const GlobalTimezoneReference: React.FC = () => {
  const { t } = useLocaleStore();
  const [hubs, setHubs] = useState<TimezoneHub[]>(() =>
    shiftService.getTimezoneHubs()
  );

  useEffect(() => {
    // Refresh live clocks every 30 seconds
    const interval = setInterval(() => {
      setHubs(shiftService.getTimezoneHubs());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      aria-label="Timezone reference"
      className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-card p-4 sm:p-5 shadow-xs"
    >
      {/* 1. Header with Live UTC sync pill */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-[#1f786f] ring-1 ring-[#1f786f]/20">
            <Globe className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {t('shifts.timezone.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('shifts.timezone.subtitle')}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t('shifts.timezone.synced')}</span>
        </span>
      </div>

      {/* 2. 6-hub Grid */}
      <div
        id="tz-reference"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        {hubs.map((hub) => (
          <div
            key={hub.office}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-card p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1f786f]/40 hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>{hub.flag}</span>
                <span>{hub.office}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                  hub.isOpen
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    hub.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{hub.isOpen ? t('shifts.timezone.active') : t('shifts.timezone.closed')}</span>
              </span>
            </div>

            <p className="mt-1 font-mono text-[11px] text-muted-foreground truncate">
              {hub.tz.replace('_', ' ')}
            </p>

            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 font-mono text-[11px]">
              <span className="font-bold text-[#1f786f] text-xs">
                {hub.time}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {hub.hours}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
