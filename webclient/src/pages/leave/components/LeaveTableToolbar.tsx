import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, X, Check, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sound } from '@/utils/sound';
import { useTranslation } from '@/i18n';
import { ColumnVisibilityState } from './DataTableViewOptions';

interface LeaveTableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  dateFilter?: string;
  onDateFilterChange?: (value: string) => void;
  statusFilters: string[];
  onStatusFilterChange: (values: string[]) => void;
  typeFilters: string[];
  onTypeFilterChange: (values: string[]) => void;
  officeFilter: string;
  onOfficeFilterChange: (value: string) => void;
  offices: string[];
  onResetFilters: () => void;
  isFiltered?: boolean;
  columnVisibility?: ColumnVisibilityState;
  onColumnVisibilityChange?: (columns: ColumnVisibilityState) => void;
  selectedCount: number;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onClearSelection: () => void;
  statusCounts: { pending: number; approved: number; rejected: number };
}

export const LeaveTableToolbar: React.FC<LeaveTableToolbarProps> = ({
  search,
  onSearchChange,
  dateFilter = '',
  onDateFilterChange,
  statusFilters,
  onStatusFilterChange,
  typeFilters,
  onTypeFilterChange,
  officeFilter,
  onOfficeFilterChange,
  offices = [],
  onResetFilters,
  selectedCount,
  onBulkApprove,
  onBulkReject,
  onClearSelection,
  statusCounts,
}) => {
  const { t } = useTranslation();

  // Internal draft states for instant search & dropdowns
  const [searchDraft, setSearchDraft] = useState(search || '');
  const [dateDraft, setDateDraft] = useState(dateFilter || '');
  const [officeDraft, setOfficeDraft] = useState(officeFilter || '');
  const [typeDraft, setTypeDraft] = useState(typeFilters[0] || '');
  const [statusDraft, setStatusDraft] = useState(statusFilters[0] || '');

  // Synchronize drafts with external filters
  useEffect(() => {
    setSearchDraft(search || '');
  }, [search]);

  useEffect(() => {
    setDateDraft(dateFilter || '');
  }, [dateFilter]);

  useEffect(() => {
    setOfficeDraft(officeFilter || '');
  }, [officeFilter]);

  useEffect(() => {
    setTypeDraft(typeFilters[0] || '');
  }, [typeFilters]);

  useEffect(() => {
    setStatusDraft(statusFilters[0] || '');
  }, [statusFilters]);

  // Debounce search input for instant live search (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((searchDraft || '').trim() !== (search || '')) {
        onSearchChange(searchDraft.trim());
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playClick();
    onSearchChange(searchDraft.trim());
    onDateFilterChange?.(dateDraft);
    onOfficeFilterChange(officeDraft);
    onTypeFilterChange(typeDraft ? [typeDraft] : []);
    onStatusFilterChange(statusDraft ? [statusDraft] : []);
  };

  const handleReset = () => {
    sound.playClick();
    setSearchDraft('');
    setDateDraft('');
    setOfficeDraft('');
    setTypeDraft('');
    setStatusDraft('');
    onResetFilters();
  };

  const controlHeightCls = 'h-10 min-h-[40px] max-h-[40px]';
  const selectCls =
    `w-full ${controlHeightCls} pl-3 pr-7 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-card dark:bg-slate-900 text-foreground dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all appearance-none cursor-pointer outline-none shadow-2xs`;

  return (
    <div className="space-y-3">
      {/* ─── Main Unified Filter Toolbar (Cloned directly from EmployeeFilters) ─── */}
      <div className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-card p-2.5 sm:p-3 shadow-2xs transition-all print:hidden">
        <form onSubmit={handleApply} className="flex flex-wrap xl:flex-nowrap items-center gap-2">
          {/* 1. Search input (ឈ្មោះ ឬ មូលហេតុ) */}
          <div className={`relative w-full sm:w-64 md:w-72 lg:w-80 shrink-0 ${controlHeightCls}`}>
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
            />
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder={t('leaves.searchPlaceholder', 'ស្វែងរកឈ្មោះបុគ្គលិក ឬមូលហេតុ...')}
              className={`w-full ${controlHeightCls} pl-9 pr-8 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-card dark:bg-slate-900 text-foreground dark:text-slate-100 placeholder:text-muted-foreground/60 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-2xs`}
            />
            {searchDraft && (
              <button
                type="button"
                onClick={() => {
                  setSearchDraft('');
                  onSearchChange('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
                title={t('common.clearSearch', 'Clear search')}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 2. Date Filter (ច្រោះតាមកាលបរិច្ឆេទ) */}
          <div className={`relative flex-1 min-w-[130px] sm:min-w-[145px] xl:w-[155px] xl:flex-none ${controlHeightCls}`}>
            <input
              type="date"
              value={dateDraft}
              onChange={(e) => {
                const val = e.target.value;
                setDateDraft(val);
                onDateFilterChange?.(val);
              }}
              className={`w-full ${controlHeightCls} pl-3 pr-7 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-card dark:bg-slate-900 text-foreground dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer outline-none shadow-2xs`}
              title="ច្រោះតាមកាលបរិច្ឆេទ"
            />
            {dateDraft && (
              <button
                type="button"
                onClick={() => {
                  setDateDraft('');
                  onDateFilterChange?.('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                title="សម្អាតកាលបរិច្ឆេទ"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* 3. All Branches / Locations (គ្រប់សាខា / ទីតាំង) */}
          <div className={`relative flex-1 min-w-[130px] sm:min-w-[150px] xl:w-[170px] xl:flex-none ${controlHeightCls}`}>
            <select
              value={officeDraft}
              onChange={(e) => {
                const val = e.target.value;
                setOfficeDraft(val);
                onOfficeFilterChange(val);
              }}
              className={selectCls}
            >
              <option value="">{t('filters.allHubs', 'គ្រប់សាខា / ទីតាំង')}</option>
              {offices.map((off) => (
                <option key={off} value={off}>
                  {off}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* 3. All Leave Types (គ្រប់ប្រភេទច្បាប់) */}
          <div className={`relative flex-1 min-w-[140px] sm:min-w-[160px] xl:w-[190px] xl:flex-none ${controlHeightCls}`}>
            <select
              value={typeDraft}
              onChange={(e) => {
                const val = e.target.value;
                setTypeDraft(val);
                onTypeFilterChange(val ? [val] : []);
              }}
              className={selectCls}
            >
              <option value="">{t('filters.allLeaveTypes', 'គ្រប់ប្រភេទច្បាប់')}</option>
              <option value="Annual Leave">{t('leaves.annualLeave', 'ច្បាប់ប្រចាំឆ្នាំ (Annual)')}</option>
              <option value="Sick Leave">{t('leaves.sickLeave', 'ច្បាប់ឈឺ (Sick Leave)')}</option>
              <option value="Personal Leave">{t('leaves.personalLeave', 'ច្បាប់ផ្ទាល់ខ្លួន (Personal)')}</option>
              <option value="Unpaid Leave">{t('leaves.unpaidLeave', 'គ្មានប្រាក់ឈ្នួល (Unpaid)')}</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* 4. All Status (គ្រប់ស្ថានភាព) */}
          <div className={`relative flex-1 min-w-[130px] sm:min-w-[140px] xl:w-[160px] xl:flex-none ${controlHeightCls}`}>
            <select
              value={statusDraft}
              onChange={(e) => {
                const val = e.target.value;
                setStatusDraft(val);
                onStatusFilterChange(val ? [val] : []);
              }}
              className={selectCls}
            >
              <option value="">{t('filters.allStatus', 'គ្រប់ស្ថានភាព')}</option>
              <option value="Pending">
                {t('status.pending', 'រង់ចាំពិនិត្យ')} ({statusCounts.pending})
              </option>
              <option value="Approved">
                {t('status.approved', 'បានអនុម័ត')} ({statusCounts.approved})
              </option>
              <option value="Rejected">
                {t('status.rejected', 'បានបដិសេធ')} ({statusCounts.rejected})
              </option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* 5. Action Buttons (Apply & Reset) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="submit"
              className={`${controlHeightCls} px-3.5 rounded-lg bg-[#0f766e] hover:bg-[#115e59] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer`}
              title={t('common.apply', 'អនុវត្ត')}
            >
              <Check size={14} className="stroke-[2.5]" />
              <span>{t('common.apply', 'អនុវត្ត')}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className={`${controlHeightCls} px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-card hover:bg-muted/80 text-foreground dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer`}
              title={t('common.reset', 'កំណត់ឡើងវិញ')}
            >
              <span>{t('common.reset', 'កំណត់ឡើងវិញ')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ─── 6. Bulk Action Floating Banner (when rows selected) ─── */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-500/30 bg-teal-50/60 dark:bg-teal-950/30 px-4 py-2.5 text-xs animate-in fade-in slide-in-from-top-1 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-800 dark:text-teal-300">
              បានជ្រើសរើស {selectedCount} សំណើ
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onBulkApprove}
              className="h-8 gap-1.5 border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-semibold cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{t('leaves.bulkApprove', 'អនុម័តដែលបានរើស')}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onBulkReject}
              className="h-8 gap-1.5 border-rose-500/40 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-semibold cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>{t('leaves.bulkReject', 'បដិសេធដែលបានរើស')}</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {t('common.clearSelection', 'សម្អាតជម្រើស')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveTableToolbar;
