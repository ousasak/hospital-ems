import React from 'react';
import {
  AlertTriangle,
  Clock,
  LogOut,
  Clock4,
  UserX,
  AlarmClock,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import {
  AttendanceRecordItem,
  AttendanceExceptionGroup,
  AttendanceExceptionType,
  ExceptionSeverity,
} from '../types';

interface AttendanceExceptionsProps {
  records: AttendanceRecordItem[];
  onReviewException: (exceptionType: AttendanceExceptionType) => void;
}

export const AttendanceExceptions: React.FC<AttendanceExceptionsProps> = ({
  records,
  onReviewException,
}) => {
  const { t } = useTranslation();

  const getSeverityBadge = (severity: ExceptionSeverity) => {
    switch (severity) {
      case 'High':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25';
      case 'Low':
      default:
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25';
    }
  };

  const getExceptionIcon = (titleKey: string) => {
    switch (titleKey) {
      case 'Late Arrivals':
        return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'Missing Check-outs':
        return <LogOut className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'Early Departures':
        return <Clock4 className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'Missing Attendance':
        return <UserX className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      case 'Excessive Overtime':
      default:
        return <AlarmClock className="h-4 w-4 text-teal-600 dark:text-teal-400" />;
    }
  };

  const exceptionGroups: AttendanceExceptionGroup[] = [
    {
      title: 'Late Arrivals',
      icon: 'icon-clock-alert',
      severity: 'Medium',
      list: records.filter((r) => r.exception === 'Late Arrival'),
    },
    {
      title: 'Missing Check-outs',
      icon: 'icon-log-out',
      severity: 'Medium',
      list: records.filter((r) => r.exception === 'Missing Check-out'),
    },
    {
      title: 'Early Departures',
      icon: 'icon-clock-4',
      severity: 'Low',
      list: records.filter((r) => r.exception === 'Early Departure'),
    },
    {
      title: 'Missing Attendance',
      icon: 'icon-user-x',
      severity: 'High',
      list: records.filter((r) => r.exception === 'Missing Attendance'),
    },
    {
      title: 'Excessive Overtime',
      icon: 'icon-alarm-clock',
      severity: 'Medium',
      list: records.filter((r) => r.exception === 'Excessive Overtime'),
    },
  ];

  const mapTitleToExceptionType = (title: string): AttendanceExceptionType => {
    switch (title) {
      case 'Late Arrivals':
        return 'Late Arrival';
      case 'Missing Check-outs':
        return 'Missing Check-out';
      case 'Early Departures':
        return 'Early Departure';
      case 'Missing Attendance':
        return 'Missing Attendance';
      case 'Excessive Overtime':
        return 'Excessive Overtime';
      default:
        return 'None';
    }
  };

  const getTranslatedTitle = (title: string) => {
    switch (title) {
      case 'Late Arrivals':
        return t('attendance.lateArrivals', 'មកយឺតយ៉ាវ');
      case 'Missing Check-outs':
        return t('attendance.missingCheckouts', 'ខកខានស្កេនចេញ');
      case 'Early Departures':
        return t('attendance.earlyDepartures', 'ចេញមុនម៉ោង');
      case 'Missing Attendance':
        return t('attendance.missingAttendance', 'អវត្តមានគ្មានដំណឹង');
      case 'Excessive Overtime':
        return t('attendance.excessiveOvertime', 'ម៉ោងបន្ថែមលើសកម្រិត');
      default:
        return title;
    }
  };

  const totalExceptions = exceptionGroups.reduce((acc, g) => acc + g.list.length, 0);

  return (
    <section aria-label="Attendance exceptions" className="mt-5 print:hidden">
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-card p-4 sm:p-5 shadow-2xs">
        {/* ─── Section Header ─── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <AlertTriangle className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('attendance.exceptionsTitle', 'ភាពមិនប្រក្រតីនៃវត្តមាន (Attendance Exceptions)')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t(
                  'attendance.exceptionsSubtitle',
                  'បញ្ហាដែលត្រូវការការត្រួតពិនិត្យពីប្រធានផ្នែក ឬធនធានមនុស្ស'
                )}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
            {totalExceptions} {t('common.cases', 'ករណីត្រូវពិនិត្យ')}
          </span>
        </div>

        {/* ─── 5 Exception Cards Grid ─── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {exceptionGroups.map((group) => {
            const exceptionType = mapTitleToExceptionType(group.title);
            const isHigh = group.severity === 'High';

            return (
              <article
                key={group.title}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xs ${
                  isHigh
                    ? 'border-rose-200/90 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-900/40 hover:border-rose-400'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-teal-400/60 dark:hover:border-teal-600'
                }`}
              >
                <div>
                  {/* Top: Icon + Severity tag */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      {getExceptionIcon(group.title)}
                    </span>
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(
                        group.severity
                      )}`}
                    >
                      {group.severity}
                    </span>
                  </div>

                  {/* Title & Count */}
                  <h3 className="mt-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {getTranslatedTitle(group.title)}
                  </h3>
                  <p className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {group.list.length}
                  </p>

                  {/* Employee snippet preview */}
                  <ul className="mt-2 list-none space-y-1 p-0 text-[11px]">
                    {group.list.length === 0 ? (
                      <li className="text-slate-400 dark:text-slate-500 italic">
                        {t('attendance.noActiveExceptions', 'គ្មានបញ្ហាប្រក្រតី')}
                      </li>
                    ) : (
                      group.list.slice(0, 3).map((item) => (
                        <li
                          key={item.id}
                          className="truncate text-slate-500 dark:text-slate-400"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </span>{' '}
                          · {item.office}
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                {/* Bottom link: Review hub */}
                <div className="mt-3 border-t border-slate-200/60 dark:border-slate-800/80 pt-2 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => onReviewException(exceptionType)}
                    className="flex items-center gap-1 font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    <span>{t('attendance.reviewHub', 'ពិនិត្យមើល')}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <span className="font-mono text-[11px] text-slate-400">
                    {group.list.length} {t('common.pending', 'រង់ចាំ')}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AttendanceExceptions;
