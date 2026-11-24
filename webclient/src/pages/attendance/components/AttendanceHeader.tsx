import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Download, Plus } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { AttendanceDateNavigator } from './AttendanceDateNavigator';

interface AttendanceHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onExport: () => void;
  totalRecords: number;
  onOpenAdminEntry?: () => void;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  selectedDate,
  onDateChange,
  onExport,
  totalRecords,
  onOpenAdminEntry,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      {/* ─── Breadcrumb: ផ្ទាំងគ្រប់គ្រង > គ្រប់គ្រងវត្តមាន > បញ្ជីវត្តមានការងារ ─── */}
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
          {t('attendance.management', 'គ្រប់គ្រងវត្តមាន')}
        </span>
        <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
        <span className="font-semibold text-foreground" aria-current="page">
          {t('attendance.title', 'វត្តមានបុគ្គលិក')}
        </span>
      </nav>

      {/* ─── Title, Badge & Subtitle + Top Action Buttons ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {t('attendance.title', 'វត្តមានបុគ្គលិក')}
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {totalRecords} {t('common.records', 'កំណត់ត្រា')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>{t('attendance.liveSync', 'ផ្សាយផ្ទាល់')}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
            {t(
              'attendance.subtitle',
              'តាមដានវត្តមាន ម៉ោងចូល-ចេញ ម៉ោងបន្ថែម និងការលើកលែងប្រចាំថ្ងៃរបស់បុគ្គលិក'
            )}
          </p>
        </div>

        {/* ─── Top Right Action Buttons (Clean Shadcn Date Navigator, Manual Entry, Export CSV) ─── */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          {/* 1. Clean Shadcn Date Navigator */}
          <AttendanceDateNavigator
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />

          {/* 2. Manual Check-in Button */}
          {onOpenAdminEntry && (
            <Button
              type="button"
              size="sm"
              onClick={onOpenAdminEntry}
              className="h-9 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4 stroke-[2.2]" />
              <span>{t('attendance.manualEntry', 'ចុះវត្តមានជំនួស')}</span>
            </Button>
          )}

          {/* 3. Export CSV Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-9 px-3.5 rounded-xl border-border bg-card hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:border-emerald-400/60 dark:hover:border-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs gap-1.5 transition-all cursor-pointer group"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[2.2] group-hover:translate-y-0.5 transition-transform" />
            <span>{t('common.exportCsv', 'នាំចេញ CSV')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader;
