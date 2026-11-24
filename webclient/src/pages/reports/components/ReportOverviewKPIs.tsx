import React from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';
import type { ReportSummaryMetrics } from '@/services/reportService';
import {
  Users,
  CalendarCheck,
  UserX,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';

export interface ReportOverviewKPIsProps {
  metrics?: ReportSummaryMetrics;
  payrollSummary?: {
    latest_period: string;
    total_gross: number;
    total_deductions: number;
    total_net: number;
    currency: string;
    status: string;
  } | null;
  isLoading?: boolean;
  onNavigateTab?: (tabKey: string) => void;
}

interface EssentialKPICardProps {
  title: string;
  value: React.ReactNode;
  subtitle: React.ReactNode;
  icon: React.ElementType;
  iconBoxBg: string;
  trendBadge?: React.ReactNode;
  valueColor?: string;
  actionText?: string;
  onClick?: () => void;
}

const EssentialKPICard: React.FC<EssentialKPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBoxBg,
  trendBadge,
  valueColor = 'text-foreground',
  actionText,
  onClick,
}) => (
  <Card
    onClick={onClick}
    className={cn(
      'rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all duration-200 flex flex-col justify-between group',
      onClick && 'cursor-pointer hover:border-primary/40 hover:shadow-sm'
    )}
  >
    <div>
      {/* Header: Title & Icon Box */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground tracking-tight">
          {title}
        </span>
        <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs', iconBoxBg)}>
          <Icon className="h-4 w-4 stroke-[2.2]" />
        </div>
      </div>

      {/* Main Metric Value & Trend */}
      <div className="mt-3 flex items-baseline gap-2.5">
        <span className={cn('text-3xl font-extrabold tracking-tight font-mono', valueColor)}>
          {value}
        </span>
        {trendBadge && <div className="shrink-0">{trendBadge}</div>}
      </div>
    </div>

    {/* Contextual Subtitle & Action */}
    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground gap-2">
      <div className="truncate font-medium">{subtitle}</div>
      {actionText && (
        <span className="text-xs font-semibold text-primary shrink-0 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          {actionText}
          <ArrowRight className="h-3 w-3" />
        </span>
      )}
    </div>
  </Card>
);

export const ReportOverviewKPIs: React.FC<ReportOverviewKPIsProps> = ({
  metrics,
  isLoading = false,
  onNavigateTab,
}) => {
  const { t } = useLocaleStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border/60 bg-card space-y-3 min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  const attendanceRate =
    metrics?.period_attendance_rate ?? metrics?.today_attendance_rate ?? 0;
  const rateChange = metrics?.attendance_rate_change;

  const rateChangeBadge =
    rateChange !== null && rateChange !== undefined ? (
      <Badge
        variant="outline"
        className={cn(
          'text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border shadow-2xs',
          rateChange >= 0
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
        )}
      >
        {rateChange >= 0 ? (
          <TrendingUp className="h-3 w-3 stroke-[2.5]" />
        ) : (
          <TrendingDown className="h-3 w-3 stroke-[2.5]" />
        )}
        <span>{rateChange > 0 ? `+${rateChange}%` : `${rateChange}%`}</span>
      </Badge>
    ) : null;

  const pendingLeaves = metrics?.pending_leaves_count ?? 0;
  const absentCount = metrics?.today_absent_count ?? 0;
  const onLeaveCount = metrics?.today_on_leave_count ?? 0;
  const totalAbsentLeave = absentCount + onLeaveCount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Workforce */}
      <EssentialKPICard
        title={t('reports.kpi.totalEmployees', 'កម្លាំងពលកម្មសរុប')}
        value={metrics?.total_employees ?? 0}
        subtitle={
          <span>
            <strong className="text-foreground">{metrics?.active_employees ?? 0}</strong> {t('reports.kpi.activeEmployees', 'សកម្ម')} •{' '}
            <strong className="text-foreground">{metrics?.department_count ?? 0}</strong> {t('reports.operatingUnits', 'ផ្នែក')}
          </span>
        }
        icon={Users}
        iconBoxBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        actionText={onNavigateTab ? t('reports.insights.viewDetails', 'មើលលម្អិត') : undefined}
        onClick={() => onNavigateTab?.('workforce')}
      />

      {/* 2. Attendance Rate */}
      <EssentialKPICard
        title={t('reports.kpi.attendanceRate', 'អត្រាវត្តមាន')}
        value={`${attendanceRate}%`}
        trendBadge={rateChangeBadge}
        subtitle={
          <span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics?.today_present_count ?? metrics?.period_present_count ?? 0}
            </strong> {t('reports.charts.present', 'មានវត្តមាន')} •{' '}
            <strong className="text-amber-600 dark:text-amber-400 font-mono">
              {metrics?.today_late_count ?? 0}
            </strong> {t('reports.charts.late', 'មកយឺត')}
          </span>
        }
        icon={CalendarCheck}
        iconBoxBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        valueColor="text-emerald-600 dark:text-emerald-400"
        actionText={onNavigateTab ? t('reports.insights.viewDetails', 'មើលលម្អិត') : undefined}
        onClick={() => onNavigateTab?.('attendance')}
      />

      {/* 3. Absence & On Leave Today */}
      <EssentialKPICard
        title={t('reports.overview.absenceAndLeaves', 'អវត្តមាន & ច្បាប់ថ្ងៃនេះ')}
        value={totalAbsentLeave}
        subtitle={
          <span>
            <strong className="text-rose-600 dark:text-rose-400 font-mono">{absentCount}</strong> {t('reports.charts.absent', 'អវត្តមាន')} •{' '}
            <strong className="text-purple-600 dark:text-purple-400 font-mono">{onLeaveCount}</strong> {t('reports.charts.onLeave', 'ច្បាប់')}
          </span>
        }
        icon={UserX}
        iconBoxBg={totalAbsentLeave > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-500/10 text-slate-600'}
        valueColor={totalAbsentLeave > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}
        actionText={onNavigateTab ? t('reports.insights.viewDetails', 'មើលលម្អិត') : undefined}
        onClick={() => onNavigateTab?.('attendance')}
      />

      {/* 4. Action Required: Pending Leaves */}
      <EssentialKPICard
        title={t('reports.kpi.pendingLeaves', 'សំណើរង់ចាំអនុម័ត')}
        value={pendingLeaves}
        subtitle={
          pendingLeaves > 0 ? (
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              {t('reports.kpi.pendingLeavesDesc', 'រង់ចាំការត្រួតពិនិត្យពីប្រធានផ្នែក ឬ HR')}
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {t('reports.insights.pendingLeavesClear', 'គ្មានសំណើរង់ចាំឡើយ')}
            </span>
          )
        }
        icon={Clock}
        iconBoxBg={pendingLeaves > 0 ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-emerald-500/10 text-emerald-600'}
        valueColor={pendingLeaves > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-foreground'}
        actionText={pendingLeaves > 0 && onNavigateTab ? t('reports.insights.actionLeaves', 'ពិនិត្យសំណើ') : undefined}
        onClick={() => onNavigateTab?.('leaves')}
      />
    </div>
  );
};

export default ReportOverviewKPIs;
