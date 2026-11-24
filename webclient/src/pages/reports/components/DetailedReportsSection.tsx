import React, { useState, useMemo } from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, Column } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { RecordDetailModal } from './RecordDetailModal';
import {
  FileText,
  CalendarCheck,
  CalendarDays,
  Users,
  Clock,
  Building2,
  CreditCard,
  Search,
  Download,
  Eye,
  X,
  RotateCcw,
  Calendar,
  Briefcase,
  Phone,
  ArrowRight,
} from 'lucide-react';
import type { DetailedRecordsResponse } from '@/services/reportService';

export interface DetailedReportsSectionProps {
  category: 'attendance' | 'leave' | 'employee' | 'shift' | 'department' | 'payroll';
  setCategory: (cat: 'attendance' | 'leave' | 'employee' | 'shift' | 'department' | 'payroll') => void;
  recordsData?: DetailedRecordsResponse;
  isLoading?: boolean;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  page: number;
  setPage: (p: number) => void;
  perPage: number;
  setPerPage: (pp: number) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  onExport: () => void;
  canViewPayroll?: boolean;
}

// ─── Avatar Initials & Color Helper ───────────────────────────────────────────
const getInitials = (name?: string): string => {
  if (!name) return 'SS';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getAvatarBg = (idStr: string = '') => {
  const colors = [
    'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 ring-teal-200/60 dark:ring-teal-800/60',
    'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-blue-200/60 dark:ring-blue-800/60',
    'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 ring-indigo-200/60 dark:ring-indigo-800/60',
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-emerald-200/60 dark:ring-emerald-800/60',
    'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 ring-sky-200/60 dark:ring-sky-800/60',
    'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 ring-violet-200/60 dark:ring-violet-800/60',
    'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-amber-200/60 dark:ring-amber-800/60',
    'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 ring-rose-200/60 dark:ring-rose-800/60',
  ];
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const DetailedReportsSection: React.FC<DetailedReportsSectionProps> = ({
  category,
  setCategory,
  recordsData,
  isLoading = false,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  page,
  setPage,
  perPage,
  setPerPage,
  sortBy,
  sortDir,
  onSort,
  onExport,
  canViewPayroll = false,
}) => {
  const { t } = useLocaleStore();
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const getStatusText = (status: string) => {
    if (!status) return '—';
    const normalized = status.toLowerCase();
    const translated = t(`reports.status.${normalized}`);
    return translated || status;
  };

  const getGenderText = (gender?: string) => {
    if (!gender) return '—';
    const g = gender.toLowerCase();
    return t(`reports.genderMap.${g}`) || gender;
  };

  // Status Filter Options per category
  const statusOptions = useMemo(() => {
    switch (category) {
      case 'attendance':
        return [
          { value: 'all', label: t('common.all', 'ទាំងអស់') },
          { value: 'present', label: t('reports.status.present', 'មានវត្តមាន'), dotColor: 'bg-emerald-500' },
          { value: 'late', label: t('reports.status.late', 'មកយឺត'), dotColor: 'bg-amber-500' },
          { value: 'absent', label: t('reports.status.absent', 'អវត្តមាន'), dotColor: 'bg-rose-500' },
          { value: 'on_leave', label: t('reports.status.on_leave', 'ច្បាប់ឈប់'), dotColor: 'bg-purple-500' },
        ];
      case 'leave':
        return [
          { value: 'all', label: t('common.all', 'ទាំងអស់') },
          { value: 'approved', label: t('reports.status.approved', 'បានអនុម័ត'), dotColor: 'bg-emerald-500' },
          { value: 'pending_supervisor', label: t('reports.status.pending_supervisor', 'រង់ចាំប្រធាន'), dotColor: 'bg-amber-500' },
          { value: 'pending_hr', label: t('reports.status.pending_hr', 'រង់ចាំ HR'), dotColor: 'bg-amber-500' },
          { value: 'rejected', label: t('reports.status.rejected', 'បដិសេធ'), dotColor: 'bg-rose-500' },
        ];
      case 'employee':
        return [
          { value: 'all', label: t('common.all', 'ទាំងអស់') },
          { value: 'active', label: t('reports.status.active', 'សកម្ម'), dotColor: 'bg-emerald-500' },
          { value: 'probation', label: t('reports.status.probation', 'សាកល្បង'), dotColor: 'bg-amber-500' },
          { value: 'inactive', label: t('reports.status.inactive', 'អសកម្ម'), dotColor: 'bg-slate-400' },
        ];
      default:
        return [];
    }
  }, [category, t]);

  const hasActiveFilters = Boolean(search || (statusFilter && statusFilter !== 'all'));

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // Render Modern Status Badge
  const renderStatusBadge = (status: string) => {
    if (!status) return <span className="text-muted-foreground/40 font-mono text-xs">—</span>;
    const s = status.toLowerCase();

    if (s === 'present' || s === 'active' || s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{getStatusText(status)}</span>
        </span>
      );
    }

    if (s === 'late' || s.startsWith('pending') || s === 'probation') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>{getStatusText(status)}</span>
        </span>
      );
    }

    if (s === 'absent' || s === 'rejected' || s === 'terminated') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{getStatusText(status)}</span>
        </span>
      );
    }

    if (s === 'on_leave' || s === 'leave') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
          <span>{getStatusText(status)}</span>
        </span>
      );
    }

    if (s === 'half_day') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
          <span>{getStatusText(status)}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
        <span>{getStatusText(status)}</span>
      </span>
    );
  };

  // 1. Attendance Columns
  const attendanceColumns: Column<any>[] = [
    {
      key: 'employee_code',
      title: t('reports.tables.employeeId'),
      width: '110px',
      sortable: true,
      render: (_, r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 tracking-tight">
          {r.employee_code}
        </span>
      ),
    },
    {
      key: 'employee_name',
      title: t('reports.tables.employeeName'),
      width: '200px',
      sortable: true,
      render: (_, r) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-8 w-8 rounded-full ring-1 ring-border/60 shrink-0">
            <AvatarImage src={r.avatar_url} />
            <AvatarFallback className={`text-[11px] font-bold ${getAvatarBg(r.employee_name || r.employee_code)}`}>
              {getInitials(r.employee_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex flex-col">
            <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
              {r.employee_name}
            </span>
            {r.position && (
              <span className="text-[11px] text-muted-foreground/80 leading-tight truncate">
                {r.position}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      title: t('reports.tables.department'),
      width: '150px',
      render: (_, r) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          <span className="truncate max-w-[130px] font-medium">{r.department}</span>
        </div>
      ),
    },
    {
      key: 'date',
      title: t('reports.tables.date'),
      width: '115px',
      sortable: true,
      render: (_, r) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-slate-400">
          <Calendar className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          <span>{r.date}</span>
        </div>
      ),
    },
    {
      key: 'shift_name',
      title: t('reports.tables.shift'),
      width: '170px',
      render: (_, r) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/40 text-[11px] text-muted-foreground font-medium border border-border/40 truncate max-w-[155px]">
          <Clock className="h-2.5 w-2.5 text-muted-foreground/60 shrink-0" />
          <span className="truncate">{r.shift_name}</span>
        </span>
      ),
    },
    {
      key: 'check_in',
      title: t('reports.tables.checkIn'),
      width: '95px',
      sortable: true,
      render: (_, r) =>
        r.check_in && r.check_in !== '—' ? (
          <div className="flex items-center gap-1 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{r.check_in}</span>
          </div>
        ) : (
          <span className="font-mono text-xs text-muted-foreground/40">—</span>
        ),
    },
    {
      key: 'check_out',
      title: t('reports.tables.checkOut'),
      width: '95px',
      render: (_, r) =>
        r.check_out && r.check_out !== '—' ? (
          <div className="flex items-center gap-1 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span>{r.check_out}</span>
          </div>
        ) : (
          <span className="font-mono text-xs text-muted-foreground/40">—</span>
        ),
    },
    {
      key: 'working_hours',
      title: t('reports.tables.workingHours'),
      width: '110px',
      sortable: true,
      render: (_, r) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-foreground">
            {r.working_hours && r.working_hours !== '—' ? r.working_hours : <span className="text-muted-foreground/40">—</span>}
          </span>
          {r.overtime_hours && r.overtime_hours !== '—' && (
            <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-200/50">
              {r.overtime_hours}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: t('reports.tables.status'),
      width: '110px',
      sortable: true,
      render: (_, r) => renderStatusBadge(r.status),
    },
    {
      key: 'actions',
      title: '',
      width: '50px',
      align: 'right',
      render: (_, r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord(r);
          }}
          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title={t('reports.tables.viewDetails')}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  // 2. Leave Columns
  const leaveColumns: Column<any>[] = [
    {
      key: 'employee_code',
      title: t('reports.tables.employeeId'),
      width: '110px',
      sortable: true,
      render: (_, r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 tracking-tight">
          {r.employee_code}
        </span>
      ),
    },
    {
      key: 'employee_name',
      title: t('reports.tables.employeeName'),
      width: '200px',
      sortable: true,
      render: (_, r) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-8 w-8 rounded-full ring-1 ring-border/60 shrink-0">
            <AvatarImage src={r.avatar_url} />
            <AvatarFallback className={`text-[11px] font-bold ${getAvatarBg(r.employee_name || r.employee_code)}`}>
              {getInitials(r.employee_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex flex-col">
            <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
              {r.employee_name}
            </span>
            <span className="text-[11px] text-muted-foreground/80 leading-tight truncate">
              {r.department}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'leave_type',
      title: t('reports.tables.leaveType'),
      width: '160px',
      render: (_, r) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary/5 text-primary text-xs font-semibold border border-primary/20">
          <FileText className="h-3 w-3 shrink-0" />
          <span className="truncate">{r.leave_type}</span>
        </span>
      ),
    },
    {
      key: 'date_range',
      title: `${t('reports.tables.startDate')} → ${t('reports.tables.endDate')}`,
      width: '200px',
      sortable: true,
      render: (_, r) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          <span>{r.start_date}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
          <span>{r.end_date}</span>
        </div>
      ),
    },
    {
      key: 'total_days',
      title: t('reports.tables.totalDays'),
      width: '100px',
      sortable: true,
      render: (_, r) => (
        <Badge variant="secondary" className="font-mono text-xs font-semibold">
          {r.total_days} {t('reports.modal.days', 'ថ្ងៃ')}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: t('reports.tables.status'),
      width: '130px',
      sortable: true,
      render: (_, r) => renderStatusBadge(r.status),
    },
    {
      key: 'actions',
      title: '',
      width: '50px',
      align: 'right',
      render: (_, r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord(r);
          }}
          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title={t('reports.tables.viewDetails')}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  // 3. Employee Columns
  const employeeColumns: Column<any>[] = [
    {
      key: 'employee_code',
      title: t('reports.tables.employeeId'),
      width: '110px',
      sortable: true,
      render: (_, r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 tracking-tight">
          {r.employee_code}
        </span>
      ),
    },
    {
      key: 'employee_name',
      title: t('reports.tables.employeeName'),
      width: '200px',
      sortable: true,
      render: (_, r) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-8 w-8 rounded-full ring-1 ring-border/60 shrink-0">
            <AvatarImage src={r.avatar_url} />
            <AvatarFallback className={`text-[11px] font-bold ${getAvatarBg(r.employee_name || r.employee_code)}`}>
              {getInitials(r.employee_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex flex-col">
            <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
              {r.employee_name}
            </span>
            <span className="text-[11px] text-muted-foreground/80 leading-tight truncate">
              {r.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      title: t('reports.tables.position'),
      width: '150px',
      render: (_, r) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <Briefcase className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          <span className="truncate">{r.position || '—'}</span>
        </div>
      ),
    },
    {
      key: 'department',
      title: t('reports.tables.department'),
      width: '140px',
      render: (_, r) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          <span className="truncate font-medium">{r.department}</span>
        </div>
      ),
    },
    {
      key: 'gender',
      title: t('reports.tables.gender'),
      width: '80px',
      render: (_, r) => (
        <span className="text-xs text-muted-foreground font-medium">
          {getGenderText(r.gender)}
        </span>
      ),
    },
    {
      key: 'phone',
      title: t('reports.tables.phone'),
      width: '120px',
      render: (_, r) => (
        <div className="flex items-center gap-1 font-mono text-xs text-slate-600 dark:text-slate-400">
          <Phone className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          <span>{r.phone}</span>
        </div>
      ),
    },
    {
      key: 'join_date',
      title: t('reports.tables.joinDate'),
      width: '110px',
      sortable: true,
      render: (_, r) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{r.join_date}</span>
      ),
    },
    {
      key: 'status',
      title: t('reports.tables.status'),
      width: '100px',
      sortable: true,
      render: (_, r) => renderStatusBadge(r.status),
    },
    {
      key: 'actions',
      title: '',
      width: '50px',
      align: 'right',
      render: (_, r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord(r);
          }}
          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title={t('reports.tables.viewDetails')}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  // 4. Shift Columns
  const shiftColumns: Column<any>[] = [
    {
      key: 'name',
      title: t('reports.tables.shiftName'),
      width: '180px',
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{r.name}</span>
          {r.is_overnight && (
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              {t('reports.shifts.nightDesc', 'សង្គ្រោះបន្ទាន់ពេញមួយយប់ (២៤/៧)')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'code',
      title: t('reports.tables.deptCode'),
      width: '100px',
      render: (_, r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 tracking-tight">
          {r.code}
        </span>
      ),
    },
    {
      key: 'time',
      title: `${t('reports.tables.startTime')} – ${t('reports.tables.endTime')}`,
      width: '150px',
      render: (_, r) => (
        <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
          <Clock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          <span>{r.start_time} – {r.end_time}</span>
        </div>
      ),
    },
    {
      key: 'break_minutes',
      title: t('reports.tables.breakMinutes'),
      width: '100px',
      render: (_, r) => (
        <span className="text-xs text-muted-foreground font-mono">{r.break_minutes}m</span>
      ),
    },
    {
      key: 'assigned_count',
      title: t('reports.tables.assignedCount'),
      width: '120px',
      render: (_, r) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Users className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
          <span className="font-mono">{r.assigned_count}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: t('reports.tables.status'),
      width: '100px',
      render: (_, r) => renderStatusBadge(r.status),
    },
  ];

  // 5. Department Columns
  const departmentColumns: Column<any>[] = [
    {
      key: 'code',
      title: t('reports.tables.deptCode'),
      width: '110px',
      render: (_, r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 tracking-tight">
          {r.code}
        </span>
      ),
    },
    {
      key: 'name',
      title: t('reports.tables.deptName'),
      width: '220px',
      render: (_, r) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-xs text-foreground">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'manager_name',
      title: t('reports.tables.manager'),
      width: '180px',
      render: (_, r) => (
        <span className="text-xs text-muted-foreground font-medium">{r.manager_name}</span>
      ),
    },
    {
      key: 'employee_count',
      title: t('reports.workforcePool'),
      width: '140px',
      render: (_, r) => (
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="font-semibold font-mono text-xs">
            {r.employee_count}
          </Badge>
          <span className="text-[11px] text-muted-foreground">{t('reports.charts.headcount', 'នាក់')}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: t('reports.tables.status'),
      width: '100px',
      render: (_, r) => renderStatusBadge(r.status),
    },
  ];

  // 6. Payroll Columns
  const payrollColumns: Column<any>[] = [
    {
      key: 'period',
      title: t('reports.tables.period'),
      width: '140px',
      render: (_, r) => <span className="font-semibold text-xs text-foreground">{r.period}</span>,
    },
    {
      key: 'total_gross',
      title: t('reports.tables.totalGross'),
      width: '140px',
      render: (_, r) => (
        <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
          ${r.total_gross?.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'total_deductions',
      title: t('reports.tables.totalDeductions'),
      width: '140px',
      render: (_, r) => (
        <span className="font-mono text-xs text-rose-500 font-medium">
          -${r.total_deductions?.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'total_net',
      title: t('reports.tables.totalNet'),
      width: '140px',
      render: (_, r) => (
        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
          ${r.total_net?.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      title: t('reports.tables.status'),
      width: '110px',
      render: (_, r) => renderStatusBadge(r.status),
    },
  ];

  const currentColumns =
    category === 'attendance'
      ? attendanceColumns
      : category === 'leave'
      ? leaveColumns
      : category === 'employee'
      ? employeeColumns
      : category === 'shift'
      ? shiftColumns
      : category === 'department'
      ? departmentColumns
      : payrollColumns;

  return (
    <Card className="rounded-2xl border-border/70 shadow-xs bg-card overflow-hidden">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="p-5 md:p-6 pb-4 border-b border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground tracking-tight">
                {t('reports.sections.detailed')}
              </h3>
              <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5 font-semibold">
                {recordsData?.total ?? 0}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('reports.sections.detailedSubtitle')}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8.5 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t('reports.resetFilters', 'កំណត់ឡើងវិញ')}</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-8.5 px-3.5 rounded-xl border-border/80 text-xs font-medium gap-2 shadow-2xs hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>{t('reports.exportMasterCsv')}</span>
          </Button>
        </div>
      </div>

      {/* ── Interactive Filter & Search Bar (Dropdown Category Selector - No Submenu) ────────────────── */}
      <div className="p-5 md:p-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-muted/15 border-b border-border/40">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Category Dropdown (Replaces Submenu Tabs) */}
          <Select
            value={category}
            onValueChange={(val: any) => {
              setCategory(val);
              setPage(1);
              setSearch('');
              setStatusFilter('all');
            }}
          >
            <SelectTrigger className="h-9 w-[190px] rounded-xl text-xs font-semibold bg-background border-border/80 shadow-2xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg">
              <SelectItem value="attendance" className="text-xs font-medium py-2">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{t('reports.tables.tabAttendance', 'កំណត់ត្រាវត្តមាន')}</span>
                </div>
              </SelectItem>
              <SelectItem value="leave" className="text-xs font-medium py-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 text-purple-500" />
                  <span>{t('reports.tables.tabLeaves', 'សំណើសុំច្បាប់')}</span>
                </div>
              </SelectItem>
              <SelectItem value="employee" className="text-xs font-medium py-2">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span>{t('reports.tables.tabEmployees', 'បញ្ជីបុគ្គលិក')}</span>
                </div>
              </SelectItem>
              <SelectItem value="shift" className="text-xs font-medium py-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{t('reports.tables.tabShifts', 'វេនការងារ')}</span>
                </div>
              </SelectItem>
              <SelectItem value="department" className="text-xs font-medium py-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span>{t('reports.tables.tabDepartments', 'ដេប៉ាតឺម៉ង់')}</span>
                </div>
              </SelectItem>
              {canViewPayroll && (
                <SelectItem value="payroll" className="text-xs font-medium py-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{t('reports.tables.tabPayroll', 'ប្រាក់បៀវត្សរ៍')}</span>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              type="text"
              placeholder={t('reports.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-8.5 pr-8 text-xs rounded-xl border-border/80 bg-background focus:bg-background transition-colors"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Status Filter Chips */}
        {statusOptions.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {statusOptions.map((opt) => {
              const isSelected = (statusFilter || 'all') === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-foreground text-background shadow-xs font-semibold'
                      : 'bg-background text-muted-foreground hover:text-foreground border border-border/70 hover:border-border'
                  }`}
                >
                  {opt.dotColor && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-primary-foreground' : opt.dotColor
                      }`}
                    />
                  )}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Table Container ────────────────────────────────── */}
      <div className="p-5 md:p-6 pt-4 pb-2">
        <DataTable
          columns={currentColumns}
          data={recordsData?.data || []}
          loading={isLoading}
          sortKey={sortBy}
          sortDir={sortDir}
          onSort={onSort}
          onRowClick={(row) => setSelectedRecord(row)}
          emptyText={t('reports.tables.emptyRecords')}
          className="border-border/60 rounded-xl"
          rowClassName={() => 'group hover:bg-primary/[0.02] dark:hover:bg-primary/[0.04] transition-colors'}
        />
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {recordsData && recordsData.total > 0 && (
        <Pagination
          currentPage={recordsData.current_page}
          totalPages={recordsData.last_page}
          totalItems={recordsData.total}
          perPage={recordsData.per_page}
          onPageChange={(p) => setPage(p)}
          onPerPageChange={(pp) => {
            setPerPage(pp);
            setPage(1);
          }}
          isLoading={isLoading}
          className="border-t border-border/50 px-5 md:px-6"
        />
      )}

      {/* ── Detail Modal ───────────────────────────────────── */}
      <RecordDetailModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        category={category}
      />
    </Card>
  );
};

export default DetailedReportsSection;
