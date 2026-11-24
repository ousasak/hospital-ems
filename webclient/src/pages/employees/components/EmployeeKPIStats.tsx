import React from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, Activity, Wallet } from 'lucide-react';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
import { useTranslation } from '@/i18n';

interface EmployeeKPIStatsProps {
  total: number;
  active: number;
  inactive: number;
  newJoiners?: number;
  onProbation?: number;
  deptCount?: number;
  posCount?: number;
  branchCount?: number;
  attendanceRate?: number;
  monthlySalarySum?: number;
  averageSalary?: number;
  currentStatusFilter?: string;
  onFilterStatus?: (status: string) => void;
}

export const EmployeeKPIStats: React.FC<EmployeeKPIStatsProps> = ({
  total,
  active,
  inactive,
  deptCount = 10,
  posCount = 10,
  branchCount = 3,
  attendanceRate = 100,
  monthlySalarySum,
  averageSalary,
  currentStatusFilter,
  onFilterStatus,
}) => {
  const { t } = useTranslation();

  const calculatedSalary = monthlySalarySum ?? 9210;
  const calculatedAvg = averageSalary ?? (active > 0 ? Math.round(calculatedSalary / active) : 921);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
      {/* ─── Card 1: Total Workforce (Teal Icon Box) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-2xs transition-all hover:shadow-xs select-none"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#0e5a77] text-white">
          <Users size={24} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate font-sans">
            <AnimatedCounter value={total} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
            {t('employees.totalMembers')}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <button
              type="button"
              onClick={() => onFilterStatus?.('active')}
              className={`font-semibold flex items-center gap-1 transition-all cursor-pointer rounded px-1 py-0.5 ${
                currentStatusFilter === 'active'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 font-bold'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {active} {t('common.active')}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onFilterStatus?.('resigned')}
              className={`font-medium transition-all cursor-pointer rounded px-1 py-0.5 ${
                currentStatusFilter === 'resigned' || currentStatusFilter === 'inactive'
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {inactive} {t('status.resigned')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Card 2: Organization & Roles (Emerald Icon Box) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-2xs transition-all hover:shadow-xs select-none"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#059669] text-white">
          <Building2 size={24} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate font-sans">
            <AnimatedCounter value={deptCount} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
            {t('employees.departmentsRoles')}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {posCount} {t('employees.jobRoles')}
            </span>
            <span>•</span>
            <span className="text-slate-400 font-medium">
              {branchCount} {t('employees.branches')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── Card 3: Attendance Rate (Cyan Icon Box) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.1 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-2xs transition-all hover:shadow-xs select-none"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#06b6d4] text-white">
          <Activity size={24} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate font-sans">
            <AnimatedCounter value={attendanceRate} suffix="%" />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
            {t('employees.attendanceRate')}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              0 {t('employees.leaveUnits')}
            </span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              0 {t('employees.late')}
            </span>
            <span>•</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              0 {t('employees.absent')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── Card 4: Monthly Payroll (Slate Icon Box) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.15 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-2xs transition-all hover:shadow-xs select-none"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#64748b] text-white">
          <Wallet size={24} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight truncate font-sans">
            <AnimatedCounter
              value={calculatedSalary}
              prefix="$"
              decimals={2}
            />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
            {t('employees.monthlyPayrollExpense')}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {t('employees.average')}: ${calculatedAvg.toLocaleString()}
            </span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              20 {t('employees.overtime')}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmployeeKPIStats;
