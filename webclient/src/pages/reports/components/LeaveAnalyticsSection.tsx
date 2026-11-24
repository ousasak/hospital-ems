import React from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/common/EmptyState';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { LeaveAnalyticsResponse } from '@/services/reportService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  CalendarDays,
  FileCheck2,
  PieChart as PieIcon,
  UserCheck2,
  Building2,
} from 'lucide-react';

interface LeaveAnalyticsSectionProps {
  data?: LeaveAnalyticsResponse;
  isLoading?: boolean;
}

const PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-popover/95 p-2.5 text-xs text-popover-foreground shadow-lg backdrop-blur-xs space-y-1">
        {label && <p className="font-semibold text-foreground">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-mono font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const LeaveAnalyticsSection: React.FC<LeaveAnalyticsSectionProps> = ({
  data,
  isLoading = false,
}) => {
  const { t } = useLocaleStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-2xl border border-border/60 bg-card space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="lg:col-span-4 p-6 rounded-2xl border border-border/60 bg-card space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const byStatus = data?.by_status;
  const statusChartData = [
    { name: t('reports.charts.approved'), count: byStatus?.approved ?? 0, fill: '#10b981' },
    { name: t('reports.charts.pendingSupervisor'), count: byStatus?.pending_supervisor ?? 0, fill: '#f59e0b' },
    { name: t('reports.charts.pendingHr'), count: byStatus?.pending_hr ?? 0, fill: '#8b5cf6' },
    { name: t('reports.charts.rejected'), count: byStatus?.rejected ?? 0, fill: '#ef4444' },
    { name: t('reports.charts.cancelled'), count: byStatus?.cancelled ?? 0, fill: '#94a3b8' },
  ].filter((item) => item.count > 0);

  const byTypeData = data?.by_type || [];
  const monthlyLeaves = data?.leaves_by_month || [];
  const deptLeaves = data?.by_department || [];
  const currentlyOnLeave = data?.currently_on_leave || [];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-1">
        <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-purple-500" />
          <span>{t('reports.sections.leave')}</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          {t('reports.sections.leaveSubtitle')}
        </p>
      </div>

      {/* Row 1: Monthly Leave Utilization Bar Chart & Status Pipeline Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Utilization */}
        <Card className="lg:col-span-8 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <CalendarDays className="h-3.5 w-3.5" />
              </div>
              <span>{t('reports.charts.monthlyLeaveUtilization')} ({data?.year ?? 2026})</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t('reports.charts.monthlyLeaveUtilizationDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {monthlyLeaves.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyLeaves} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="days"
                      fill="#8b5cf6"
                      radius={[6, 6, 0, 0]}
                      name={t('reports.charts.days')}
                      label={{ position: 'top', fill: '#8b5cf6', fontSize: 11, fontWeight: 700 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title={t('reports.empty.noMonthlyLeave')} className="h-72" />
            )}
          </CardContent>
        </Card>

        {/* Requests by Status */}
        <Card className="lg:col-span-4 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FileCheck2 className="h-3.5 w-3.5" />
              </div>
              <span>{t('reports.charts.leavesByStatus')}</span>
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              {t('reports.charts.records')}: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{data?.total_requests ?? 0}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {statusChartData.length > 0 ? (
              <div className="h-72 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="70%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={statusChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] mt-1">
                  {statusChartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                      <span className="text-muted-foreground">{item.name}:</span>
                      <span className="font-semibold text-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title={t('reports.empty.noLeaveStatus')} className="h-72" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Leave Types (Donut) & Dept Utilization (Bar) & Currently On Leave */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leave Distribution by Type */}
        <Card className="lg:col-span-4 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <PieIcon className="h-3.5 w-3.5" />
              </div>
              <span>{t('reports.charts.leavesByType')}</span>
            </CardTitle>
            <CardDescription className="text-xs">{t('reports.charts.leavesByTypeDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {byTypeData.length > 0 ? (
              <div className="h-64 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="70%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={byTypeData}
                      dataKey="total_days"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {byTypeData.map((_, index) => (
                        <Cell key={`cell-type-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] mt-1">
                  {byTypeData.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                      />
                      <span className="text-muted-foreground truncate max-w-[100px]">{item.name}:</span>
                      <span className="font-semibold text-foreground">{item.total_days}d</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title={t('reports.empty.noLeaveType')} className="h-64" />
            )}
          </CardContent>
        </Card>

        {/* Leave Utilization by Department */}
        <Card className="lg:col-span-4 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <span>{t('reports.charts.leavesByDept')}</span>
            </CardTitle>
            <CardDescription className="text-xs">{t('reports.charts.leavesByDeptDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {deptLeaves.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptLeaves} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                    <XAxis type="number" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="department"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={85}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="days"
                      fill="#10b981"
                      radius={[0, 6, 6, 0]}
                      name={t('reports.charts.days')}
                      label={{ position: 'right', fill: '#10b981', fontSize: 11, fontWeight: 700 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title={t('reports.empty.noDeptLeave')} className="h-64" />
            )}
          </CardContent>
        </Card>

        {/* Employees Currently On Leave Today */}
        <Card className="lg:col-span-4 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <UserCheck2 className="h-3.5 w-3.5" />
                </div>
                <span>{t('reports.kpi.onLeaveEmployees')}</span>
              </div>
              <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 font-semibold">
                {currentlyOnLeave.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">{t('reports.kpi.onLeaveEmployeesDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 overflow-y-auto space-y-2.5 pr-1">
              {currentlyOnLeave.length > 0 ? (
                currentlyOnLeave.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-border/60 bg-muted/20 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8 rounded-lg shrink-0">
                        <AvatarImage src={emp.avatar_url} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                          {emp.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{emp.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{emp.leave_type}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="secondary" className="text-[10px] font-mono font-medium">
                        {emp.total_days}d
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">{t('reports.empty.noStaffOnLeave')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaveAnalyticsSection;
