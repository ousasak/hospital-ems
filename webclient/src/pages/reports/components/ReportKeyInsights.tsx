import React from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  ReportSummaryResponse,
  AttendanceAnalyticsResponse,
  LeaveAnalyticsResponse,
  ShiftAnalyticsResponse,
} from '@/services/reportService';
import {
  AlertCircle,
  CalendarDays,
  Clock,
  ArrowRight,
  TrendingDown,
  Building2,
} from 'lucide-react';

export interface ReportKeyInsightsProps {
  summaryData?: ReportSummaryResponse;
  attendanceData?: AttendanceAnalyticsResponse;
  leaveData?: LeaveAnalyticsResponse;
  shiftData?: ShiftAnalyticsResponse;
  onNavigateTab: (tabKey: string) => void;
  isLoading?: boolean;
}

export const ReportKeyInsights: React.FC<ReportKeyInsightsProps> = ({
  summaryData,
  attendanceData,
  leaveData,
  shiftData,
  onNavigateTab,
  isLoading = false,
}) => {
  const { t } = useLocaleStore();

  if (isLoading) return null;

  const metrics = summaryData?.metrics;
  const pendingLeaves =
    metrics?.pending_leaves_count ??
    (leaveData?.by_status
      ? (leaveData.by_status.pending_supervisor ?? 0) +
        (leaveData.by_status.pending_hr ?? 0)
      : 0);

  const unassignedStaff = shiftData?.unassigned_employees_count ?? 0;
  const rateChange = metrics?.attendance_rate_change;

  // Collect actionable alerts (only high-priority action items)
  const alerts: Array<{
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    actionLabel: string;
    targetTab: string;
    severity: 'warning' | 'alert' | 'info';
  }> = [];

  // Alert 1: Pending leave requests needing attention
  if (pendingLeaves > 0) {
    alerts.push({
      id: 'pending-leaves',
      icon: CalendarDays,
      title: `${pendingLeaves} ${t('reports.kpi.pendingLeaves', 'សំណើសុំច្បាប់រង់ចាំអនុម័ត')}`,
      description: t('reports.insights.pendingLeavesAction', { count: pendingLeaves }),
      actionLabel: t('reports.insights.actionLeaves', 'ពិនិត្យសំណើ'),
      targetTab: 'leaves',
      severity: 'warning',
    });
  }

  // Alert 2: Unassigned roster staff
  if (unassignedStaff > 0) {
    alerts.push({
      id: 'unassigned-staff',
      icon: Clock,
      title: `${unassignedStaff} ${t('reports.shifts.unassignedStaffTitle', 'មិនទាន់ចាត់តាំងវេន')}`,
      description: t('reports.insights.shiftsUnassigned', { count: unassignedStaff }),
      actionLabel: t('reports.insights.actionShifts', 'ពិនិត្យវេនការងារ'),
      targetTab: 'shifts',
      severity: 'alert',
    });
  }

  // Alert 3: Significant drop in attendance
  if (rateChange !== null && rateChange !== undefined && rateChange < -5) {
    alerts.push({
      id: 'attendance-drop',
      icon: TrendingDown,
      title: `${t('reports.kpi.attendanceRate', 'អត្រាវត្តមាន')} ${metrics?.period_attendance_rate ?? 0}%`,
      description: t('reports.insights.attendanceDeclined', {
        rate: metrics?.period_attendance_rate ?? 0,
        change: `${rateChange}`,
      }),
      actionLabel: t('reports.insights.actionAttendance', 'ពិនិត្យវត្តមាន'),
      targetTab: 'attendance',
      severity: 'alert',
    });
  }

  // If there are no high-priority alerts, do not clutter the page with duplicate cards
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-xl border border-amber-200/80 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20 p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <alert.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {alert.title}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold px-1.5 py-0 rounded-md border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/30"
                >
                  {t('reports.insights.badgeAction', 'ត្រូវដោះស្រាយ')}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate sm:whitespace-normal mt-0.5">
                {alert.description}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab(alert.targetTab)}
            className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 self-start sm:self-auto border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 shrink-0 cursor-pointer shadow-2xs"
          >
            <span>{alert.actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default ReportKeyInsights;
