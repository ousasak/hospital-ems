import React from 'react';
import {
  AlertTriangle,
  CopyX,
  UserX,
  Users,
  ClockAlert,
  Globe,
  CheckCircle,
} from 'lucide-react';
import { ShiftConflict } from '../types';
import { Button } from '../../../components/ui/button';
import { useLocaleStore } from '@/stores/localeStore';

interface ShiftConflictsAlertsProps {
  conflicts: ShiftConflict[];
  onResolve: (id: string) => void;
}

export const ShiftConflictsAlerts: React.FC<ShiftConflictsAlertsProps> = ({
  conflicts,
  onResolve,
}) => {
  const { t } = useLocaleStore();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CopyX':
      case 'icon-copy-x':
        return <CopyX className="h-4 w-4" aria-hidden="true" />;
      case 'UserX':
      case 'icon-user-x':
        return <UserX className="h-4 w-4" aria-hidden="true" />;
      case 'Users':
      case 'icon-users':
        return <Users className="h-4 w-4" aria-hidden="true" />;
      case 'ClockAlert':
      case 'icon-clock-alert':
        return <ClockAlert className="h-4 w-4" aria-hidden="true" />;
      case 'Globe':
      case 'icon-globe':
        return <Globe className="h-4 w-4" aria-hidden="true" />;
      default:
        return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
    }
  };

  return (
    <section
      aria-label="Shift conflicts"
      className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-card p-4 sm:p-5 shadow-xs"
    >
      {/* 1. Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {t('shifts.conflicts.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('shifts.conflicts.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Grid or Empty State */}
      <div
        id="conflict-list"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {conflicts.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
            <CheckCircle className="h-7 w-7 text-emerald-600 mx-auto" aria-hidden="true" />
            <p className="mt-2 text-sm font-bold text-foreground">
              {t('shifts.conflicts.noConflicts')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('shifts.conflicts.noConflictsDesc')}
            </p>
          </div>
        ) : (
          conflicts.map((conflict) => (
            <article
              key={conflict.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-500/40 hover:bg-rose-500/[0.05] hover:shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
                  {getIcon(conflict.icon)}
                </span>
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-rose-600">
                  {t('shifts.conflicts.actionReq')}
                </span>
              </div>

              <p className="mt-2.5 text-xs font-bold text-foreground">
                {conflict.title}
              </p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                {conflict.text}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-rose-500/10 pt-2 font-mono text-[11px]">
                <span className="font-semibold text-[#1f786f]">
                  {conflict.meta}
                </span>
                <Button
                  type="button"
                  variant="outline-destructive"
                  size="sm"
                  data-id={conflict.id}
                  onClick={() => onResolve(conflict.id)}
                  className="h-6 px-2 text-[11px] font-semibold"
                >
                  {t('shifts.conflicts.resolve')}
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};
