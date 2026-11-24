import React from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import { ReportOverviewKPIs } from './ReportOverviewKPIs';
import { ReportKeyInsights } from './ReportKeyInsights';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  ReportSummaryResponse,
  WorkforceAnalyticsResponse,
  AttendanceAnalyticsResponse,
  LeaveAnalyticsResponse,
  ShiftAnalyticsResponse,
} from '@/services/reportService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  CalendarCheck,
  Users2,
  ArrowRight,
} from 'lucide-react';

export interface ReportOverviewTabProps {
  summaryData?: ReportSummaryResponse;
  isSummaryLoading?: boolean;
  workforceData?: WorkforceAnalyticsResponse;
  isWorkforceLoading?: boolean;
  attendanceData?: AttendanceAnalyticsResponse;
  isAttendanceLoading?: boolean;
  leaveData?: LeaveAnalyticsResponse;
  isLeaveLoading?: boolean;
  shiftData?: ShiftAnalyticsResponse;
  isShiftLoading?: boolean;
  onNavigateTab: (tabKey: string) => void;
  canViewPayroll?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 p-2.5 text-xs text-popover-foreground shadow-md backdrop-blur-xs space-y-1">
        {label && <p className="font-semibold text-foreground">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-mono font-bold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ReportOverviewTab: React.FC<ReportOverviewTabProps> = ({
  summaryData,
  isSummaryLoading = false,
  workforceData,
  isWorkforceLoading = false,
  attendanceData,
  isAttendanceLoading = false,
  leaveData,
  isLeaveLoading = false,
  shiftData,
  isShiftLoading = false,
  onNavigateTab,
}) => {
  const { t } = useLocaleStore();

  const dailyAttendance = attendanceData?.daily_trends?.slice(-7) || [];
  const topDepts = [...(workforceData?.by_department || [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. Core 4 Executive KPIs (No Redundancy) */}
      <ReportOverviewKPIs
        metrics={summaryData?.metrics}
        payrollSummary={summaryData?.payroll_summary}
        isLoading={isSummaryLoading}
        onNavigateTab={onNavigateTab}
      />

      {/* 2. Actionable Alert Banner (Only visible when actions are pending) */}
      <ReportKeyInsights
        summaryData={summaryData}
        attendanceData={attendanceData}
        leaveData={leaveData}
        shiftData={shiftData}
        onNavigateTab={onNavigateTab}
        isLoading={isSummaryLoading || isAttendanceLoading}
      />

      {/* 3. Essential Visual Analytics (Attendance Trend & Workforce Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: 7-Day Attendance Trends */}
        <Card className="rounded-2xl border border-border/70 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <span>{t('reports.overview.attendanceHighlights', 'ចំណុចសំខាន់នៃវត្តមាន')}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('reports.charts.dailyAttendanceTrends', 'និន្នាការវត្តមានប្រចាំថ្ងៃ (៧ ថ្ងៃចុងក្រោយ)')}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab('attendance')}
                className="h-8 px-2.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 gap-1.5 cursor-pointer"
              >
                <span>{t('reports.insights.viewDetails', 'មើលលម្អិត')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            {isAttendanceLoading ? (
              <div className="h-56 flex items-center justify-center">
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : dailyAttendance.length > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="present"
                      stackId="a"
                      fill="#10b981"
                      name={t('reports.charts.present', 'មានវត្តមាន')}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="late"
                      stackId="a"
                      fill="#f59e0b"
                      name={t('reports.charts.late', 'មកយឺត')}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="on_leave"
                      stackId="a"
                      fill="#8b5cf6"
                      name={t('reports.charts.onLeave', 'ច្បាប់ឈប់')}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="absent"
                      stackId="a"
                      fill="#f43f5e"
                      name={t('reports.charts.absent', 'អវត្តមាន')}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
                {t('reports.empty.noAttendanceTrends', 'មិនមានទិន្នន័យនិន្នាការវត្តមានទេ')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Workforce Distribution by Top Departments */}
        <Card className="rounded-2xl border border-border/70 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Users2 className="h-4 w-4" />
                  </div>
                  <span>{t('reports.overview.workforceHighlights', 'ចំណុចសំខាន់នៃកម្លាំងពលកម្ម')}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('reports.charts.deptDistribution', 'ការបែងចែកបុគ្គលិកតាមដេប៉ាតឺម៉ង់ធំៗ')}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab('workforce')}
                className="h-8 px-2.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 gap-1.5 cursor-pointer"
              >
                <span>{t('reports.insights.viewDetails', 'មើលលម្អិត')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            {isWorkforceLoading ? (
              <div className="h-56 flex items-center justify-center">
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : topDepts.length > 0 ? (
              <div className="h-56 w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topDepts}
                    layout="vertical"
                    margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" horizontal={false} />
                    <XAxis type="number" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={130}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      fill="#2563eb"
                      radius={[0, 6, 6, 0]}
                      name={t('reports.charts.headcount', 'ចំនួនបុគ្គលិក')}
                      label={{ position: 'right', fill: '#2563eb', fontSize: 11, fontWeight: 700 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
                {t('reports.empty.noDeptData', 'មិនមានទិន្នន័យដេប៉ាតឺម៉ង់ទេ')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportOverviewTab;
