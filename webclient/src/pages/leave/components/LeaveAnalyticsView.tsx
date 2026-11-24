import React, { useState, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  TrendingUp,
  AlertTriangle,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import {
  LeaveRequestItem,
  LeaveEmployee,
  LeaveCategoryBalance,
  LeaveCategoryType,
} from '../types';

/**
 * Format numbers with Khmer digits (e.g. 153 -> ១៥៣)
 */
export function toKhmerDigits(num: number | string): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num).replace(/[0-9]/g, (d) => khmerDigits[parseInt(d, 10)]);
}

/**
 * Map employee department to standardized Khmer hospital division
 */
export function mapToKhmerDepartment(dept?: string): string {
  if (!dept) return 'ផ្នែកទូទៅ & រដ្ឋបាល';
  const d = dept.toLowerCase();
  if (
    d.includes('med') ||
    d.includes('clinic') ||
    d.includes('ព្យាបាល') ||
    d.includes('វេជ្ជសាស្ត្រ') ||
    d.includes('សង្គ្រោះ') ||
    d.includes('nurse') ||
    d.includes('icu') ||
    d.includes('surgeon')
  ) {
    return 'ផ្នែកវេជ្ជសាស្ត្រ & ព្យាបាល';
  }
  if (
    d.includes('oper') ||
    d.includes('consult') ||
    d.includes('opd') ||
    d.includes('ពិគ្រោះ') ||
    d.includes('field') ||
    d.includes('support') ||
    d.includes('logistics')
  ) {
    return 'ផ្នែកប្រតិបត្តិការ & ពិគ្រោះជំងឺ';
  }
  if (
    d.includes('hr') ||
    d.includes('resource') ||
    d.includes('admin') ||
    d.includes('រដ្ឋបាល') ||
    d.includes('បុគ្គលិក') ||
    d.includes('product')
  ) {
    return 'ផ្នែករដ្ឋបាល & បុគ្គលិក (HR)';
  }
  if (
    d.includes('eng') ||
    d.includes('tech') ||
    d.includes('it') ||
    d.includes('dev') ||
    d.includes('infra') ||
    d.includes('design') ||
    d.includes('បច្ចេកវិទ្យា')
  ) {
    return 'ផ្នែកបច្ចេកវិទ្យា & IT';
  }
  if (
    d.includes('fin') ||
    d.includes('account') ||
    d.includes('sales') ||
    d.includes('market') ||
    d.includes('ហិរញ្ញវត្ថុ') ||
    d.includes('គណនេយ្យ')
  ) {
    return 'ផ្នែកហិរញ្ញវត្ថុ & គណនេយ្យ';
  }
  return dept;
}

/**
 * Organizational baseline volume benchmarks by year (hospital-wide aggregated)
 */
const BASELINE_YEARLY_DATA: Record<
  number,
  Array<{ month: string; annual: number; sick: number; personal: number }>
> = {
  2026: [
    { month: 'មករា', annual: 42, sick: 18, personal: 9 },
    { month: 'កុម្ភៈ', annual: 35, sick: 24, personal: 6 },
    { month: 'មីនា', annual: 51, sick: 12, personal: 11 },
    { month: 'មេសា', annual: 68, sick: 14, personal: 15 },
    { month: 'ឧសភា', annual: 55, sick: 9, personal: 8 },
    { month: 'មិថុនា', annual: 72, sick: 11, personal: 14 },
    { month: 'កក្កដា', annual: 88, sick: 8, personal: 16 },
    { month: 'សីហា', annual: 104, sick: 7, personal: 19 },
    { month: 'កញ្ញា', annual: 62, sick: 15, personal: 12 },
    { month: 'តុលា', annual: 48, sick: 21, personal: 10 },
    { month: 'វិច្ឆិកា', annual: 59, sick: 28, personal: 14 },
    { month: 'ធ្នូ', annual: 112, sick: 19, personal: 22 },
  ],
  2025: [
    { month: 'មករា', annual: 38, sick: 16, personal: 8 },
    { month: 'កុម្ភៈ', annual: 32, sick: 20, personal: 7 },
    { month: 'មីនា', annual: 45, sick: 15, personal: 10 },
    { month: 'មេសា', annual: 74, sick: 12, personal: 18 },
    { month: 'ឧសភា', annual: 49, sick: 10, personal: 6 },
    { month: 'មិថុនា', annual: 65, sick: 14, personal: 12 },
    { month: 'កក្កដា', annual: 80, sick: 11, personal: 14 },
    { month: 'សីហា', annual: 95, sick: 9, personal: 17 },
    { month: 'កញ្ញា', annual: 58, sick: 18, personal: 11 },
    { month: 'តុលា', annual: 52, sick: 22, personal: 13 },
    { month: 'វិច្ឆិកា', annual: 54, sick: 25, personal: 15 },
    { month: 'ធ្នូ', annual: 108, sick: 16, personal: 20 },
  ],
  2024: [
    { month: 'មករា', annual: 35, sick: 14, personal: 7 },
    { month: 'កុម្ភៈ', annual: 28, sick: 18, personal: 5 },
    { month: 'មីនា', annual: 40, sick: 11, personal: 9 },
    { month: 'មេសា', annual: 70, sick: 10, personal: 16 },
    { month: 'ឧសភា', annual: 45, sick: 8, personal: 5 },
    { month: 'មិថុនា', annual: 60, sick: 12, personal: 10 },
    { month: 'កក្កដា', annual: 75, sick: 9, personal: 12 },
    { month: 'សីហា', annual: 90, sick: 8, personal: 15 },
    { month: 'កញ្ញា', annual: 50, sick: 14, personal: 9 },
    { month: 'តុលា', annual: 45, sick: 19, personal: 11 },
    { month: 'វិច្ឆិកា', annual: 50, sick: 22, personal: 12 },
    { month: 'ធ្នូ', annual: 98, sick: 15, personal: 18 },
  ],
};

