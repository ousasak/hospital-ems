import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  Search,
  Eye,
  AlertTriangle,
  Check,
  ShieldCheck,
  Clock,
  User,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { AttendanceRecordItem, AttendanceStatus } from '../types';
import { cn } from '@/utils';
import { getAbsoluteImageUrl } from '@/utils/image';

interface AttendanceTableProps {
  records: AttendanceRecordItem[];
  isLoading: boolean;
  sortBy?: string | null;
  sortDir?: 'asc' | 'desc';
  onSort: (column: string) => void;
  onView: (record: AttendanceRecordItem) => void;
  visibleColumns?: Record<string, boolean>;
}

// ─── Avatar Initials & Color Helper ───────────────────────────────────────────
const getInitials = (name?: string): string => {
  if (!name) return 'EM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const avatarColorPalettes = [
  'bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60',
  'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60',
  'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
  'bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
  'bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/60',
  'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
];

const getAvatarColorClass = (idStr: string): string => {
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColorPalettes[Math.abs(hash) % avatarColorPalettes.length];
};

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  isLoading,
  sortBy,
  sortDir = 'asc',
  onSort,
  onView,
  visibleColumns = {},
}) => {
  const { t } = useTranslation();

  const isColVisible = (colKey: string) => visibleColumns[colKey] !== false;

  const visibleColCount =
    (isColVisible('name') ? 1 : 0) +
    (isColVisible('department') ? 1 : 0) +
    (isColVisible('check_in') ? 1 : 0) +
    (isColVisible('check_out') ? 1 : 0) +
    (isColVisible('working_hours') ? 1 : 0) +
    (isColVisible('status') ? 1 : 0) +
    1; // Actions column

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp size={14} className="inline ml-1 stroke-[2.2]" />
    ) : (
      <ChevronDown size={14} className="inline ml-1 stroke-[2.2]" />
    );
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 whitespace-nowrap shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('status.present', 'មានវត្តមាន')}</span>
          </span>
        );
      case 'Late':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 whitespace-nowrap shadow-2xs">
            <Clock size={12} className="stroke-[2.2]" />
            <span>{t('status.late', 'មកយឺត')}</span>
          </span>
        );
      case 'Half Day':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 whitespace-nowrap shadow-2xs">
            <span>{t('status.halfDay', 'ច្បាប់កន្លះថ្ងៃ')}</span>
          </span>
        );
      case 'Remote':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 whitespace-nowrap shadow-2xs">
            <span>{t('status.remote', 'ពីចម្ងាយ')}</span>
          </span>
        );
      case 'Absent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 whitespace-nowrap shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>{t('status.absent', 'អវត្តមាន')}</span>
          </span>
        );
      case 'On Leave':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 whitespace-nowrap shadow-2xs">
            <span>{t('status.onLeave', 'ច្បាប់ឈប់')}</span>
          </span>
        );
    }
  };

  const getExceptionLabel = (exception: string) => {
    switch (exception) {
      case 'Missing Check-out':
        return 'ខកខានស្កេនចេញ';
      case 'Late Arrival':
        return 'មកយឺត';
      case 'Early Departure':
        return 'ចេញមុនម៉ោង';
      case 'Missing Attendance':
        return 'អវត្តមានគ្មានការអនុញ្ញាត';
      case 'Excessive Overtime':
        return 'ថែមម៉ោងលើសកម្រិត';
      default:
        return exception;
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden print:hidden transition-all">
      <div className="overflow-x-auto">
        <table className="w-full data-table border-collapse min-w-[720px] lg:min-w-full">
          {/* ─── Tinted Table Header matching EmployeeTable ─── */}
          <thead className="bg-[#e6f4f8] dark:bg-cyan-950/30 text-[#0f5b78] dark:text-cyan-300 sticky top-0 border-b border-cyan-100 dark:border-cyan-900/40 z-10 text-xs font-semibold select-none">
            <tr>
              {/* 1. Employee Column */}
              {isColVisible('name') && (
                <th
                  className="pl-5 pr-4 py-3.5 text-left cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                  onClick={() => onSort('name')}
                >
                  <div className="flex items-center gap-1">
                    <span>{t('employees.colEmployee', 'បុគ្គលិក')}</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
              )}

              {/* 2. Department & Shift Column */}
              {isColVisible('department') && (
                <th
                  className="px-4 py-3.5 text-left cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                  onClick={() => onSort('department')}
                >
                  <div className="flex items-center gap-1">
                    <span>{t('attendance.deptAndShift', 'ផ្នែក & វេនការងារ')}</span>
                    {renderSortIcon('department')}
                  </div>
                </th>
              )}

              {/* 3. Check-In Column */}
              {isColVisible('check_in') && (
                <th
                  className="px-4 py-3.5 text-left cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                  onClick={() => onSort('checkIn')}
                >
                  <div className="flex items-center gap-1">
                    <span>{t('attendance.shortCheckIn', 'ស្កេនចូល')}</span>
                    {renderSortIcon('checkIn')}
                  </div>
                </th>
              )}

              {/* 4. Check-Out Column */}
              {isColVisible('check_out') && (
                <th
                  className="px-4 py-3.5 text-left cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                  onClick={() => onSort('checkOut')}
                >
                  <div className="flex items-center gap-1">
                    <span>{t('attendance.shortCheckOut', 'ស្កេនចេញ')}</span>
                    {renderSortIcon('checkOut')}
                  </div>
                </th>
              )}

              {/* 5. Working Hours Column */}
              {isColVisible('working_hours') && (
                <th className="px-4 py-3.5 text-left whitespace-nowrap">
                  <span>{t('attendance.workingHours', 'ម៉ោងធ្វើការ')}</span>
                </th>
              )}

              {/* 6. Status Column */}
              {isColVisible('status') && (
                <th
                  className="px-4 py-3.5 text-center cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                  onClick={() => onSort('status')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{t('employees.status', 'ស្ថានភាព')}</span>
                    {renderSortIcon('status')}
                  </div>
                </th>
              )}

              {/* 7. Actions Column */}
              <th className="w-16 px-4 py-3.5 text-right pr-6 whitespace-nowrap">
                <span>{t('common.actions', 'សកម្មភាព')}</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              // Adaptive Loading Skeleton matching exact visible columns
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-border/60">
                  {isColVisible('name') && (
                    <td className="pl-5 pr-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-muted" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-28 rounded bg-muted" />
                          <div className="h-2.5 w-16 rounded bg-muted/60" />
                        </div>
                      </div>
                    </td>
                  )}
                  {isColVisible('department') && (
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-28 rounded bg-muted/60" />
                      <div className="h-3 w-20 rounded bg-muted/40 mt-1" />
                    </td>
                  )}
                  {isColVisible('check_in') && (
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-16 rounded bg-muted/60" />
                    </td>
                  )}
                  {isColVisible('check_out') && (
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-16 rounded bg-muted/60" />
                    </td>
                  )}
                  {isColVisible('working_hours') && (
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-14 rounded bg-muted/60" />
                    </td>
                  )}
                  {isColVisible('status') && (
                    <td className="px-4 py-3.5 text-center">
                      <div className="h-5 w-20 rounded-full bg-muted/70 mx-auto" />
                    </td>
                  )}
                  <td className="px-4 py-3.5 text-right pr-6">
                    <div className="h-7 w-7 rounded bg-muted/60 ml-auto" />
                  </td>
                </tr>
              ))
            ) : records.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={visibleColCount} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2.5 px-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-2xs">
                      <Search className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                      {t('attendance.noRecordsFound', 'រកមិនឃើញកំណត់ត្រាវត្តមានឡើយ')}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {t(
                        'attendance.noRecordsFoundDesc',
                        'រកមិនឃើញទិន្នន័យដែលត្រូវគ្នាឡើយ។ សូមព្យាយាមកែប្រែតម្រង ឬពាក្យស្វែងរក។'
                      )}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((rec) => {
                const avatarColor = getAvatarColorClass(rec.id);
                const initials = getInitials(rec.name);

                return (
                  <tr
                    key={rec.id}
                    onClick={() => onView(rec)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-100 dark:border-slate-800/80 group cursor-pointer"
                  >
                    {/* 1. Employee Identity (Photo/Initials + Name + ID + Position) */}
                    {isColVisible('name') && (
                      <td className="pl-5 pr-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'h-9 w-9 min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border shadow-2xs overflow-hidden',
                              avatarColor
                            )}
                          >
                            {rec.avatar_url && !rec.avatar_url.includes('unsplash') ? (
                              <img
                                src={getAbsoluteImageUrl(rec.avatar_url)}
                                alt={rec.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors leading-tight">
                              {rec.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10.5px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200/60 dark:border-blue-900/60">
                                {rec.id}
                              </span>
                              {rec.position && (
                                <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                  {rec.position}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* 2. Department & Shift */}
                    {isColVisible('department') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60 w-fit">
                            <Building2 size={12} className="text-slate-400 shrink-0" />
                            <span>{rec.department}</span>
                          </span>
                          {(rec.shift || rec.office) && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium pl-0.5">
                              <Clock size={11} className="text-teal-600 dark:text-teal-400 shrink-0" />
                              <span>{rec.shift || rec.office}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 3. Check-In */}
                    {isColVisible('check_in') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {rec.checkIn === '—' ? (
                          <span className="font-mono text-xs text-slate-400 font-normal">—</span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{rec.checkIn}</span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* 4. Check-Out */}
                    {isColVisible('check_out') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {rec.checkOut === '—' ? (
                          <span className="font-mono text-xs text-slate-400 font-normal">—</span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                            <span>{rec.checkOut}</span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* 5. Working Hours */}
                    {isColVisible('working_hours') && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {rec.workingHours === 'កំពុងបំពេញការងារ' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                              <span>កំពុងបំពេញការងារ</span>
                            </span>
                          ) : rec.workingHours === '—' ? (
                            <span className="font-mono text-xs text-slate-400 font-normal">—</span>
                          ) : (
                            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {rec.workingHours}
                            </span>
                          )}
                          {rec.overtime &&
                            rec.overtime !== '—' &&
                            rec.overtime !== '0h 0m' && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 font-mono">
                                {rec.overtime.startsWith('+') ? rec.overtime : `+${rec.overtime}`}
                              </span>
                            )}
                        </div>
                      </td>
                    )}

                    {/* 6. Status */}
                    {isColVisible('status') && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          {getStatusBadge(rec.status)}
                          {rec.hasException ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-rose-600 dark:text-rose-400">
                              <AlertTriangle size={11} className="shrink-0 stroke-[2.2]" />
                              <span>{getExceptionLabel(rec.exception)}</span>
                            </span>
                          ) : (
                            (rec.status === 'Present' || rec.status === 'Late' || rec.status === 'Half Day') ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 font-medium">
                                <ShieldCheck size={11} className="stroke-[2.2] text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>GPS + Wi-Fi</span>
                              </span>
                            ) : null
                          )}
                        </div>
                      </td>
                    )}

                    {/* 11. Actions */}
                    <td
                      className="px-4 py-3.5 text-right pr-6 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => onView(rec)}
                          title={t('common.view', 'មើលព័ត៌មានលម្អិត')}
                          className="h-8 w-8 min-w-[32px] min-h-[32px] rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-teal-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/50 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Eye size={14} className="stroke-[2]" />
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

export default AttendanceTable;
