import React from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import type { ShiftAnalyticsResponse } from '@/services/reportService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Clock,
  Sun,
  Sunset,
  Moon,
  Briefcase,
  Building2,
  Users,
} from 'lucide-react';

interface ShiftAnalyticsSectionProps {
  data?: ShiftAnalyticsResponse;
  isLoading?: boolean;
}

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

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

export const ShiftAnalyticsSection: React.FC<ShiftAnalyticsSectionProps> = ({
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

  const shifts = data?.by_shift || [];
  const categories = data?.categories_breakdown;
  const deptCoverage = data?.by_department || [];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            <span>{t('reports.sections.shifts')}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('reports.sections.shiftsSubtitle')}
          </p>
        </div>

        {/* Unassigned staff indicator */}
        <div className="flex items-center gap-2 text-xs">
          <Badge
            variant="outline"
            className="px-3 py-1 rounded-xl bg-muted/40 border-border/70 text-muted-foreground font-medium"
          >
            <Users className="h-3.5 w-3.5 mr-1 text-primary" />
            {t('reports.workforcePool')}: {data?.total_active_employees ?? 0}
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-medium"
          >
            {t('reports.charts.records')}: {data?.total_shift_records ?? 0}
          </Badge>
        </div>
      </div>

      {/* Row 1: Four Timing Category Cards in Clean Minimal Shadcn UI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Morning Shift */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all duration-200 p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sun className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground truncate">
              {t('reports.shifts.morning')}
            </p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {categories?.morning?.count ?? 0}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="font-mono">07:00 - 15:00</span>
              <span>•</span>
              <span className="truncate">{t('reports.shifts.morningDesc')}</span>
            </div>
          </div>
        </Card>

        {/* Afternoon Shift */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all duration-200 p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Sunset className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground truncate">
              {t('reports.shifts.afternoon')}
            </p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {categories?.afternoon?.count ?? 0}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="font-mono">14:00 - 21:00</span>
              <span>•</span>
              <span className="truncate">{t('reports.shifts.afternoonDesc')}</span>
            </div>
          </div>
        </Card>

        {/* Night / Duty Shift */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all duration-200 p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Moon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground truncate">
              {t('reports.shifts.night')}
            </p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {categories?.night?.count ?? 0}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="font-mono">20:00 - 08:00</span>
              <span>•</span>
              <span className="truncate">{t('reports.shifts.nightDesc')}</span>
            </div>
          </div>
        </Card>

        {/* Administrative Office Shift */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all duration-200 p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground truncate">
              {t('reports.shifts.office')}
            </p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {categories?.office?.count ?? 0}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="font-mono">08:00 - 17:00</span>
              <span>•</span>
              <span className="truncate">{t('reports.shifts.officeDesc')}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Shift Distribution (Bar) & Shift Coverage by Department (Stacked Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Duty Shift Distribution */}
        <Card className="lg:col-span-5 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <span>{t('reports.charts.shiftDistribution')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t('reports.charts.shiftDistributionDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {shifts.length > 0 ? (
              <div className="h-72 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="75%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={shifts}
                      dataKey="records_count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {shifts.map((_, index) => (
                        <Cell key={`cell-shift-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] mt-1">
                  {shifts.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                      />
                      <span className="text-muted-foreground truncate max-w-[120px]">{item.name}:</span>
                      <span className="font-semibold text-foreground">{item.records_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title={t('reports.empty.noShiftData')} className="h-72" />
            )}
          </CardContent>
        </Card>

        {/* Department Shift Coverage */}
        <Card className="lg:col-span-7 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <span>{t('reports.charts.shiftDeptCoverage')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t('reports.charts.shiftDeptCoverageDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {deptCoverage.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deptCoverage}
                    layout="vertical"
                    margin={{ top: 10, right: 25, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
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
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="morning" stackId="a" fill="#f59e0b" name={t('reports.shifts.morning')} />
                    <Bar dataKey="afternoon" stackId="a" fill="#f97316" name={t('reports.shifts.afternoon')} />
                    <Bar dataKey="night" stackId="a" fill="#8b5cf6" name={t('reports.shifts.night')} />
                    <Bar dataKey="office" stackId="a" fill="#3b82f6" name={t('reports.shifts.office')} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title={t('reports.empty.noShiftCoverage')} className="h-72" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShiftAnalyticsSection;
