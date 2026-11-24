import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { LeaveKPISummary } from '../types';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
import { useTranslation } from '@/i18n';

interface LeaveSummaryCardsProps {
  summary: LeaveKPISummary;
  totalRequests?: number;
  activeStatusFilter?: string;
  onFilterStatus?: (status: string) => void;
}

export const LeaveSummaryCards: React.FC<LeaveSummaryCardsProps> = ({
  summary,
  totalRequests,
  activeStatusFilter,
  onFilterStatus,
}) => {
  const { t } = useTranslation();

  const total = totalRequests ?? (summary.pending + summary.approved + summary.rejected);
  const pending = summary.pending;
  const approved = summary.approved;
  const rejected = summary.rejected;

  // Rate of approval
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
      {/* ─── Card 1: Total Requests (Teal Icon Box #0e5a77) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0 }}
        onClick={() => onFilterStatus?.('')}
        role="button"
        tabIndex={0}
        title="ចុចដើម្បីមើលសំណើទាំងអស់"
        className={`bg-white dark:bg-slate-900 border rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-2xs transition-all cursor-pointer select-none hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] ${
          !activeStatusFilter
            ? 'ring-2 ring-[#0e5a77] border-[#0e5a77]/60 bg-teal-50/20 dark:bg-slate-850'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#0e5a77] text-white">
          <CalendarCheck size={24} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate font-sans">
            <AnimatedCounter value={total} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
            {t('leaves.totalRequests', 'សំណើសុំច្បាប់សរុប')}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              {summary.totalAvailable || 140} {t('leaves.daysQuota', 'ថ្ងៃកូតាសរុប')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── Card 2: Approved Requests (Emerald Icon Box #059669) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
        onClick={() => onFilterStatus?.(activeStatusFilter === 'Approved' ? '' : 'Approved')}
        role="button"
        tabIndex={0}
        title="ចុចដើម្បីច្រោះតែសំណើដែលបានអនុម័ត"
        className={`bg-white dark:bg-slate-900 border rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-2xs transition-all cursor-pointer select-none hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] ${
          activeStatusFilter === 'Approved'
            ? 'ring-2 ring-emerald-500 border-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/20'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#059669] text-white">
          <CheckCircle2 size={24} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate font-sans">
            <AnimatedCounter value={approved} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
            {t('status.approved', 'បានអនុម័ត')}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {approvalRate}% {t('leaves.approvalRate', 'អត្រាយល់ព្រម')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── Card 3: Pending Review (Amber Icon Box #d97706) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.1 }}
        onClick={() => onFilterStatus?.(activeStatusFilter === 'Pending' ? '' : 'Pending')}
        role="button"
        tabIndex={0}
        title="ចុចដើម្បីច្រោះតែសំណើរង់ចាំពិនិត្យ"
        className={`bg-white dark:bg-slate-900 border rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-2xs transition-all cursor-pointer select-none hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] ${
          activeStatusFilter === 'Pending'
            ? 'ring-2 ring-amber-500 border-amber-500/60 bg-amber-50/30 dark:bg-amber-950/20'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#d97706] text-white">
          <Clock size={24} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate font-sans">
            <AnimatedCounter value={pending} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
            {t('status.pending', 'រង់ចាំពិនិត្យ')}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              {pending > 0 ? t('leaves.actionRequired', 'ត្រូវការពិនិត្យ') : t('leaves.allCleared', 'បានរួចរាល់')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── Card 4: Rejected Requests (Rose Icon Box #e11d48) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.15 }}
        onClick={() => onFilterStatus?.(activeStatusFilter === 'Rejected' ? '' : 'Rejected')}
        role="button"
        tabIndex={0}
        title="ចុចដើម្បីច្រោះតែសំណើដែលបានបដិសេធ"
        className={`bg-white dark:bg-slate-900 border rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-2xs transition-all cursor-pointer select-none hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] ${
          activeStatusFilter === 'Rejected'
            ? 'ring-2 ring-rose-500 border-rose-500/60 bg-rose-50/30 dark:bg-rose-950/20'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#e11d48] text-white">
          <XCircle size={24} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate font-sans">
            <AnimatedCounter value={rejected} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
            {t('status.rejected', 'បានបដិសេធ')}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              {rejected} {t('leaves.rejectedCount', 'សំណើ')}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LeaveSummaryCards;
