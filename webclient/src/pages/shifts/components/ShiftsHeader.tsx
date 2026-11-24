import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Download, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useLocaleStore } from '@/stores/localeStore';

interface ShiftsHeaderProps {
  onOpenAddModal: () => void;
  onExport: () => void;
}

export const ShiftsHeader: React.FC<ShiftsHeaderProps> = ({
  onOpenAddModal,
  onExport,
}) => {
  const { t } = useLocaleStore();

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <Link
            to="/"
            className="flex items-center gap-1 transition-colors hover:text-[#1f786f]"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('shifts.home')}</span>
          </Link>
          <span className="opacity-50">/</span>
          <span>{t('shifts.hrManagement')}</span>
          <span className="opacity-50">/</span>
          <span className="font-semibold text-foreground" aria-current="page">
            {t('shifts.title')}
          </span>
        </nav>

        {/* Title & Live Status Pill */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <h1 className="text-[24px] font-bold tracking-tight text-foreground sm:text-[28px]">
            {t('shifts.title')}
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('shifts.activeRoster')}</span>
          </span>
        </div>

        {/* Subtitle Description */}
        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          {t('shifts.subtitle')}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          id="btn-export-roster"
          onClick={onExport}
          className="h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-card hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:border-emerald-400/60 dark:hover:border-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs gap-1.5 transition-all cursor-pointer group"
        >
          <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[2.2] group-hover:translate-y-0.5 transition-transform" aria-hidden="true" />
          <span>{t('shifts.exportRoster')}</span>
        </Button>

        <Button
          type="button"
          size="sm"
          id="shift-add-open"
          onClick={onOpenAddModal}
          className="h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{t('shifts.addShift')}</span>
        </Button>
      </div>
    </div>
  );
};
