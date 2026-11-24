import React from 'react';
import { useTranslation } from '@/i18n';
import {
  ChevronUp,
  ChevronDown,
  Search,
  Eye,
  Pencil,
  Trash2,
  Briefcase,
  Phone,
  QrCode,
} from 'lucide-react';
import { Employee } from '../types';
import { cn } from '@/utils';
import { getAbsoluteImageUrl } from '@/utils/image';

interface EmployeeTableProps {
  employees: Employee[];
  isLoading: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort: (column: string) => void;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onTransfer?: (employee: Employee) => void;
  onManageQr?: (employee: Employee) => void;
  selectedIds?: number[];
  onToggleSelect?: (id: number) => void;
  onToggleSelectAll?: () => void;
  visibleColumns?: Record<string, boolean>;
}

// ─── Avatar Initials & Color Helper ───────────────────────────────────────────
const getInitials = (firstName?: string, lastName?: string): string => {
  const f = firstName?.trim() || '';
  const l = lastName?.trim() || '';
  if (!f && !l) return 'EM';
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
  return (f || l).slice(0, 2).toUpperCase();
};

const avatarColorPalettes = [
  'bg-blue-100/90 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60',
  'bg-teal-100/90 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60',
  'bg-violet-100/90 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/60',
  'bg-indigo-100/90 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
  'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
  'bg-amber-100/90 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
  'bg-rose-100/90 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
  'bg-sky-100/90 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
];

