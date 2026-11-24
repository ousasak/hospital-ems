import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService } from '@/services/dashboardService';
import { attendanceService } from '@/services/attendanceService';
import { leaveService } from '@/services/leaveService';
import { employeeService } from '@/services/employeeService';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/utils';
import {
  Users,
  Clock,
  ExternalLink,
  Download,
  Plus,
  LogIn,
  LogOut,
  CheckCircle2,
  Check,
  X,
  Cake,
  Calendar,
  Briefcase,
  AlertCircle,
  FileSpreadsheet,
  UserCheck,
  ShieldAlert,
  FileText,
  UserPlus,
  Sparkles,
  CalendarDays,
  Bell,
  BellOff,
  Gift,
  ChevronRight,
  ArrowUpRight,
  Timer,
  PartyPopper,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../components/ui/tabs';

// Khmer Day & Month Localized Maps for Charts
const khmerDayMap: Record<string, string> = {
  Mon: 'ច័ន្ទ',
  Tue: 'អង្គារ',
  Wed: 'ពុធ',
  Thu: 'ព្រហ',
  Fri: 'សុក្រ',
  Sat: 'សៅរ៍',
  Sun: 'អាទិត្យ',
};

const khmerFullDayMap: Record<string, string> = {
  Mon: 'ថ្ងៃច័ន្ទ',
  Tue: 'ថ្ងៃអង្គារ',
  Wed: 'ថ្ងៃពុធ',
  Thu: 'ថ្ងៃព្រហស្បតិ៍',
  Fri: 'ថ្ងៃសុក្រ',
  Sat: 'ថ្ងៃសៅរ៍',
  Sun: 'ថ្ងៃអាទិត្យ',
};

const khmerMonthMap: Record<string, string> = {
  Jan: 'មករា',
  Feb: 'កុម្ភៈ',
  Mar: 'មីនា',
  Apr: 'មេសា',
  May: 'ឧសភា',
  Jun: 'មិថុនា',
  Jul: 'កក្កដា',
  Aug: 'សីហា',
  Sep: 'កញ្ញា',
  Oct: 'តុលា',
  Nov: 'វិច្ឆិកា',
  Dec: 'ធ្នូ',
};

export const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeRange, setActiveRange] = useState<'7d' | '30d' | '3m' | '12m'>('7d');
  const [actionTab, setActionTab] = useState<'pending' | 'late' | 'on_leave'>('pending');
  const [addEmployeeModalOpen, setAddEmployeeModalOpen] = useState(false);

  // Quick Employee State
  const [empCode, setEmpCode] = useState('');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDept, setEmpDept] = useState('Engineering');
  const [empPosition, setEmpPosition] = useState('Software Engineer');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Dashboard Stats from live API
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      return await dashboardService.getStats();
    },
  });

  // Fetch Today Attendance status for Current User
  const { data: todayStatus, refetch: refetchToday } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: async () => {
      return await attendanceService.getToday();
    },
  });

  // Check-in Mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      return await attendanceService.checkIn({ method: 'manual' });
    },
    onSuccess: (resData: any) => {
      toast.success(resData?.message || 'Punched in successfully');
      refetchToday();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Punch in failed');
    },
  });

  // Check-out Mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      return await attendanceService.checkOut();
    },
    onSuccess: (resData: any) => {
      toast.success(resData?.message || 'Punched out successfully');
      refetchToday();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Punch out failed');
    },
  });

  // Supervisor Quick Leave Approval
  const approveLeaveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'approved' | 'rejected' }) => {
      return await leaveService.supervisorReview(id, {
        status,
        comments: 'Reviewed via SmartHR Quick Action',
      });
    },
    onSuccess: (resData: any) => {
      toast.success(resData?.message || 'Leave status updated');
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });

  const metrics: any = (data as any)?.metrics || {};
  const totalEmployees = Number(metrics.total_employees ?? 0);
  const activeEmployees = Number(metrics.active_employees ?? 0);
  const probationEmployees = Number(metrics.probation_employees ?? 0);
  const todayPresent = Number(metrics.today_present ?? 0);
  const todayLate = Number(metrics.today_late ?? 0);
  const todayAbsent = Number(metrics.today_absent ?? 0);
  const todayOnLeave = Number(metrics.today_on_leave ?? 0);
  const pendingLeaves = Number(metrics.pending_leave_count ?? 0);
  const latestPayrollNet =
    Number(metrics.latest_payroll_net) > 0
      ? formatCurrency(metrics.latest_payroll_net, metrics.latest_payroll_currency || '$')
      : '$0.00';

  const attendanceRate =
    totalEmployees > 0 ? Math.round(((todayPresent + todayLate) / totalEmployees) * 100) : 0;

  // Donut chart data for Departmental Allocation (100% live from backend)
  const deptColors = ['#1f786f', '#d99b26', '#4ecdc4', '#3b82f6', '#ec4899', '#8b5cf6', '#71817e'];

  const rawDepartments = Array.isArray(data?.departments) ? data.departments : [];

  const departmentDonutData = rawDepartments.slice(0, 5).map((dept: any, idx: number) => {
    const count = Number(dept.count) || 0;
    const percent = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;
    return {
      name: dept.name,
      value: count,
      color: deptColors[idx % deptColors.length],
      percent: percent,
    };
  });

  // Dynamic Attendance Trends Chart Dataset (100% live from API)
  const chartTrendsData = useMemo(() => {
    const rawList =
      (data as any)?.attendance_trends_datasets?.[activeRange] ||
      (activeRange === '7d' && Array.isArray((data as any)?.attendance_trends)
        ? (data as any).attendance_trends
        : []) ||
      [];

    return (rawList || []).map((item: any) => {
      const rawDay = item.dayName || item.label || item.date || '';
      const isKm = locale === 'km';
      let displayLabel = rawDay;
      let fullLabel = item.date || rawDay;

      if (isKm) {
        if (khmerDayMap[rawDay]) {
          displayLabel = khmerDayMap[rawDay];
          fullLabel = `${khmerFullDayMap[rawDay] || rawDay}, ${item.date || ''}`;
        } else if (typeof rawDay === 'string' && rawDay.startsWith('Week ')) {
          displayLabel = `សប្តាហ៍ទី ${rawDay.replace('Week ', '')}`;
          fullLabel = `សប្តាហ៍ទី ${rawDay.replace('Week ', '')} (${item.date || ''})`;
        } else if (typeof rawDay === 'string' && rawDay.startsWith('Q')) {
          displayLabel = `ត្រីមាស ${rawDay.replace('Q', '')}`;
          fullLabel = `ត្រីមាស ${rawDay.replace('Q', '')}`;
        } else if (khmerMonthMap[rawDay]) {
          displayLabel = khmerMonthMap[rawDay];
          fullLabel = `ខែ${khmerMonthMap[rawDay]}`;
        }
      }

      const pres = Number(item.present) || 0;
      const lt = Number(item.late) || 0;
      const abs = item.absent !== undefined ? Number(item.absent) : Math.max(0, totalEmployees - pres - lt);
      const totalChecked = Math.max(1, pres + lt + abs);
      const attRate = Math.min(100, Math.round(((pres + lt) / totalChecked) * 100));

      return {
        label: displayLabel,
        fullLabel: fullLabel,
        rawLabel: rawDay,
        date: item.date,
        present: pres,
        late: lt,
        absent: abs,
        totalPresent: pres + lt,
        attendanceRate: attRate,
      };
    });
  }, [data, activeRange, locale, totalEmployees]);

  // Aggregate stats summary for the selected timeframe
  const trendSummary = useMemo(() => {
    if (!chartTrendsData || chartTrendsData.length === 0) {
      return {
        avgRate: attendanceRate || 0,
        avgPunctuality: 100,
        avgPresent: todayPresent || 0,
        avgLate: todayLate || 0,
        avgAbsent: todayAbsent || 0,
        totalChecked: totalEmployees || 0,
      };
    }
    const count = chartTrendsData.length;
    const totalPresent = chartTrendsData.reduce((acc: number, cur: any) => acc + (cur.present || 0), 0);
    const totalLate = chartTrendsData.reduce((acc: number, cur: any) => acc + (cur.late || 0), 0);
    const totalAbsent = chartTrendsData.reduce((acc: number, cur: any) => acc + (cur.absent || 0), 0);

    const avgPres = Math.round(totalPresent / count);
    const avgLt = Math.round(totalLate / count);
    const avgAbs = Math.round(totalAbsent / count);
    const totalWorkingAvg = Math.max(1, avgPres + avgLt + avgAbs);
    const avgRate = Math.min(100, Math.round(((avgPres + avgLt) / totalWorkingAvg) * 100));
    const avgPunctuality = Math.min(100, Math.round((avgPres / Math.max(1, avgPres + avgLt)) * 100));

    const latestItem = chartTrendsData[chartTrendsData.length - 1];

    return {
      avgRate,
      avgPunctuality,
      avgPresent: latestItem?.present ?? avgPres,
      avgLate: latestItem?.late ?? avgLt,
      avgAbsent: latestItem?.absent ?? avgAbs,
      totalChecked: (latestItem?.present ?? avgPres) + (latestItem?.late ?? avgLt) + (latestItem?.absent ?? avgAbs),
    };
  }, [chartTrendsData, attendanceRate, todayPresent, todayLate, todayAbsent, totalEmployees]);

  // 100% Live Backend Data Lists
  const announcementsList = Array.isArray(data?.announcements) ? data.announcements : [];
  const holidaysList = Array.isArray(data?.upcoming_holidays) ? data.upcoming_holidays : [];
  const birthdaysList = Array.isArray(data?.upcoming_birthdays) ? data.upcoming_birthdays : [];
  const expiringContractsList = Array.isArray(data?.expiring_contracts) ? data.expiring_contracts : [];
  const probationReviewsList = Array.isArray(data?.probation_reviews) ? data.probation_reviews : [];
  const newJoinersList = Array.isArray(data?.new_joiners) ? data.new_joiners : [];
  const lateStaffList = Array.isArray(data?.today_exceptions?.late) ? data.today_exceptions.late : [];
  const onLeaveStaffList = Array.isArray(data?.today_exceptions?.on_leave) ? data.today_exceptions.on_leave : [];

  const handleExportRoster = () => {
    try {
      const rows = [
        ['Metric', 'Value'],
        ['Total Workforce Headcount', String(totalEmployees)],
        ['Active Workforce', String(activeEmployees)],
        ['Attendance Rate', `${attendanceRate}%`],
        ['Present Today', String(todayPresent)],
        ['Absent / On Leave', String(todayAbsent)],
        ['Pending Leave Requests', String(pendingLeaves)],
        ['Monthly Payroll Disbursement', latestPayrollNet],
      ];
      const csvContent =
        'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `smarthr_workforce_roster_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t('dashboard.rosterExported'));
    } catch {
      window.location.href = '/api/v1/employees/export';
    }
  };

  const handleQuickAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empEmail) {
      toast.error(t('dashboard.enterNameEmail'));
      return;
    }
    try {
      const parts = empName.trim().split(' ');
      const lastName = parts.length > 1 ? parts[0] : '';
      const firstName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
      await employeeService.createEmployee({
        first_name: firstName,
        last_name: lastName,
        work_email: empEmail,
        employee_code: empCode || `EMP-${Date.now().toString().slice(-4)}`,
        employment_status: 'active',
      });
      toast.success(t('dashboard.employeeOnboarded', { name: empName }));
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setAddEmployeeModalOpen(false);
      setEmpName('');
      setEmpEmail('');
      setEmpCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to onboard employee');
    }
  };

  const displayName = user?.name || t('userMenu.superAdmin', 'Super Admin');

  return (
    <div className="space-y-5">
      {/* 1. SLIM & CLEAN MODERN EXECUTIVE HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d2a2d] via-[#103438] to-[#123e42] p-5 sm:p-6 text-white shadow-sm border border-white/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left Greeting & Subtitle */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {t('dashboard.liveWorkforce')}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-xs font-medium text-white/70">
                {currentTime.toLocaleDateString(locale === 'km' ? 'km-KH' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {t('dashboard.goodMorning')}{' '}
              <span className="text-[#bbf451] font-semibold">{displayName}.</span>
            </h1>

            <p className="text-xs text-white/75 sm:text-sm max-w-xl">
              {t('dashboard.workforceTelemetry', { count: totalEmployees })}
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-1 md:pt-0">
            <button
              type="button"
              onClick={handleExportRoster}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition-all hover:bg-white/20 focus-visible:outline-none cursor-pointer shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t('dashboard.exportRoster')}</span>
            </button>

            <Link
              to="/employees/create"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#bbf451] px-4 py-2 text-xs font-semibold text-[#102f32] shadow-xs transition-all hover:bg-[#b6d55c] focus-visible:outline-none cursor-pointer hover:shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>{t('employees.addEmployee')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. 5 KPI METRIC CARDS (Minimalist & Clean) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Card 1: Total Employees */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-200 hover:border-border hover:shadow-sm group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('dashboard.totalEmployees')}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors group-hover:text-foreground">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {totalEmployees}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                {activeEmployees} {t('dashboard.activeStatus', 'សកម្ម')}
              </span>
              {probationEmployees > 0 && (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="truncate">{probationEmployees} {t('dashboard.probationStatus', 'សាកល្បង')}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Today's Present */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-200 hover:border-border hover:shadow-sm group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('dashboard.presentToday')}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors group-hover:text-foreground">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {todayPresent}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{attendanceRate}%</span>
              <span className="truncate">{t('dashboard.attendanceRateSubtitle', { rate: attendanceRate })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pending Leaves */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-200 hover:border-border hover:shadow-sm group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('dashboard.pendingLeaves')}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors group-hover:text-foreground">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {pendingLeaves}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
              <span className={`font-semibold font-mono ${pendingLeaves > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                {pendingLeaves > 0 ? `-${pendingLeaves}` : '0'}
              </span>
              <span className="truncate">{t('dashboard.urgentReviewsNeeded', { count: pendingLeaves })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Shift Coverage */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-200 hover:border-border hover:shadow-sm group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('dashboard.shiftCoverage')}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors group-hover:text-foreground">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {attendanceRate}%
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{todayPresent}/{totalEmployees}</span>
              <span className="truncate">{t('dashboard.rotasSubtitle')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Monthly Payroll */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs transition-all duration-200 hover:border-border hover:shadow-sm group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('dashboard.monthlyPayroll')}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors group-hover:text-foreground">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {latestPayrollNet}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
              <span className="font-semibold text-foreground font-mono">{metrics.latest_payroll_currency || 'USD'}</span>
              <span className="truncate">{t('dashboard.currentCycleDisburse')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. ANALYTICS ROW (Attendance Spline Chart + Departmental Distribution Donut) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Card: Attendance & Presence Overview (approx 65% width) */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs lg:col-span-7 xl:col-span-8 flex flex-col justify-between overflow-hidden">
          <CardHeader className="p-4 pb-2 space-y-3">
            {/* Header with Subtitle & Time Range Pills */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  {t('dashboard.attendancePunctualityTrends')}
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  {t('dashboard.punctualityPresenceHealth')}
                </CardDescription>
              </div>

              {/* Time Range Selector with explicit Khmer / English names */}
              <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5">
                {(
                  [
                    { key: '7d', label: t('dashboard.range7Days'), fullLabel: t('dashboard.range7DaysFull') },
                    { key: '30d', label: t('dashboard.range30Days'), fullLabel: t('dashboard.range30DaysFull') },
                    { key: '3m', label: t('dashboard.range3Months'), fullLabel: t('dashboard.range3MonthsFull') },
                    { key: '12m', label: t('dashboard.range1Year'), fullLabel: t('dashboard.range1YearFull') },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    title={tab.fullLabel}
                    onClick={() => setActiveRange(tab.key)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                      activeRange === tab.key
                        ? 'bg-background text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clean Neutral Analytical Summary Stats */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/40">
              <div className="flex items-center gap-1.5">
                <span>{t('dashboard.avgAttendanceRate')}:</span>
                <span className="font-mono font-semibold text-foreground">{trendSummary.avgRate}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                <span>{t('dashboard.presentOnTime')}:</span>
                <span className="font-mono font-semibold text-foreground">{trendSummary.avgPresent}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                <span>{t('dashboard.lateArrivals')}:</span>
                <span className="font-mono font-semibold text-foreground">{trendSummary.avgLate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#f43f5e]" />
                <span>{t('dashboard.absentOrLeave', 'អវត្តមាន / ច្បាប់')}:</span>
                <span className="font-mono font-semibold text-foreground">{trendSummary.avgAbsent}</span>
              </div>
            </div>

            {/* Target Threshold */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground border-t border-border/40 pt-1.5">
              <span className="inline-block h-2 w-4 border-b-2 border-dashed border-emerald-500" />
              <span>{t('dashboard.targetBenchmark')} ({Math.round(totalEmployees * 0.95)} {t('dashboard.headcountUnit')})</span>
            </div>
          </CardHeader>

          {/* Area Chart Container */}
          <CardContent className="p-5 pt-0">
            <div className="h-72 w-full sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartTrendsData}
                  margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-border/50"
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#8ea5a2"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(142, 165, 162, 0.2)' }}
                    dy={5}
                  />
                  <YAxis
                    stroke="#8ea5a2"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    domain={[0, (dataMax: number) => Math.max(35, Math.ceil(dataMax * 1.15))]}
                    tickFormatter={(val) => `${val}`}
                    dx={-2}
                  />
                  <ReferenceLine
                    y={Math.round(totalEmployees * 0.95)}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                    label={{
                      value: `${t('dashboard.targetBenchmark')}`,
                      position: 'top',
                      fill: '#10b981',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0]?.payload;
                        if (!item) return null;
                        return (
                          <div className="rounded-xl border border-white/10 bg-[#102f32]/95 p-3.5 text-white shadow-2xl backdrop-blur-md">
                            <div className="border-b border-white/15 pb-2">
                              <p className="text-xs font-semibold tracking-wide text-white/95">
                                {item.fullLabel || item.label}
                              </p>
                              <div className="mt-1 flex items-center justify-between gap-3 text-[11px] font-mono">
                                <span className="text-white/70">{t('dashboard.overallAttendanceRate')}:</span>
                                <span className="font-bold text-[#bbf451]">{item.attendanceRate}%</span>
                              </div>
                            </div>
                            <div className="mt-2.5 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-white/80">
                                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                  {t('dashboard.presentOnTime')}:
                                </span>
                                <span className="font-mono font-bold text-emerald-400">
                                  {item.present} {t('dashboard.headcountUnit')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-white/80">
                                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                                  {t('dashboard.lateArrivals')}:
                                </span>
                                <span className="font-mono font-bold text-amber-400">
                                  {item.late} {t('dashboard.headcountUnit')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-white/80">
                                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                                  {t('dashboard.absentOrLeave')}:
                                </span>
                                <span className="font-mono font-bold text-rose-400">
                                  {item.absent} {t('dashboard.headcountUnit')}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2.5 border-t border-white/10 pt-2 flex items-center justify-between text-[11px] font-mono text-white/70">
                              <span>{t('dashboard.totalEmployees')}:</span>
                              <span className="font-bold text-white">
                                {item.present + item.late + item.absent} {t('dashboard.headcountUnit')}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorPresent)"
                    name="Present"
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="late"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorLate)"
                    name="Late"
                    activeDot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    stroke="#f43f5e"
                    strokeWidth={1.8}
                    strokeDasharray="3 3"
                    fillOpacity={1}
                    fill="url(#colorAbsent)"
                    name="Absent"
                    activeDot={{ r: 4, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right Card: Departmental Capacity & Distribution (approx 35% width) */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs lg:col-span-5 xl:col-span-4 flex flex-col justify-between overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  {t('dashboard.workforceAllocation')}
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  {t('dashboard.departmentCapacity')}
                </CardDescription>
              </div>
              <Link
                to="/employees"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{t('dashboard.directory')}</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2">
            {departmentDonutData.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <Users className="mx-auto h-6 w-6 text-muted-foreground/30 mb-2" />
                <p>{t('dashboard.noDepartmentData', 'មិនទាន់មានទិន្នន័យផ្នែកនៅឡើយទេ')}</p>
              </div>
            ) : (
              /* Donut Chart & Progress Bars Breakdown */
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
                {/* Donut Chart with Center Text */}
                <div className="relative mx-auto sm:col-span-5 h-36 w-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={64}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {departmentDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Badge */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold text-foreground font-mono">
                      {totalEmployees}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t('nav.employees')}
                    </span>
                  </div>
                </div>

                {/* Progress Bar Rows */}
                <div className="sm:col-span-7 space-y-3">
                  {departmentDonutData.map((dept, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[140px]" title={dept.name}>
                          {dept.name}
                        </span>
                        <span className="font-mono text-muted-foreground text-[11px]">
                          {dept.value} • {dept.percent}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted/60">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${dept.percent}%`, backgroundColor: dept.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          {/* Bottom Shift Coverage Metric */}
          <CardFooter className="border-t border-border/60 p-4 pt-3 flex flex-col items-start gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('dashboard.primaryShiftStatus')}
            </div>
            <div className="mt-0.5 flex w-full items-center justify-between">
              <span className="text-xs text-foreground font-medium">
                {t('dashboard.morningShift', 'វេនព្រឹក (Morning Shift)')}
              </span>
              <span className="font-mono text-xs font-bold text-foreground">
                {attendanceRate}%
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* 4. REAL-TIME EMPLOYEE TIME CLOCK & PENDING APPROVALS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Quick Shift Punch Action */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs lg:col-span-5 flex flex-col justify-between overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-semibold text-foreground">
                  {t('dashboard.liveAttendancePunch')}
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  {currentTime.toLocaleDateString(locale === 'km' ? 'km-KH' : 'en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px] h-5 px-2 font-medium bg-muted text-muted-foreground border-0">
                {user?.name || t('userMenu.superAdmin')}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 flex flex-col items-center justify-center py-6">
            <div className="font-mono text-3xl font-bold tracking-tight text-foreground">
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.hrAdminHub')}
            </p>
          </CardContent>

          <CardFooter className="border-t border-border/50 p-3 px-4">
            {!todayStatus?.has_checked_in ? (
              <Button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="w-full gap-2 bg-[#1f786f] hover:bg-[#195e58] text-white font-medium text-xs h-9 rounded-lg"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{t('dashboard.clockInNow')}</span>
              </Button>
            ) : !todayStatus?.has_checked_out ? (
              <div className="flex w-full items-center gap-2">
                <span className="flex flex-1 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  {t('dashboard.clockedInAt', {
                    time: new Date(todayStatus.attendance.check_in_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  })}
                </span>
                <Button
                  onClick={() => checkOutMutation.mutate()}
                  disabled={checkOutMutation.isPending}
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 text-xs h-9 rounded-lg"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t('dashboard.clockOut')}</span>
                </Button>
              </div>
            ) : (
              <div className="flex w-full items-center justify-between rounded-lg bg-muted/40 p-2.5 text-xs">
                <span className="font-medium text-muted-foreground">{t('dashboard.shiftCompleted')}</span>
                <span className="font-mono font-bold text-foreground">
                  {t('dashboard.shiftHours', { hours: todayStatus.attendance.working_hours })}
                </span>
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Action Queue & Exceptions with shadcn Tabs */}
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs lg:col-span-7 flex flex-col justify-between overflow-hidden">
          <Tabs defaultValue="pending" className="w-full h-full flex flex-col justify-between">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-xs font-semibold text-foreground">
                    {t('dashboard.pendingLeaveRequests')}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    {t('dashboard.actionQueue')}
                  </CardDescription>
                </div>

                {/* Sub-tabs for Action Queue */}
                <TabsList className="bg-muted/40 p-0.5 h-8">
                  <TabsTrigger value="pending" className="gap-1.5 text-xs h-7 px-2.5">
                    <span>{t('dashboard.pendingLeaves')}</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 leading-none">
                      {data?.pending_leaves?.length ?? 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="late" className="gap-1.5 text-xs h-7 px-2.5">
                    <span>{t('dashboard.lateStaff')}</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 leading-none bg-amber-500/10 text-amber-600">
                      {lateStaffList.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="on_leave" className="gap-1.5 text-xs h-7 px-2.5">
                    <span>{t('dashboard.onLeaveStaff')}</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 leading-none bg-blue-500/10 text-blue-600">
                      {onLeaveStaffList.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-1 flex-1">
              {/* Tab 1: Pending Leaves */}
              <TabsContent value="pending" className="mt-0">
                {(data?.pending_leaves || []).length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-6 w-6 text-muted-foreground/30 mb-2" />
                    {t('dashboard.allRequestsReviewed')}
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {data?.pending_leaves.slice(0, 3).map((req: any) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between py-2.5 px-1 text-xs hover:bg-muted/30 rounded-md transition-colors"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-xs">
                              {req.employee?.full_name}
                            </span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                              {req.leave_type?.name}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {formatDate(req.start_date)} - {formatDate(req.end_date)} ({t('dashboard.daysCount', { count: req.total_days })}) •{' '}
                            <span className="italic">{req.reason || t('dashboard.personalLeave')}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              approveLeaveMutation.mutate({ id: req.id, status: 'approved' })
                            }
                            disabled={approveLeaveMutation.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors"
                            title={t('common.approve')}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              approveLeaveMutation.mutate({ id: req.id, status: 'rejected' })
                            }
                            disabled={approveLeaveMutation.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-rose-600 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
                            title={t('common.reject')}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Late Arrivals Today */}
              <TabsContent value="late" className="mt-0">
                {lateStaffList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-6 w-6 text-muted-foreground/30 mb-2" />
                    {t('dashboard.noExceptionsToday')}
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {lateStaffList.slice(0, 3).map((item: any, i: number) => (
                      <div
                        key={item.id || i}
                        className="flex items-center justify-between py-2.5 px-1 text-xs hover:bg-muted/30 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-7 w-7 border border-border/50 shrink-0">
                            <AvatarImage src={item.avatar_url} />
                            <AvatarFallback className="text-[10px]">
                              {item.name?.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-xs truncate">{item.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {t('dashboard.checkedInAt')} <span className="font-mono font-medium">{item.check_in_time}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 text-[10px] font-mono shrink-0">
                          {t('dashboard.minutesLate', { min: item.late_minutes })}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: On Leave Today */}
              <TabsContent value="on_leave" className="mt-0">
                {onLeaveStaffList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-6 w-6 text-muted-foreground/30 mb-2" />
                    {t('dashboard.noExceptionsToday')}
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {onLeaveStaffList.slice(0, 3).map((item: any, i: number) => (
                      <div
                        key={item.id || i}
                        className="flex items-center justify-between py-2.5 px-1 text-xs hover:bg-muted/30 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-7 w-7 border border-border/50 shrink-0">
                            <AvatarImage src={item.avatar_url} />
                            <AvatarFallback className="text-[10px]">
                              {item.name?.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-xs truncate">{item.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{item.notes}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-600 text-[10px] shrink-0">
                          {t('dashboard.onLeaveStaff')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </CardContent>

            <CardFooter className="border-t border-border/50 p-3 px-4 flex items-center justify-between text-xs">
              <Link to="/leaves" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <span>{t('dashboard.viewAllLeaveRequests')}</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
              <Link to="/attendance" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {t('dashboard.viewAttendanceLog')}
              </Link>
            </CardFooter>
          </Tabs>
        </Card>
      </div>

      {/* 5. COMPLIANCE & TALENT LIFECYCLE (Contract Expirations, Probation Reviews, New Joiners) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {t('dashboard.complianceHub', 'ការគ្រប់គ្រងកិច្ចសន្យា & វដ្តការងារ')}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {t('dashboard.contractExpirations')} & {t('dashboard.probationReviews')}
            </p>
          </div>
          <Link
            to="/employees"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{t('dashboard.employeeDirectory')}</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Expiring Contracts */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-semibold text-foreground">
                    {t('dashboard.contractExpirations')}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    {t('dashboard.contractExpirySubtitle')}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] h-5 px-1.5 font-medium bg-muted text-muted-foreground border-0">
                  {expiringContractsList.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-1 flex-1">
              {expiringContractsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-muted-foreground/30 mb-2" />
                  <p>{t('dashboard.noExpiringContracts', 'គ្មានកិច្ចសន្យាជិតផុតកំណត់ទេ')}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {expiringContractsList.slice(0, 4).map((emp: any) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between py-2.5 px-1 text-xs hover:bg-muted/30 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-7 w-7 shrink-0 border border-border/50">
                          <AvatarImage src={emp.avatar_url} />
                          <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
                            {emp.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground text-xs truncate">{emp.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {emp.position} • {emp.department}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-[11px] font-mono font-medium ${
                          emp.days_remaining <= 30
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {emp.days_remaining <= 0
                          ? t('dashboard.overdue')
                          : t('dashboard.daysLeft', { count: emp.days_remaining })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-border/50 p-3 px-4">
              <Link
                to="/employees"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-between w-full transition-colors"
              >
                <span>{t('dashboard.manageContracts')}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardFooter>
          </Card>

          {/* Card 2: Probation Reviews */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-semibold text-foreground">
                    {t('dashboard.probationReviews')}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    {t('dashboard.probationReviewSubtitle')}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] h-5 px-1.5 font-medium bg-muted text-muted-foreground border-0">
                  {probationReviewsList.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-1 flex-1">
              {probationReviewsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-muted-foreground/30 mb-2" />
                  <p>{t('dashboard.noProbationReviews', 'គ្មានបុគ្គលិកសាកល្បងការងារទេ')}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {probationReviewsList.slice(0, 4).map((emp: any) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between py-2.5 px-1 text-xs hover:bg-muted/30 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-7 w-7 shrink-0 border border-border/50">
                          <AvatarImage src={emp.avatar_url} />
                          <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
                            {emp.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground text-xs truncate">{emp.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {emp.position} • {emp.department}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] font-mono font-medium text-muted-foreground">
                        {t('dashboard.daysLeft', { count: emp.days_remaining })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-border/50 p-3 px-4">
              <Link
                to="/employees"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-between w-full transition-colors"
              >
                <span>{t('dashboard.evaluateProbation')}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardFooter>
          </Card>

          {/* Card 3: New Joiners */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-semibold text-foreground">
                    {t('dashboard.newJoiners')}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    {t('dashboard.newJoinersSubtitle')}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] h-5 px-1.5 font-medium bg-muted text-muted-foreground border-0">
                  {newJoinersList.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-1 flex-1">
              {newJoinersList.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <Users className="mx-auto h-5 w-5 text-muted-foreground/30 mb-2" />
                  <p>{t('dashboard.noNewJoiners', 'គ្មានបុគ្គលិកទើបចូលថ្មីទេ')}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {newJoinersList.slice(0, 4).map((emp: any) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between py-2.5 px-1 text-xs hover:bg-muted/30 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-7 w-7 shrink-0 border border-border/50">
                          <AvatarImage src={emp.avatar_url} />
                          <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
                            {emp.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground text-xs truncate">{emp.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {emp.position} • {emp.department}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] font-mono text-muted-foreground">
                        {emp.join_date}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-border/50 p-3 px-4">
              <Link
                to="/employees/create"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-between w-full transition-colors cursor-pointer"
              >
                <span>+ {t('employees.addEmployee')}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* 6. COMPANY PULSE, NOTICES & CALENDAR (Announcements, Holidays, Birthdays) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {t('dashboard.companyPulse', 'ដំណឹងស្ថាប័ន & ប្រតិទិន')}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {t('dashboard.latestAnnouncements')} & {t('dashboard.publicHolidays')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Official Announcements */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-semibold text-foreground">
                    {t('dashboard.companyNotice')}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    {t('dashboard.latestAnnouncements')}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] h-5 px-1.5 font-medium bg-muted text-muted-foreground border-0">
                  {announcementsList.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-1 flex-1">
              {announcementsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <BellOff className="mx-auto h-5 w-5 text-muted-foreground/30 mb-2" />
                  <p>{t('dashboard.noAnnouncements', 'គ្មានសេចក្តីប្រកាសព័ត៌មានទេ')}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {announcementsList.slice(0, 3).map((item: any, i: number) => (
                    <div
                      key={item.id || i}
                      className="py-2.5 px-1 text-xs hover:bg-muted/30 rounded-md transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground text-xs truncate">
                          {item.title}
                        </span>
                        {item.priority === 'high' && (
                          <span className="shrink-0 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                            {t('dashboard.urgentPriority')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                      <div className="text-[10px] text-muted-foreground/70 font-mono">
                        {formatDate(item.published_at || new Date().toISOString())}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-border/50 p-3 px-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">{t('dashboard.noticeBoard')}</span>
              <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-0.5">
                <span>{t('dashboard.allNotices')}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </CardFooter>
          </Card>

          {/* Card 2: Upcoming Public Holidays */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-semibold text-foreground">
                    {t('dashboard.publicHolidays')}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    {t('dashboard.holidayCalendarSubtitle')}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] h-5 px-1.5 font-medium bg-muted text-muted-foreground border-0">
                  {holidaysList.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-1 flex-1">
              {holidaysList.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <Calendar className="mx-auto h-5 w-5 text-muted-foreground/30 mb-2" />
                  <p>{t('dashboard.noHolidays', 'គ្មានថ្ងៃឈប់សម្រាកខាងមុខទេ')}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {holidaysList.slice(0, 4).map((item: any, i: number) => {
                    const hDate = new Date(item.date);
                    const monthName = !isNaN(hDate.getTime())
                      ? hDate.toLocaleDateString('en-US', { month: 'short' })
                      : item.month || 'Nov';
                    const dayNum = !isNaN(hDate.getTime())
                      ? hDate.toLocaleDateString('en-US', { day: '2-digit' })
                      : item.day || '01';

                    return (
                      <div
                        key={item.id || i}
                        className="flex items-center gap-3 py-2.5 px-1 text-xs hover:bg-muted/30 rounded-md transition-colors"
                      >
                        <div className="flex h-8 w-11 shrink-0 flex-col items-center justify-center rounded border border-border/60 bg-muted/40 font-mono">
                          <span className="uppercase text-[9px] font-bold text-muted-foreground leading-none">{monthName}</span>
                          <span className="text-xs font-bold text-foreground leading-none mt-0.5">{dayNum}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground text-xs truncate">{item.name}</div>
                          <div className="text-[11px] text-muted-foreground">{t('dashboard.officialHoliday')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-border/50 p-3 px-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">{t('dashboard.officialCalendar')}</span>
              <Link to="/attendance" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
                <span>{t('dashboard.allHolidays')}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardFooter>
          </Card>

          {/* Card 3: Upcoming Birthdays */}
          <Card className="rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-semibold text-foreground">
                    {t('dashboard.upcomingBirthdaysTitle')}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    {t('dashboard.birthdayCelebrationSubtitle')}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] h-5 px-1.5 font-medium bg-muted text-muted-foreground border-0">
                  {birthdaysList.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-1 flex-1">
              {birthdaysList.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <Cake className="mx-auto h-5 w-5 text-muted-foreground/30 mb-2" />
                  <p>{t('dashboard.noBirthdays', 'គ្មានខួបកំណើតក្នុងពេលឆាប់ៗទេ')}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {birthdaysList.slice(0, 4).map((item: any, i: number) => (
                    <div
                      key={item.id || i}
                      className="flex items-center justify-between py-2.5 px-1 text-xs hover:bg-muted/30 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-7 w-7 shrink-0 border border-border/50">
                          <AvatarImage src={item.avatar_url} />
                          <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
                            {item.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground text-xs truncate">{item.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {item.department || t('dashboard.activeWorkforce')}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] font-mono text-muted-foreground">
                        {item.date_of_birth}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-border/50 p-3 px-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">{t('dashboard.wishHappyBirthday')}</span>
              <span className="text-[11px] text-muted-foreground font-medium">{t('dashboard.celebrationBadge')}</span>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* QUICK ADD EMPLOYEE MODAL */}
      <Dialog open={addEmployeeModalOpen} onOpenChange={setAddEmployeeModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <form onSubmit={handleQuickAddEmployee}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {t('dashboard.onboardNewEmployee')}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t('dashboard.createProfileAssignment')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div>
                <label className="font-semibold text-foreground">{t('dashboard.fullName')}</label>
                <Input
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder={t('dashboard.namePlaceholder')}
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">{t('dashboard.workEmail')}</label>
                <Input
                  type="email"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  placeholder={t('dashboard.emailPlaceholder')}
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">{t('dashboard.department')}</label>
                  <select
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none"
                  >
                    {rawDepartments.map((dept: any) => (
                      <option key={dept.id || dept.name} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-foreground">{t('dashboard.position')}</label>
                  <select
                    value={empPosition}
                    onChange={(e) => setEmpPosition(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none"
                  >
                    <option value="Specialist">{t('dashboard.selectPosition')}</option>
                    <option value="Doctor">វេជ្ជបណ្ឌិត / Medical Doctor</option>
                    <option value="Nurse">គិលានុបដ្ឋាក / Nurse</option>
                    <option value="Pharmacist">ឱសថការី / Pharmacist</option>
                    <option value="HR Specialist">រដ្ឋបាល & បុគ្គលិក / HR</option>
                    <option value="IT Specialist">បច្ចេកវិទ្យាព័ត៌មាន / IT</option>
                    <option value="Accountant">គណនេយ្យ / Accountant</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddEmployeeModalOpen(false)}
                className="text-xs"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#bbf451] hover:bg-[#b6d55c] text-[#102f32] font-semibold text-xs shadow-xs"
              >
                {t('dashboard.completeOnboarding')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
