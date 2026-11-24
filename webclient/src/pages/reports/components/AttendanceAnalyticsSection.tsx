import React from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/common/EmptyState';
import type { AttendanceAnalyticsResponse } from '@/services/reportService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  CalendarCheck,
  Building2,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface AttendanceAnalyticsSectionProps {
  data?: AttendanceAnalyticsResponse;
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 p-2.5 text-xs text-popover-foreground shadow-lg backdrop-blur-xs space-y-1">
        {label && <p className="font-semibold text-foreground">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-mono font-medium text-foreground">
              {entry.value}
              {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AttendanceAnalyticsSection: React.FC<AttendanceAnalyticsSectionProps> = ({
  data,
  isLoading = false,
}) => {
  const { t } = useLocaleStore();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-6 rounded-2xl border border-border/60 bg-card space-y-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-72 w-full" />
          </div>
          <div className="lg:col-span-4 p-6 rounded-2xl border border-border/60 bg-card space-y-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-72 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const dailyTrends = data?.daily_trends || [];
  // Sort department rates descending by attendance rate for clear ranking
  const deptRates = [...(data?.department_rates || [])].sort(
    (a, b) => b.rate - a.rate
  );
  const lateBuckets = data?.late_arrival_buckets;

  const lateBucketsData = [
    { name: '1-15m', count: lateBuckets?.['1_to_15_mins'] ?? 0, fill: '#f59e0b' },
    { name: '16-30m', count: lateBuckets?.['16_to_30_mins'] ?? 0, fill: '#f97316' },
    { name: '31-60m', count: lateBuckets?.['31_to_60_mins'] ?? 0, fill: '#ef4444' },
    { name: '>60m', count: lateBuckets?.['over_60_mins'] ?? 0, fill: '#b91c1c' },
  ];

  return (
    <div className="space-y-6">
      {/* Section Title & Highlights */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-emerald-500" />
            <span>{t('reports.sections.attendance')}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('reports.sections.attendanceSubtitle')}
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('reports.charts.rate')}: <strong>{data?.attendance_rate ?? 0}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 font-medium">
            <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t('reports.kpi.workingHours')}: <strong>{Math.round(data?.total_working_hours ?? 0)}h</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 text-purple-800 dark:text-purple-300 font-medium">
            <Flame className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>{t('reports.kpi.overtimeHours')}: <strong>+{Math.round(data?.total_overtime_hours ?? 0)}h</strong></span>
          </div>
        </div>
      </div>

      {/* Row 1: Daily Attendance Trends Bar Chart */}
      <Card className="rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
        <CardHeader className="pb-2 border-b border-border/40">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CalendarCheck className="h-3.5 w-3.5" />
            </div>
            <span>{t('reports.charts.dailyAttendanceTrends')}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t('reports.charts.dailyAttendanceDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {dailyTrends.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
                  <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="present"
                    stackId="a"
                    fill="#10b981"
                    name={t('reports.charts.present')}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="late"
                    stackId="a"
                    fill="#f59e0b"
                    name={t('reports.charts.late')}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="on_leave"
                    stackId="a"
                    fill="#8b5cf6"
                    name={t('reports.charts.onLeave')}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="absent"
                    stackId="a"
                    fill="#f43f5e"
                    name={t('reports.charts.absent')}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title={t('reports.empty.noAttendanceTrends')} className="h-80" />
          )}
        </CardContent>
      </Card>

      {/* Row 2: Department Attendance Rate (Horizontal Bar) + Late Arrival Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance by Department - Horizontal Bar Chart */}
        <Card className="lg:col-span-8 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <span>{t('reports.charts.attendanceByDept')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t('reports.charts.attendanceByDeptDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {deptRates.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deptRates}
                    layout="vertical"
                    margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                    />
                    <YAxis
                      type="category"
                      dataKey="department"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={140}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="rate"
                      fill="#0d9488"
                      radius={[0, 6, 6, 0]}
                      name={t('reports.charts.rate')}
                      label={{ position: 'right', fill: '#0d9488', fontSize: 11, fontWeight: 700, formatter: (val: any) => `${val}%` }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title={t('reports.empty.noDeptAttendance')} className="h-72" />
            )}
          </CardContent>
        </Card>

        {/* Late Arrival Severity */}
        <Card className="lg:col-span-4 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <span>{t('reports.charts.lateArrivalBuckets')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t('reports.charts.lateArrivalBucketsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lateBucketsData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="#d97706"
                    radius={[6, 6, 0, 0]}
                    name={t('reports.charts.lateRecords')}
                    label={{ position: 'top', fill: '#d97706', fontSize: 11, fontWeight: 700 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceAnalyticsSection;