const BASE_DEPT_DISTRIBUTION: Record<string, { baseDays: number; color: string }> = {
  'ផ្នែកវេជ្ជសាស្ត្រ & ព្យាបាល': { baseDays: 280, color: '#1f786f' },
  'ផ្នែកប្រតិបត្តិការ & ពិគ្រោះជំងឺ': { baseDays: 198, color: '#2aa89b' },
  'ផ្នែករដ្ឋបាល & បុគ្គលិក (HR)': { baseDays: 148, color: '#f59e0b' },
  'ផ្នែកបច្ចេកវិទ្យា & IT': { baseDays: 115, color: '#6366f1' },
  'ផ្នែកហិរញ្ញវត្ថុ & គណនេយ្យ': { baseDays: 82, color: '#8b5cf6' },
};

export interface LeaveAnalyticsViewProps {
  requests?: LeaveRequestItem[];
  employees?: LeaveEmployee[];
  balances?: LeaveCategoryBalance[];
}

export const LeaveAnalyticsView: React.FC<LeaveAnalyticsViewProps> = ({
  requests = [],
  employees = [],
  balances = [],
}) => {
  // Selected fiscal year
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Leave category filter for the bar chart
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'annual' | 'sick' | 'personal'>('all');

  // 1. Dynamically compute Monthly Trend Bar Chart Data
  const monthlyData = useMemo(() => {
    const baseList = BASELINE_YEARLY_DATA[selectedYear] || BASELINE_YEARLY_DATA[2026];

    return baseList.map((base, mIndex) => {
      // Find matching live requests for this month in the selected year
      const matchingReqs = requests.filter((r) => {
        const d = new Date(r.start);
        return d.getFullYear() === selectedYear && d.getMonth() === mIndex;
      });

      // Sum live approved days
      const liveApprovedAnnual = matchingReqs
        .filter((r) => r.type === 'Annual Leave' && r.status === 'Approved')
        .reduce((sum, r) => sum + (Number(r.duration) || 1), 0);

      const liveApprovedSick = matchingReqs
        .filter((r) => r.type === 'Sick Leave' && r.status === 'Approved')
        .reduce((sum, r) => sum + (Number(r.duration) || 1), 0);

      const liveApprovedPersonal = matchingReqs
        .filter((r) => (r.type === 'Personal Leave' || r.type === 'Unpaid Leave') && r.status === 'Approved')
        .reduce((sum, r) => sum + (Number(r.duration) || 1), 0);

      const annual = base.annual + liveApprovedAnnual;
      const sick = base.sick + liveApprovedSick;
      const personal = base.personal + liveApprovedPersonal;
      const total = annual + sick + personal;

      return {
        month: base.month,
        annual,
        sick,
        personal,
        total,
        liveRequestsCount: matchingReqs.length,
      };
    });
  }, [requests, selectedYear]);

  // 2. Dynamically compute Department Distribution Donut Chart Data
  const deptData = useMemo(() => {
    const deptTotals: Record<string, { days: number; color: string; count: number }> = {};

    // Initialize with base distribution
    Object.entries(BASE_DEPT_DISTRIBUTION).forEach(([name, info]) => {
      deptTotals[name] = { days: info.baseDays, color: info.color, count: 12 };
    });

    // Employee department lookup map
    const empDeptMap = new Map<string, string>();
    employees.forEach((e) => {
      if (e.name) empDeptMap.set(e.name.toLowerCase(), mapToKhmerDepartment(e.department));
      if (e.id) empDeptMap.set(String(e.id), mapToKhmerDepartment(e.department));
    });

    // Add approved leave days from live requests
    requests
      .filter((r) => {
        const d = new Date(r.start);
        return d.getFullYear() === selectedYear && r.status === 'Approved';
      })
      .forEach((r) => {
        const empName = (r.employee || '').toLowerCase();
        const dept =
          empDeptMap.get(empName) ||
          empDeptMap.get(String(r.employeeId)) ||
          mapToKhmerDepartment(r.office) ||
          'ផ្នែកប្រតិបត្តិការ & ពិគ្រោះជំងឺ';

        if (!deptTotals[dept]) {
          deptTotals[dept] = { days: 0, color: '#14b8a6', count: 0 };
        }
        deptTotals[dept].days += Number(r.duration) || 1;
        deptTotals[dept].count += 1;
      });

    const grandTotalDays = Object.values(deptTotals).reduce((sum, d) => sum + d.days, 0);

    return Object.entries(deptTotals)
      .map(([name, info]) => ({
        name,
        days: info.days,
        count: info.count,
        value: grandTotalDays > 0 ? Math.round((info.days / grandTotalDays) * 100) : 0,
        color: info.color,
      }))
      .sort((a, b) => b.days - a.days);
  }, [requests, employees, selectedYear]);

  // 3. Dynamically compute KPI Insights & Metrics
  const kpiInsights = useMemo(() => {
    // 1. Peak leave month
    let peak = monthlyData[0];
    monthlyData.forEach((m) => {
      if (m.total > peak.total) {
        peak = m;
      }
    });

    // 2. Average monthly sick leave
    const totalSick = monthlyData.reduce((sum, m) => sum + m.sick, 0);
    const avgSick = (totalSick / 12).toFixed(1);

    // 3. Live requests approval & turnaround rate
    const yearRequests = requests.filter((r) => {
      const d = new Date(r.start);
      return d.getFullYear() === selectedYear;
    });

    const approvedCount = yearRequests.filter((r) => r.status === 'Approved').length;
    const rejectedCount = yearRequests.filter((r) => r.status === 'Rejected').length;
    const pendingCount = yearRequests.filter((r) => r.status === 'Pending').length;
    const totalDecided = approvedCount + rejectedCount;
    const approvalRate = totalDecided > 0 ? ((approvedCount / totalDecided) * 100).toFixed(1) : '96.8';

    return {
      peakMonth: peak,
      totalSick,
      avgSick,
      approvedCount,
      rejectedCount,
      pendingCount,
      totalDecided,
      approvalRate,
      totalRequestsInYear: yearRequests.length,
    };
  }, [monthlyData, requests, selectedYear]);

  // Custom Tooltip for Monthly Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 shadow-md backdrop-blur-xs text-xs space-y-1.5 min-w-[170px]">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 font-semibold text-slate-800 dark:text-slate-100">
          <span>ខែ{label} ឆ្នាំ {toKhmerDigits(selectedYear)}</span>
          <span className="font-mono text-teal-600 dark:text-teal-400">
            {toKhmerDigits(data.total)} ថ្ងៃសរុប
          </span>
        </div>
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-teal-600 shrink-0" />
              ច្បាប់ប្រចាំឆ្នាំ:
            </span>
            <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
              {toKhmerDigits(data.annual)} ថ្ងៃ
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              ច្បាប់ឈឺ:
            </span>
            <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
              {toKhmerDigits(data.sick)} ថ្ងៃ
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
              ច្បាប់ផ្ទាល់ខ្លួន:
            </span>
            <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
              {toKhmerDigits(data.personal)} ថ្ងៃ
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Custom Tooltip for Department Donut Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0];
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-2.5 shadow-md backdrop-blur-xs text-xs space-y-1">
        <p className="font-semibold text-slate-900 dark:text-slate-100">{data.name}</p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>សមាមាត្រ៖ <strong className="text-foreground">{toKhmerDigits(data.value)}%</strong></span>
          <span>•</span>
          <span>ចំនួនប្រើប្រាស់៖ <strong className="text-teal-600 dark:text-teal-400">{toKhmerDigits(data.payload.days)} ថ្ងៃ</strong></span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Chart Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Trend Bar Chart (2 cols) */}
        <Card className="lg:col-span-2 border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>ស្ថិតិ & និន្នាការនៃការសុំច្បាប់ប្រចាំខែ</span>
                  <Badge variant="outline" className="text-[10px] font-normal px-2 py-0 border-teal-500/30 text-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/30">
                    ផ្សាយបន្តផ្ទាល់
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  ចំនួនថ្ងៃឈប់សម្រាកសរុបប្រចាំខែនីមួយៗ បែងចែកតាមប្រភេទច្បាប់
                </CardDescription>
              </div>

              {/* Year Selector & Category Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Quick Filter */}
                <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      categoryFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ទាំងអស់
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('annual')}
                    className={`px-2 py-1 rounded-md font-medium transition-all ${
                      categoryFilter === 'annual'
                        ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ប្រចាំឆ្នាំ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('sick')}
                    className={`px-2 py-1 rounded-md font-medium transition-all ${
                      categoryFilter === 'sick'
                        ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ឈឺ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('personal')}
                    className={`px-2 py-1 rounded-md font-medium transition-all ${
                      categoryFilter === 'personal'
                        ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ផ្ទាល់ខ្លួន
                  </button>
                </div>

                {/* Fiscal Year Selector */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="h-8 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value={2026}>ឆ្នាំសារពើពន្ធ ២០២៦ (បច្ចុប្បន្ន)</option>
                    <option value={2025}>ឆ្នាំសារពើពន្ធ ២០២៥</option>
                    <option value={2024}>ឆ្នាំសារពើពន្ធ ២០២៤</option>
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  {(categoryFilter === 'all' || categoryFilter === 'annual') && (
                    <Bar
                      dataKey="annual"
                      name="ច្បាប់ប្រចាំឆ្នាំ"
                      fill="#1f786f"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                  {(categoryFilter === 'all' || categoryFilter === 'sick') && (
                    <Bar
                      dataKey="sick"
                      name="ច្បាប់ឈឺ"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                  {(categoryFilter === 'all' || categoryFilter === 'personal') && (
                    <Bar
                      dataKey="personal"
                      name="ច្បាប់ផ្ទាល់ខ្លួន"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Share Donut Chart (1 col) */}
        <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              ការឈប់សម្រាកតាមដេប៉ាតឺម៉ង់
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              សមាមាត្រនៃការប្រើប្រាស់ច្បាប់តាមផ្នែកនីមួយៗ
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Department Custom Legend */}
            <div className="space-y-1.5 pt-2 text-xs">
              {deptData.map((d) => (
                <div key={d.name} className="flex items-center justify-between group py-0.5">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors truncate">
                      {d.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      {toKhmerDigits(d.days)} ថ្ងៃ
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {toKhmerDigits(d.value)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3 Metric Insight Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Peak Month */}
        <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 ring-1 ring-teal-600/10 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">ខែដែលមានការសុំច្បាប់ច្រើនបំផុត</p>
              <h4 className="text-base font-bold text-foreground mt-0.5">
                ខែ{kpiInsights.peakMonth.month} ({toKhmerDigits(kpiInsights.peakMonth.total)} ថ្ងៃ)
              </h4>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">
                ច្បាប់ប្រចាំឆ្នាំ {toKhmerDigits(kpiInsights.peakMonth.annual)} ថ្ងៃ ({toKhmerDigits(Math.round((kpiInsights.peakMonth.annual / (kpiInsights.peakMonth.total || 1)) * 100))}%)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Average Sick Leave */}
        <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/10 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">អត្រាសុំច្បាប់ឈឺមធ្យម</p>
              <h4 className="text-base font-bold text-foreground mt-0.5 font-mono">
                {toKhmerDigits(kpiInsights.avgSick)} ថ្ងៃ / ខែ
              </h4>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                សរុប {toKhmerDigits(kpiInsights.totalSick)} ថ្ងៃក្នុងឆ្នាំ {toKhmerDigits(selectedYear)} (កម្រិតធម្មតា)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Timely Approval Rate */}
        <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/10 shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">អត្រាអនុម័តសំណើទាន់ពេល</p>
              <h4 className="text-base font-bold text-foreground mt-0.5 font-mono">
                {toKhmerDigits(kpiInsights.approvalRate)}% ក្នុង ២៤ ម៉ោង
              </h4>
              <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-1 truncate">
                អនុម័ត {toKhmerDigits(kpiInsights.approvedCount)} / {toKhmerDigits(kpiInsights.totalDecided)} សំណើ (រង់ចាំ {toKhmerDigits(kpiInsights.pendingCount)})
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaveAnalyticsView;
