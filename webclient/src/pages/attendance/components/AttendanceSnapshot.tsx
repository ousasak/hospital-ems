import React from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, Clock, UserX } from 'lucide-react';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
import { useTranslation } from '@/i18n';
import { AttendanceStatus, AttendanceSnapshotItem } from '../types';

interface AttendanceSnapshotProps {
  items: AttendanceSnapshotItem[];
  activeStatusFilter?: string;
  onSelectStatus?: (status: AttendanceStatus | '') => void;
}

export const AttendanceSnapshot: React.FC<AttendanceSnapshotProps> = ({
  items,
  activeStatusFilter,
  onSelectStatus,
}) => {
  const { t } = useTranslation();

  // Extract individual counts from snapshot items
  const countMap: Record<AttendanceStatus, number> = {
    Present: 0,
    Absent: 0,
    Late: 0,
    'Half Day': 0,
    Remote: 0,
    'On Leave': 0,
  };

  items.forEach((item) => {
    if (countMap[item.label] !== undefined) {
      countMap[item.label] = item.value;
    }
  });

  const total = items.reduce((acc, curr) => acc + curr.value, 0);
  const present = countMap.Present;
  const remote = countMap.Remote;
  const late = countMap.Late;
  const halfDay = countMap['Half Day'];
  const absent = countMap.Absent;
  const onLeave = countMap['On Leave'];

  // Attendance rate (Present + Remote) / Total
  const attendanceRate = total > 0 ? Math.round(((present + remote) / total) * 100) : 0;
  const lateTotal = late + halfDay;
  const absentTotal = absent + onLeave;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
      {/* ─── Card 1: Total Scheduled & Working (Teal Icon Box #0e5a77) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0 }}
        onClick={() => onSelectStatus?.('')}
        role="button"
        tabIndex={0}
        title="ចុចដើម្បីមើលទាំងអស់"
        className={`bg-white dark:bg-slate-900 border rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-2xs transition-all cursor-pointer select-none hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] ${
          !activeStatusFilter
            ? 'ring-2 ring-[#0e5a77] border-[#0e5a77]/60 bg-teal-50/20 dark:bg-slate-850'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#0e5a77] text-white">
          <Users size={24} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate font-sans">
            <AnimatedCounter value={total} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
            {t('attendance.totalScheduled', 'បុគ្គលិកតាមកាលវិភាគ')}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectStatus?.(activeStatusFilter === 'Present' ? '' : 'Present');
              }}
              className={`font-semibold flex items-center gap-1 transition-all cursor-pointer rounded px-1 py-0.5 ${
                activeStatusFilter === 'Present'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 font-bold'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {present} {t('status.present', 'មានវត្តមាន')}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectStatus?.(activeStatusFilter === 'Remote' ? '' : 'Remote');
              }}
              className={`font-medium transition-all cursor-pointer rounded px-1 py-0.5 ${
                activeStatusFilter === 'Remote'
                  ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30 font-bold'
                  : 'text-teal-600 dark:text-teal-400 hover:bg-teal-500/10'
              }`}
            >
              {remote} {t('status.remote', 'ពីចម្ងាយ')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Card 2: Attendance & Punctuality Rate (Emerald Icon Box #059669) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
        onClick={() => onSelectStatus?.(activeStatusFilter === 'Present' ? '' : 'Present')}
        role="button"
        tabIndex={0}
        title="ចុចដើម្បីច្រោះតែអ្នកមានវត្តមាន"
        className={`bg-white dark:bg-slate-900 border rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-2xs transition-all cursor-pointer select-none hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] ${
          activeStatusFilter === 'Present'
            ? 'ring-2 ring-emerald-500 border-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/20'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#059669] text-white">
          <CheckCircle2 size={24} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate font-sans">
            <AnimatedCounter value={attendanceRate} suffix="%" />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
            {t('attendance.rateTitle', 'អត្រាវត្តមានសរុប')}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {present} {t('attendance.onSchedule', 'មកទៀងទាត់')}
            </span>
            <span>•</span>
            <span className="text-slate-400 font-medium">
              0 {t('attendance.lateExcessive', 'យឺតខ្លាំង')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── Card 3: Late Arrivals & Half Day (Amber Icon Box #d97706) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.1 }}
        onClick={() => onSelectStatus?.(activeStatusFilter === 'Late' ? '' : 'Late')}
        role="button"
        tabIndex={0}
        title="ចុចដើម្បីច្រោះតែអ្នកមកយឺត"
        className={`bg-white dark:bg-slate-900 border rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-2xs transition-all cursor-pointer select-none hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] ${
          activeStatusFilter === 'Late'
            ? 'ring-2 ring-amber-500 border-amber-500/60 bg-amber-50/30 dark:bg-amber-950/20'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#d97706] text-white">
          <Clock size={24} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate font-sans">
            <AnimatedCounter value={lateTotal} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
            {t('attendance.lateAndHalfDay', 'យឺតយ៉ាវ និងច្បាប់កន្លះថ្ងៃ')}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectStatus?.(activeStatusFilter === 'Late' ? '' : 'Late');
              }}
              className={`font-semibold flex items-center gap-1 transition-all cursor-pointer rounded px-1 py-0.5 ${
                activeStatusFilter === 'Late'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 font-bold'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {late} {t('status.late', 'មកយឺត')}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectStatus?.(activeStatusFilter === 'Half Day' ? '' : 'Half Day');
              }}
              className={`font-medium transition-all cursor-pointer rounded px-1 py-0.5 ${
                activeStatusFilter === 'Half Day'
                  ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30 font-bold'
                  : 'text-orange-600 dark:text-orange-400 hover:bg-orange-500/10'
              }`}
            >
              {halfDay} {t('status.halfDay', 'កន្លះថ្ងៃ')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Card 4: Absences & Leaves (Rose Icon Box #e11d48) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.15 }}
        onClick={() => onSelectStatus?.(activeStatusFilter === 'Absent' ? '' : 'Absent')}
        role="button"
        tabIndex={0}
        title="ចុចដើម្បីច្រោះតែអ្នកអវត្តមាន"
        className={`bg-white dark:bg-slate-900 border rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-2xs transition-all cursor-pointer select-none hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] ${
          activeStatusFilter === 'Absent'
            ? 'ring-2 ring-rose-500 border-rose-500/60 bg-rose-50/30 dark:bg-rose-950/20'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#e11d48] text-white">
          <UserX size={24} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate font-sans">
            <AnimatedCounter value={absentTotal} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
            {t('attendance.absentAndLeave', 'អវត្តមាន និងសុំច្បាប់')}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectStatus?.(activeStatusFilter === 'Absent' ? '' : 'Absent');
              }}
              className={`font-semibold flex items-center gap-1 transition-all cursor-pointer rounded px-1 py-0.5 ${
                activeStatusFilter === 'Absent'
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30 font-bold'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {absent} {t('status.absent', 'អវត្តមាន')}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectStatus?.(activeStatusFilter === 'On Leave' ? '' : 'On Leave');
              }}
              className={`font-medium transition-all cursor-pointer rounded px-1 py-0.5 ${
                activeStatusFilter === 'On Leave'
                  ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30 font-bold'
                  : 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              {onLeave} {t('status.onLeave', 'ច្បាប់ឈប់')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AttendanceSnapshot;
