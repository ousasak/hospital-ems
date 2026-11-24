import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Check, ChevronDown, X, Trash2 } from 'lucide-react';
import { organizationService } from '@/services/organizationService';
import { sound } from '@/utils/sound';
import { ColumnSettingsPopover, type ColumnOption } from '@/components/common/ColumnSettingsPopover';
import { EmployeeFilters as IEmployeeFilters } from '../types';
import { useTranslation } from '@/i18n';

interface EmployeeFiltersProps {
  filters: IEmployeeFilters;
  onFilterChange: (filters: IEmployeeFilters) => void;
  onReset: () => void;
  columns?: ColumnOption[];
  visibleColumns?: Record<string, boolean>;
  defaultVisibleColumns?: Record<string, boolean>;
  onColumnChange?: (updated: Record<string, boolean>) => void;
  selectedCount?: number;
  onBulkDelete?: () => void;
}

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  columns = [],
  visibleColumns = {},
  defaultVisibleColumns = {},
  onColumnChange,
  selectedCount = 0,
  onBulkDelete,
}) => {
  const { t } = useTranslation();

  // Internal draft state for immediate typing/selection before Apply
  const [searchDraft, setSearchDraft] = useState(filters.search || '');
  const [officeDraft, setOfficeDraft] = useState(filters.office || '');
  const [deptDraft, setDeptDraft] = useState(filters.department || '');
  const [posDraft, setPosDraft] = useState((filters as any).position || '');
  const [typeDraft, setTypeDraft] = useState(filters.type || '');
  const [statusDraft, setStatusDraft] = useState(filters.status || '');

  // Keep internal drafts synced if external filters change (e.g. from KPI cards)
  useEffect(() => {
    setSearchDraft(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    setOfficeDraft(filters.office || '');
  }, [filters.office]);

  useEffect(() => {
    setDeptDraft(filters.department || '');
  }, [filters.department]);

  useEffect(() => {
    setPosDraft((filters as any).position || '');
  }, [(filters as any).position]);

  useEffect(() => {
    setTypeDraft(filters.type || '');
  }, [filters.type]);

  useEffect(() => {
    setStatusDraft(filters.status || '');
  }, [filters.status]);

  // Dynamic datasets for dropdown filters
  const { data: deptData } = useQuery({
    queryKey: ['filter-departments'],
    queryFn: async () => {
      try {
        const res = await organizationService.getDepartments();
        return Array.isArray(res) ? res : res?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const { data: posData } = useQuery({
    queryKey: ['filter-positions'],
    queryFn: async () => {
      try {
        const res = await organizationService.getPositions();
        return Array.isArray(res) ? res : res?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const { data: locData } = useQuery({
    queryKey: ['filter-locations'],
    queryFn: async () => {
      try {
        const res = await organizationService.getWorkLocations();
        return Array.isArray(res) ? res : res?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const departmentList = deptData && deptData.length > 0 ? deptData : [
    { id: 1, name: 'Executive Office' },
    { id: 2, name: 'Human Resources & People' },
    { id: 3, name: 'Engineering & Technology' },
    { id: 4, name: 'Finance & Accounting' },
    { id: 5, name: 'Sales & Marketing' },
    { id: 6, name: 'Operations' },
  ];

  const positionList = posData && posData.length > 0 ? posData : [
    { id: 1, title: 'Chief Executive Officer' },
    { id: 2, title: 'HR Director' },
    { id: 3, title: 'Senior HR Specialist' },
    { id: 4, title: 'VP of Engineering' },
    { id: 5, title: 'Senior Payroll Accountant' },
    { id: 6, title: 'React Frontend Developer' },
  ];

  const officeList = locData && locData.length > 0 ? locData : [
    { id: 1, name: 'Phnom Penh Headquarters' },
    { id: 2, name: 'Siem Reap Branch' },
    { id: 3, name: 'Battambang Office' },
  ];

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playClick();
    onFilterChange({
      ...filters,
      search: searchDraft.trim(),
      office: officeDraft,
      department: deptDraft,
      type: typeDraft,
      status: statusDraft,
      ...({ position: posDraft } as any),
    });
  };

  const handleReset = () => {
    sound.playClick();
    setSearchDraft('');
    setOfficeDraft('');
    setDeptDraft('');
    setPosDraft('');
    setTypeDraft('');
    setStatusDraft('');
    onReset();
  };

  const controlHeightCls = 'h-10 min-h-[40px] max-h-[40px]';
  const selectCls =
    `w-full ${controlHeightCls} pl-2.5 pr-6 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-card dark:bg-slate-900 text-foreground dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all appearance-none cursor-pointer outline-none shadow-2xs`;

  return (
    <div className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-card p-2.5 sm:p-3 shadow-2xs transition-all print:hidden">
      <form onSubmit={handleApply} className="flex flex-wrap xl:flex-nowrap items-center gap-1.5 sm:gap-2">
        {/* ─── 1. Search input ─── */}
        <div className={`relative w-full sm:w-60 md:w-64 lg:w-72 xl:w-72 max-w-xs shrink-0 ${controlHeightCls}`}>
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
          />
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder={t('employees.posSearchPlaceholder')}
            className={`w-full ${controlHeightCls} pl-9 pr-8 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-card dark:bg-slate-900 text-foreground dark:text-slate-100 placeholder:text-muted-foreground/60 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-2xs`}
          />
          {searchDraft && (
            <button
              type="button"
              onClick={() => setSearchDraft('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
              title={t('common.clearSearch')}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* 2. All Branches */}
        <div className={`relative flex-1 min-w-[95px] sm:min-w-[105px] xl:w-[115px] xl:flex-none ${controlHeightCls}`}>
          <select
            value={officeDraft}
            onChange={(e) => setOfficeDraft(e.target.value)}
            className={selectCls}
          >
            <option value="">{t('employees.allBranches')}</option>
            {officeList.map((loc: any) => (
              <option key={loc.id} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* 3. All Departments */}
        <div className={`relative flex-1 min-w-[95px] sm:min-w-[105px] xl:w-[115px] xl:flex-none ${controlHeightCls}`}>
          <select
            value={deptDraft}
            onChange={(e) => setDeptDraft(e.target.value)}
            className={selectCls}
          >
            <option value="">{t('employees.allDepts')}</option>
            {departmentList.map((dept: any) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* 4. All Positions */}
        <div className={`relative flex-1 min-w-[95px] sm:min-w-[105px] xl:w-[115px] xl:flex-none ${controlHeightCls}`}>
          <select
            value={posDraft}
            onChange={(e) => setPosDraft(e.target.value)}
            className={selectCls}
          >
            <option value="">{t('employees.allPositions')}</option>
            {positionList.map((pos: any) => (
              <option key={pos.id} value={pos.title}>
                {pos.title}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* 5. All Types */}
        <div className={`relative flex-1 min-w-[85px] sm:min-w-[95px] xl:w-[105px] xl:flex-none ${controlHeightCls}`}>
          <select
            value={typeDraft}
            onChange={(e) => setTypeDraft(e.target.value)}
            className={selectCls}
          >
            <option value="">{t('employees.allTypes')}</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* 6. All Status */}
        <div className={`relative flex-1 min-w-[105px] sm:min-w-[115px] xl:w-[130px] xl:flex-none ${controlHeightCls}`}>
          <select
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value)}
            className={selectCls}
          >
            <option value="">{t('employees.allStatus')}</option>
            <option value="active">{t('status.active')}</option>
            <option value="probation">{t('status.probation')}</option>
            <option value="resigned">{t('status.resigned')}</option>
            <option value="inactive">{t('status.inactive')}</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* ─── 7. Apply Button (Dark Teal/Forest Green #0f766e) ─── */}
        <button
          type="submit"
          className={`${controlHeightCls} px-3 sm:px-3.5 rounded-lg bg-[#0f766e] hover:bg-[#115e59] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0`}
          title={t('common.apply')}
        >
          <Check size={14} className="stroke-[2.5]" />
          <span>{t('common.apply')}</span>
        </button>

        {/* ─── 8. Reset Button (Clean SmartHR neutral outline) ─── */}
        <button
          type="button"
          onClick={handleReset}
          className={`${controlHeightCls} px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-card hover:bg-muted/80 text-foreground dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer shrink-0`}
          title={t('common.reset')}
        >
          <span>{t('common.reset')}</span>
        </button>

        {/* ─── 9. Bulk Delete Button (When rows selected) ─── */}
        {selectedCount > 0 && onBulkDelete && (
          <button
            type="button"
            onClick={onBulkDelete}
            className={`${controlHeightCls} px-3 text-xs sm:text-[13px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-500/20 hover:bg-rose-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs`}
          >
            <Trash2 size={14} />
            <span>
              {t('common.deleteSelected')} ({selectedCount})
            </span>
          </button>
        )}

        {/* 10. Manage Columns Popover */}
        {columns.length > 0 && onColumnChange && (
          <div className="ml-auto shrink-0">
            <ColumnSettingsPopover
              columns={columns}
              visibleColumns={visibleColumns}
              defaultVisibleColumns={defaultVisibleColumns}
              onChange={onColumnChange}
              size="md"
              label={t('common.manageTable')}
              buttonClassName="border-slate-300 dark:border-slate-700 shadow-2xs h-10 font-semibold text-xs sm:text-sm px-3"
            />
          </div>
        )}
      </form>
    </div>
  );
};

export default EmployeeFilters;
