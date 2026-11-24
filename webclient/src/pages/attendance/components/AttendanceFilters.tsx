import React, { useState, useEffect } from 'react';
import { Search, Check, ChevronDown, X, Filter } from 'lucide-react';
import { sound } from '@/utils/sound';
import { ColumnSettingsPopover, type ColumnOption } from '@/components/common/ColumnSettingsPopover';
import { AttendanceFilterState } from '../types';
import { useTranslation } from '@/i18n';

interface AttendanceFiltersProps {
  filters: AttendanceFilterState;
  countries?: string[];
  regions?: string[];
  offices?: string[];
  departments?: string[];
  shifts?: string[];
  onApply: (filters: AttendanceFilterState) => void;
  onReset: () => void;
  columns?: ColumnOption[];
  visibleColumns?: Record<string, boolean>;
  defaultVisibleColumns?: Record<string, boolean>;
  onColumnChange?: (updated: Record<string, boolean>) => void;
}

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  filters,
  departments = [],
  shifts = [],
  onApply,
  onReset,
  columns = [],
  visibleColumns = {},
  defaultVisibleColumns = {},
  onColumnChange,
}) => {
  const { t } = useTranslation();

  // Internal draft states for instant typing & dropdown selection before Apply
  const [searchDraft, setSearchDraft] = useState(filters.search || '');
  const [deptDraft, setDeptDraft] = useState(filters.department || '');
  const [shiftDraft, setShiftDraft] = useState(filters.shift || '');
  const [statusDraft, setStatusDraft] = useState(filters.status || '');

  // Keep internal drafts synchronized if parent filters change
  useEffect(() => {
    setSearchDraft(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    setDeptDraft(filters.department || '');
  }, [filters.department]);

  useEffect(() => {
    setShiftDraft(filters.shift || '');
  }, [filters.shift]);

  useEffect(() => {
    setStatusDraft(filters.status || '');
  }, [filters.status]);

  // Instant live search debounced by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((searchDraft || '').trim() !== (filters.search || '')) {
        onApply({
          ...filters,
          search: searchDraft.trim(),
          department: deptDraft,
          shift: shiftDraft,
          status: statusDraft,
        });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchDraft, deptDraft, shiftDraft, statusDraft, filters, onApply]);

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playClick();
    onApply({
      ...filters,
      search: searchDraft.trim(),
      department: deptDraft,
      shift: shiftDraft,
      status: statusDraft,
    });
  };

  const handleReset = () => {
    sound.playClick();
    setSearchDraft('');
    setDeptDraft('');
    setShiftDraft('');
    setStatusDraft('');
    onReset();
  };

  const controlHeightCls = 'h-10 min-h-[40px] max-h-[40px]';
  const selectCls =
    `w-full ${controlHeightCls} pl-3 pr-7 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-card dark:bg-slate-900 text-foreground dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all appearance-none cursor-pointer outline-none shadow-2xs`;

  return (
    <div className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-card p-2.5 sm:p-3 shadow-2xs transition-all print:hidden">
      <form onSubmit={handleApply} className="flex flex-wrap xl:flex-nowrap items-center gap-2">
        {/* ─── 1. Search input (ឈ្មោះ ឬ អត្តលេខ) ─── */}
        <div className={`relative w-full sm:w-64 md:w-72 lg:w-80 shrink-0 ${controlHeightCls}`}>
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
          />
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder={t('attendance.searchPlaceholder', 'ស្វែងរកឈ្មោះបុគ្គលិក ឬអត្តលេខ...')}
            className={`w-full ${controlHeightCls} pl-9 pr-8 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-card dark:bg-slate-900 text-foreground dark:text-slate-100 placeholder:text-muted-foreground/60 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-2xs`}
          />
          {searchDraft && (
            <button
              type="button"
              onClick={() => setSearchDraft('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
              title={t('common.clearSearch', 'Clear search')}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* ─── 2. All Departments (គ្រប់ផ្នែក / នាយកដ្ឋាន) ─── */}
        <div className={`relative flex-1 min-w-[140px] sm:min-w-[160px] xl:w-[200px] xl:flex-none ${controlHeightCls}`}>
          <select
            value={deptDraft}
            onChange={(e) => {
              const val = e.target.value;
              setDeptDraft(val);
              onApply({
                ...filters,
                search: searchDraft.trim(),
                department: val,
                shift: shiftDraft,
                status: statusDraft,
              });
            }}
            className={selectCls}
          >
            <option value="">{t('filters.allDepartments', 'គ្រប់ផ្នែក / នាយកដ្ឋាន')}</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* ─── 3. All Shifts (គ្រប់វេនការងារ) ─── */}
        <div className={`relative flex-1 min-w-[130px] sm:min-w-[150px] xl:w-[180px] xl:flex-none ${controlHeightCls}`}>
          <select
            value={shiftDraft}
            onChange={(e) => {
              const val = e.target.value;
              setShiftDraft(val);
              onApply({
                ...filters,
                search: searchDraft.trim(),
                department: deptDraft,
                shift: val,
                status: statusDraft,
              });
            }}
            className={selectCls}
          >
            <option value="">{t('filters.allShifts', 'គ្រប់វេនការងារ')}</option>
            {shifts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* ─── 4. All Status (ស្ថានភាពទាំងអស់) ─── */}
        <div className={`relative flex-1 min-w-[120px] sm:min-w-[130px] xl:w-[150px] xl:flex-none ${controlHeightCls}`}>
          <select
            value={statusDraft}
            onChange={(e) => {
              const val = e.target.value;
              setStatusDraft(val);
              onApply({
                ...filters,
                search: searchDraft.trim(),
                department: deptDraft,
                shift: shiftDraft,
                status: val,
              });
            }}
            className={selectCls}
          >
            <option value="">{t('filters.allStatus', 'ស្ថានភាពទាំងអស់')}</option>
            <option value="Present">{t('status.present', 'មានវត្តមាន')}</option>
            <option value="Late">{t('status.late', 'មកយឺត')}</option>
            <option value="Half Day">{t('status.halfDay', 'ច្បាប់កន្លះថ្ងៃ')}</option>
            <option value="Absent">{t('status.absent', 'អវត្តមាន')}</option>
            <option value="On Leave">{t('status.onLeave', 'ច្បាប់ឈប់')}</option>
            <option value="Remote">{t('status.remote', 'ពីចម្ងាយ')}</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* ─── 5. Action Buttons (Apply & Reset) ─── */}
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

        {/* ─── 6. Manage Columns Popover (គ្រប់គ្រងតារាង) ─── */}
        {columns.length > 0 && onColumnChange && (
          <div className="ml-auto shrink-0">
            <ColumnSettingsPopover
              columns={columns}
              visibleColumns={visibleColumns}
              defaultVisibleColumns={defaultVisibleColumns}
              onChange={onColumnChange}
              size="md"
              label={t('common.manageTable', 'គ្រប់គ្រងតារាង')}
              buttonClassName="border-slate-300 dark:border-slate-700 shadow-2xs h-10 font-semibold text-xs sm:text-sm px-3"
            />
          </div>
        )}
      </form>
    </div>
  );
};
