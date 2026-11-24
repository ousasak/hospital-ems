import React from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/common/EmptyState';
import type { WorkforceAnalyticsResponse } from '@/services/reportService';
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
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  Building2,
  PieChart as PieIcon,
  Users2,
  TrendingUp,
  Briefcase,
} from 'lucide-react';

interface WorkforceAnalyticsSectionProps {
  data?: WorkforceAnalyticsResponse;
  isLoading?: boolean;
}

const PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#f43f5e', '#6366f1', '#64748b'];

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
            <span className="font-mono font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const WorkforceAnalyticsSection: React.FC<WorkforceAnalyticsSectionProps> = ({
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

  // Sort department data descending by count for clean horizontal presentation
  const deptData = [...(data?.by_department || [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const statusData = (data?.by_status || []).map((item) => ({
    ...item,
    translatedLabel: t(`reports.status.${item.status}`) || item.label,
  }));
  const genderData = (data?.by_gender || []).map((item) => ({
    ...item,
    translatedLabel: t(`reports.genderMap.${item.gender}`) || item.label,
  }));
  const hiringData = data?.hiring_trends || [];
  const positionData = data?.by_position || [];
  const totalHeadcount = data?.total_headcount ?? 0;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-1">
        <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users2 className="h-4 w-4 text-primary" />
          <span>{t('reports.sections.workforce')}</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          {t('reports.sections.workforceSubtitle')}
        </p>
      </div>

      {/* Row 1: Department Distribution (Horizontal Bar) & Status (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Headcount by Department - Horizontal Bar Chart */}
        <Card className="lg:col-span-8 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
          <CardHeader className="pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <span>{t('reports.charts.deptDistribution')}</span>
              </CardTitle>
              <span className="text-xs text-muted-foreground font-mono">
                {t('reports.workforcePool')}: <strong className="text-blue-600 dark:text-blue-400 font-bold">{totalHeadcount}</strong>
              </span>
            </div>
            <CardDescription className="text-xs">
              {t('reports.charts.deptDistributionDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {deptData.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deptData}
                    layout="vertical"
                    margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={140}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      fill="#2563eb"
                      radius={[0, 6, 6, 0]}
                      name={t('reports.charts.headcount')}
                      label={{ position: 'right', fill: '#2563eb', fontSize: 11, fontWeight: 700 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title={t('reports.empty.noDeptData')} className="h-80" />
            )}
          </CardContent>
        </Card>

        {/* Status Distribution (Donut with center metric) */}
        <Card className="lg:col-span-4 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <PieIcon className="h-3.5 w-3.5" />
              </div>
              <span>{t('reports.charts.employmentStatus')}</span>
            </CardTitle>
            <CardDescription className="text-xs">{t('reports.charts.employmentStatusDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex-1 flex flex-col items-center justify-center">
            {statusData.length > 0 ? (
              <div className="h-80 w-full flex flex-col items-center justify-center">
                <div className="relative w-full h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie
                        data={statusData}
                        dataKey="count"
                        nameKey="translatedLabel"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={84}
                        paddingAngle={3}
                      >
                        {statusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Stat Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold tracking-tight text-foreground font-sans">
                      {totalHeadcount}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      {t('reports.charts.headcount')}
                    </span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] mt-2 w-full px-2">
                  {statusData.map((item, index) => (
                    <div
                      key={item.status}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/30 border border-border/40"
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                      />
                      <span className="text-muted-foreground">{item.translatedLabel}:</span>
                      <span className="font-semibold text-foreground font-mono">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title={t('reports.empty.noStatusData')} className="h-80" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Hiring Trends (Area) + Positions (Horizontal Bar) + Gender (Donut) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Hiring Trends */}
        <Card className="lg:col-span-5 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <span>{t('reports.charts.hiringTrends')}</span>
            </CardTitle>
            <CardDescription className="text-xs">{t('reports.charts.hiringTrendsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {hiringData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hiringData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHiring" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
                    <XAxis
                      dataKey="short_month"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorHiring)"
                      name={t('reports.charts.newJoins')}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title={t('reports.empty.noHiringData')} className="h-64" />
            )}
          </CardContent>
        </Card>

        {/* Top Positions by Headcount */}
        <Card className="lg:col-span-4 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Briefcase className="h-3.5 w-3.5" />
              </div>
              <span>{t('reports.charts.positionDistribution')}</span>
            </CardTitle>
            <CardDescription className="text-xs">{t('reports.charts.positionDistributionDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {positionData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={positionData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="title"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      fill="#8b5cf6"
                      radius={[0, 6, 6, 0]}
                      name={t('reports.charts.headcount')}
                      label={{ position: 'right', fill: '#8b5cf6', fontSize: 11, fontWeight: 700 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title={t('reports.empty.noPositionData')} className="h-64" />
            )}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card className="lg:col-span-3 rounded-xl border border-border/70 bg-card shadow-xs hover:border-border hover:shadow-sm transition-all">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Users2 className="h-3.5 w-3.5" />
              </div>
              <span>{t('reports.charts.genderDistribution')}</span>
            </CardTitle>
            <CardDescription className="text-xs">{t('reports.charts.genderDistributionDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {genderData.length > 0 ? (
              <div className="h-64 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="68%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={genderData}
                      dataKey="count"
                      nameKey="translatedLabel"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={4}
                    >
                      {genderData.map((_, index) => (
                        <Cell
                          key={`cell-g-${index}`}
                          fill={index === 0 ? '#3b82f6' : index === 1 ? '#ec4899' : '#94a3b8'}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1 w-full px-4 text-xs mt-1">
                  {genderData.map((item, index) => (
                    <div key={item.gender} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              index === 0 ? '#3b82f6' : index === 1 ? '#ec4899' : '#94a3b8',
                          }}
                        />
                        {item.translatedLabel}
                      </span>
                      <span className="font-semibold text-foreground font-mono">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title={t('reports.empty.noGenderData')} className="h-64" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkforceAnalyticsSection;
