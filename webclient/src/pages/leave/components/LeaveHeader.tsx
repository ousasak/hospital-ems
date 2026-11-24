import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import { toast } from 'sonner';

interface LeaveHeaderProps {
  onExport?: () => void;
  pendingCount?: number;
  totalRecords?: number;
}

export const LeaveHeader: React.FC<LeaveHeaderProps> = ({
  onExport,
  pendingCount = 0,
  totalRecords = 0,
}) => {
  const { t } = useTranslation();

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      toast.success(t('leaves.exportCsvSuccess', 'បាននាំចេញទិន្នន័យច្បាប់ឈប់សម្រាកដោយជោគជ័យ'));
    }
  };

  return (
    <div className="space-y-1">
      {/* ─── Breadcrumb: ផ្ទាំងគ្រប់គ្រង > គ្រប់គ្រងច្បាប់ > បញ្ជីច្បាប់ឈប់សម្រាក ─── */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground select-none"
      >
        <Link
          to="/"
          className="hover:text-foreground transition-colors"
        >
          {t('navigation.dashboard', 'ផ្ទាំងគ្រប់គ្រង')}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
        <span className="hover:text-foreground transition-colors">
          {t('leaves.management', 'គ្រប់គ្រងច្បាប់')}
        </span>
        <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
        <span className="font-semibold text-foreground" aria-current="page">
          {t('leaves.title', 'ច្បាប់ឈប់សម្រាក')}
        </span>
      </nav>

      {/* ─── Title, Subtitle + Top Action Buttons (Clean matching KHPosCommerce) ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t('leaves.title', 'ការគ្រប់គ្រងច្បាប់ឈប់សម្រាក')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
            {t(
              'leaves.headerSubtitle',
              'តាមដាន និងគ្រប់គ្រងសំណើសុំច្បាប់ឈប់សម្រាក សមតុល្យច្បាប់ និងកាលវិភាគបុគ្គលិកមន្ទីរពេទ្យ'
            )}
          </p>
        </div>

        {/* ─── Top Right Action Buttons (Export CSV Only - Admin Role Standard) ─── */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          {/* 1. Export CSV Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 px-3.5 rounded-xl border-slate-300 dark:border-slate-700 bg-card hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:border-emerald-400/60 dark:hover:border-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs gap-1.5 transition-all cursor-pointer group"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[2.2] group-hover:translate-y-0.5 transition-transform" />
            <span>{t('common.exportCsv', 'នាំចេញ CSV')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeaveHeader;