const getAvatarColorClass = (id: number): string => {
  return avatarColorPalettes[Math.abs(id) % avatarColorPalettes.length];
};

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  isLoading,
  sortBy,
  sortDir,
  onSort,
  onView,
  onEdit,
  onDelete,
  onManageQr,
  selectedIds = [],
  visibleColumns = {},
}) => {
  const { t } = useTranslation();

  const isColVisible = (colKey: string) => visibleColumns[colKey] !== false;

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden print:hidden">
      <div className="overflow-x-auto">
        <table className="w-full data-table border-collapse min-w-[950px]">
          {/* ─── Tinted Table Header ─── */}
          <thead className="bg-[#e6f4f8] dark:bg-cyan-950/30 text-[#0f5b78] dark:text-cyan-300 sticky top-0 border-b border-cyan-100 dark:border-cyan-900/40 z-10 text-xs font-semibold select-none">
            <tr>
              {/* 1. Employee Column */}
              {isColVisible('name') && (
                <th
                  className="pl-5 pr-4 py-3.5 text-left cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onSort('name')}
                >
                  <span>{t('employees.colEmployee')}</span>
                  {renderSortIcon('name')}
                </th>
              )}

              {/* 2. Contact Column */}
              {isColVisible('contact') && (
                <th className="px-4 py-3.5 text-left">
                  <span>{t('employees.contact')}</span>
                </th>
              )}

              {/* 3. Department & Role Column */}
              {isColVisible('department') && (
                <th className="px-4 py-3.5 text-left">
                  <span>{t('employees.departmentAndPosition')}</span>
                </th>
              )}

              {/* 4. Basic Salary Column */}
              {isColVisible('basic_salary') && (
                <th
                  className="px-4 py-3.5 text-left cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onSort('basic_salary')}
                >
                  <span>{t('employees.basicSalary')}</span>
                  {renderSortIcon('basic_salary')}
                </th>
              )}

              {/* 5. Status Column */}
              {isColVisible('status') && (
                <th
                  className="px-4 py-3.5 text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onSort('employment_status')}
                >
                  <span>{t('employees.employmentStatus')}</span>
                  {renderSortIcon('employment_status')}
                </th>
              )}

              {/* 6. Actions Column */}
              <th className="w-28 px-4 py-3.5 text-right pr-6">
                <span>{t('common.actions')}</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-border/60">
                  <td className="pl-5 pr-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-muted" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 rounded bg-muted" />
                        <div className="h-2.5 w-20 rounded bg-muted/60" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="space-y-1">
                      <div className="h-3.5 w-36 rounded bg-muted/60" />
                      <div className="h-2.5 w-24 rounded bg-muted/40" />
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="space-y-1">
                      <div className="h-3.5 w-28 rounded bg-muted/60" />
                      <div className="h-2.5 w-20 rounded bg-muted/40" />
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-16 rounded bg-muted/60" />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="h-5 w-16 rounded-full bg-muted/70 mx-auto" />
                  </td>
                  <td className="px-4 py-3.5 text-right pr-6">
                    <div className="h-7 w-20 rounded bg-muted/60 ml-auto" />
                  </td>
                </tr>
              ))
            ) : employees.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2.5 px-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-2xs">
                      <Search className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                      {t('employees.noEmployeesFound')}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {t(
                        'employees.noEmployeesFoundDesc',
                        t('employees.noMatchingDataDesc')
                      )}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const fullName =
                  `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Employee';
                const department =
                  emp.primary_assignment?.department?.name ||
                  '—';
                const position =
                  emp.primary_assignment?.position?.title ||
                  '—';
                const workLocation = emp.primary_assignment?.work_location?.name || null;
                const employmentType = emp.primary_assignment?.employment_type?.name || null;
                const employeeCode =
                  emp.employee_code || `EMP-${String(emp.id).padStart(4, '0')}`;

                const isSelected = selectedIds.includes(emp.id);
                const status = (emp.employment_status || 'active').toLowerCase();

                // Dynamic Salary directly from API / Database Seeder
                const salaryRaw =
                  emp.current_salary?.base_salary ??
                  emp.base_salary;
                const salaryNum =
                  salaryRaw !== undefined && salaryRaw !== null && salaryRaw !== ''
                    ? Number(salaryRaw)
                    : null;
                const salaryFormatted =
                  salaryNum !== null && !isNaN(salaryNum) && salaryNum > 0
                    ? `$${salaryNum.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : '—';

                const avatarColor = getAvatarColorClass(emp.id);
                const initials = getInitials(emp.first_name, emp.last_name);

                return (
                  <tr
                    key={emp.id}
                    className={cn(
                      'hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors border-b border-slate-100 dark:border-slate-800/80 group',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    {/* 1. Employee Info (Clean Modern Initials Avatar + Full Name + Khmer Name + Badges) */}
                    {isColVisible('name') && (
                      <td className="pl-5 pr-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Clean Initials Avatar or Real Profile Photo */}
                          <div
                            className={cn(
                              'w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl overflow-hidden flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 select-none border',
                              avatarColor
                            )}
                          >
                            {emp.avatar_url && !emp.avatar_url.includes('unsplash') ? (
                              <img
                                src={getAbsoluteImageUrl(emp.avatar_url)}
                                alt={fullName}
                                className="w-full h-full object-cover shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                onClick={() => onView(emp)}
                                className="font-bold text-sm text-foreground hover:text-primary cursor-pointer transition-colors leading-tight"
                              >
                                {fullName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="font-mono text-[10.5px] font-semibold text-primary/90 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                {employeeCode}
                              </span>
                              {employmentType && (
                                <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  {employmentType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* 2. Contact (Clean Email + Phone) */}
                    {isColVisible('contact') && (
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-foreground truncate max-w-[220px]">
                            {emp.email || '—'}
                          </div>
                          {emp.phone ? (
                            <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                              <Phone size={11} className="text-slate-400 shrink-0" />
                              <span>{emp.phone}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-muted-foreground/60">—</div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 3. Department & Role (Briefcase icon + Dept + Position + Location) */}
                    {isColVisible('department') && (
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Briefcase size={13} className="text-primary/80 shrink-0" />
                            <span className="truncate max-w-[200px]">{department}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground pl-4 truncate max-w-[200px]">
                            <span>{position}</span>
                            {workLocation && (
                              <span className="text-muted-foreground/60 text-[10.5px] ml-1.5">
                                • {workLocation}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    )}

                    {/* 4. Basic Salary ($) Dynamic */}
                    {isColVisible('basic_salary') && (
                      <td className="px-4 py-3.5 font-bold font-mono text-sm text-foreground">
                        {salaryFormatted}
                      </td>
                    )}

                    {/* 5. Employment Status Pill Badge */}
                    {isColVisible('status') && (
                      <td className="px-4 py-3.5 text-center">
                        {status === 'active' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                            {t('status.active')}
                          </span>
                        ) : status === 'probation' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                            {t('status.probation')}
                          </span>
                        ) : status === 'inactive' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/25">
                            {t('status.inactive')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25">
                            {t('status.resigned')}
                          </span>
                        )}
                      </td>
                    )}

                    {/* 6. Inline Actions Menu (View, Edit, Delete) */}
                    <td
                      className="px-4 py-3.5 text-right pr-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {onManageQr && (
                          <button
                            type="button"
                            onClick={() => onManageQr(emp)}
                            title={t('employees.managePersonalQr')}
                            className="h-7 w-7 min-w-[28px] min-h-[28px] rounded-md border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/50 flex items-center justify-center transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06),0_1px_1px_rgba(0,0,0,0.03)] hover:shadow-xs active:scale-95 cursor-pointer"
                          >
                            <QrCode size={13} className="stroke-[1.9]" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onView(emp)}
                          title={t('common.view')}
                          className="h-7 w-7 min-w-[28px] min-h-[28px] rounded-md border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-teal-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/50 flex items-center justify-center transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06),0_1px_1px_rgba(0,0,0,0.03)] hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Eye size={13} className="stroke-[1.9]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEdit(emp)}
                          title={t('common.edit')}
                          className="h-7 w-7 min-w-[28px] min-h-[28px] rounded-md border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 flex items-center justify-center transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06),0_1px_1px_rgba(0,0,0,0.03)] hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Pencil size={13} className="stroke-[1.9]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(emp)}
                          title={t('common.delete')}
                          className="h-7 w-7 min-w-[28px] min-h-[28px] rounded-md border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-rose-500 dark:text-rose-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/50 flex items-center justify-center transition-all shadow-[0_1px_2px_rgba(0,0,0,0.06),0_1px_1px_rgba(0,0,0,0.03)] hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Trash2 size={13} className="stroke-[1.9]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTable;
