import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User,
  QrCode,
  CalendarDays,
  Clock,
  FileText,
  KeyRound,
  LogOut,
  Menu,
  X,
  Plus,
  Download,
  CheckCircle2,
  Loader2,
  LogIn,
  RefreshCw,
  Building2,
  Calendar,
  Ban,
  ShieldCheck,
  CalendarCheck2,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  ChevronRight,
  IdCard,
  UserCheck,
  Award,
  AlertCircle,
  Check,
  Activity,
  History,
  LayoutDashboard,
  Pencil,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import { employeeService } from '@/services/employeeService';
import { qrAttendanceService } from '@/services/qrAttendanceService';
import { attendanceService } from '@/services/attendanceService';
import { leaveService } from '@/services/leaveService';
import { authService } from '@/services/authService';
import {
  HeaderActionsGroup,
  AddButton,
  ActionButton,
  RefreshButton,
  RowActionGroup,
  RowActionButton,
} from '@/components/common/GlobalActionButtons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { QrAttendanceModal } from './components/QrAttendanceModal';
import { LeaveRequestModal } from './components/LeaveRequestModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { EditProfileModal } from '@/components/profile/EditProfileModal';

// Helpers
function formatDateKh(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatTimeShort(value?: string | null): string {
  if (!value) return '—';
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return value.slice(0, 5);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatGenderKh(gender?: string | null): string {
  const g = String(gender || '').toLowerCase();
  if (g === 'male' || g === 'm') return 'ប្រុស';
  if (g === 'female' || g === 'f') return 'ស្រី';
  return gender || '—';
}

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info'
  | 'purple';

function getEmploymentStatusBadge(status?: string | null): { label: string; variant: BadgeVariant } {
  const s = String(status || 'active').toLowerCase();
  if (s === 'active') return { label: 'កំពុងបម្រើការងារ', variant: 'success' };
  if (s === 'probation') return { label: 'សាកល្បងការងារ', variant: 'warning' };
  if (s === 'suspended') return { label: 'ផ្អាកបណ្តោះអាសន្ន', variant: 'destructive' };
  if (s === 'resigned') return { label: 'លាឈប់', variant: 'secondary' };
  if (s === 'terminated') return { label: 'បញ្ឈប់', variant: 'destructive' };
  return { label: status || 'សកម្ម', variant: 'success' };
}

function getLeaveStatusBadge(status?: string | null): { label: string; variant: BadgeVariant } {
  const s = String(status || '').toLowerCase();
  if (s === 'approved') return { label: 'បានអនុម័ត', variant: 'success' };
  if (s === 'rejected') return { label: 'បានបដិសេធ', variant: 'destructive' };
  if (s === 'cancelled') return { label: 'បានបោះបង់', variant: 'secondary' };
  if (s === 'pending_hr') return { label: 'រង់ចាំធនធានមនុស្សអនុម័ត', variant: 'info' };
  return { label: 'រង់ចាំការអនុម័ត', variant: 'warning' };
}

function getAttendanceStatusBadge(status?: string | null): { label: string; variant: BadgeVariant } {
  const s = String(status || '').toLowerCase();
  if (s === 'present') return { label: 'មកទាន់ពេល', variant: 'success' };
  if (s === 'late') return { label: 'មកយឺត', variant: 'warning' };
  if (s === 'half_day' || s === 'half day') return { label: 'កន្លះថ្ងៃ', variant: 'info' };
  if (s === 'on_leave' || s === 'on leave') return { label: 'ច្បាប់ឈប់សម្រាក', variant: 'purple' };
  if (s === 'absent') return { label: 'អវត្តមាន', variant: 'destructive' };
  return { label: status || '—', variant: 'secondary' };
}

function translateRoleKh(role?: string | null): string {
  const r = String(role || '').toLowerCase();
  if (r === 'super admin' || r === 'super_admin') return 'អ្នកគ្រប់គ្រងជាន់ខ្ពស់';
  if (r === 'hr manager' || r === 'hr_manager') return 'ប្រធានធនធានមនុស្ស';
  if (r === 'hr staff' || r === 'hr_staff') return 'បុគ្គលិកធនធានមនុស្ស';
  if (r === 'department manager' || r === 'department_manager') return 'ប្រធានផ្នែក';
  if (r === 'accountant') return 'គណនេយ្យករ';
  if (r === 'doctor') return 'វេជ្ជបណ្ឌិត';
  if (r === 'nurse') return 'គិលានុបដ្ឋាយិកា';
  if (r === 'pharmacist') return 'ឱសថការី';
  if (r === 'technician') return 'អ្នកបច្ចេកទេស';
  if (r === 'employee') return 'បុគ្គលិកទូទៅ';
  return role || 'បុគ្គលិក';
}

function translateShiftCodeKh(code?: string | null): string {
  if (!code) return 'វេនស្តង់ដារ';
  const c = code.toUpperCase();
  if (c.includes('STD')) return 'វេនស្តង់ដារ';
  if (c.includes('FLEX')) return 'វេនបត់បែន';
  if (c.includes('NIGHT')) return 'វេនយប់';
  if (c.includes('MORNING')) return 'វេនព្រឹក';
  if (c.includes('AFTERNOON')) return 'វេនរសៀល';
  return code;
}

function translateShiftNameKh(name?: string | null): string {
  if (!name) return 'ម៉ោងការិយាល័យស្តង់ដារ';
  if (name.includes('Standard Office Hours') || name.includes('Standard')) return 'ម៉ោងការិយាល័យស្តង់ដារ';
  if (name.includes('Engineering Flex Shift') || name.includes('Flex')) return 'វេនបត់បែនផ្នែកវិស្វកម្ម';
  return name;
}

function translateMethodKh(method?: string | null): string {
  const m = String(method || '').toLowerCase();
  if (m === 'qr') return 'ស្កេនកូដ QR';
  if (m === 'manual') return 'បញ្ចូលដោយដៃ';
  if (m === 'facial' || m === 'face') return 'ស្កេនផ្ទៃមុខ';
  if (m === 'rfid' || m === 'card') return 'កាត RFID';
  if (m === 'web') return 'ប្រព័ន្ធវេបសាយ';
  if (m === 'mobile') return 'ទូរស័ព្ទដៃ';
  return method || 'ធម្មតា';
}

function translateEmploymentTypeKh(type?: string | null): string {
  const t = String(type || '').trim().toLowerCase();
  if (t === 'ពេញលេញ' || t.includes('full') || t.includes('time')) return 'ពេញម៉ោង';
  if (t.includes('part')) return 'ក្រៅម៉ោង';
  if (t.includes('contract')) return 'កិច្ចសន្យា';
  if (t.includes('probation')) return 'សាកល្បងការងារ';
  if (t.includes('intern')) return 'កម្មសិក្សា';
  return type || 'ពេញម៉ោង';
}

function translateDocCategoryKh(cat?: string | null): string {
  const c = String(cat || '').toLowerCase();
  if (c.includes('contract')) return 'កិច្ចសន្យាការងារ';
  if (c.includes('cert')) return 'វិញ្ញាបនបត្រ';
  if (c.includes('id') || c.includes('national')) return 'អត្តសញ្ញាណប័ណ្ណ';
  if (c.includes('cv') || c.includes('resume')) return 'ប្រវត្តិរូបសង្ខេប';
  return cat || 'ឯកសារទូទៅ';
}

function formatSpecializationOrBloodKh(val?: string | null): string {
  if (!val) return '';
  if (['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(val)) {
    return `ក្រុមឈាម ${val}`;
  }
  return val;
}

export const EmployeePortalPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { locale, setLocale } = useLocaleStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Modals
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalTab, setQrModalTab] = useState<'scan' | 'card'>('scan');
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);

  // Filters
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const employeeId = user?.employee?.id;

  // 1. Fresh Auth/Me
  const { data: meData } = useQuery({
    queryKey: ['portal-auth-me'],
    queryFn: async () => {
      const res = await authService.me();
      return (res as any)?.data || res;
    },
    staleTime: 60_000,
  });

  const resolvedEmployeeId = employeeId || meData?.employee?.id || meData?.user?.employee?.id;

  // 2. Full Employee Detail
  const {
    data: employeeDetail,
    isLoading: loadingProfile,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['portal-employee-detail', resolvedEmployeeId],
    queryFn: async () => {
      if (!resolvedEmployeeId) return null;
      return await employeeService.getEmployeeById(resolvedEmployeeId);
    },
    enabled: Boolean(resolvedEmployeeId),
  });

  // 3. Today's Attendance & Active Shift
  const { data: todayAttendance, refetch: refetchToday } = useQuery({
    queryKey: ['portal-attendance-today'],
    queryFn: async () => {
      try {
        return await qrAttendanceService.getEmployeeToday();
      } catch {
        return await attendanceService.getToday();
      }
    },
  });

  // 4. Employee's Own Attendance History
  const { data: attendanceHistoryRaw, refetch: refetchHistory } = useQuery({
    queryKey: ['portal-attendance-history', resolvedEmployeeId],
    queryFn: async () => {
      try {
        const res = await qrAttendanceService.getEmployeeHistory({ per_page: 60 });
        return Array.isArray(res) ? res : res?.data || [];
      } catch {
        if (!resolvedEmployeeId) return [];
        return await attendanceService.getRecords({
          employee_id: resolvedEmployeeId,
          per_page: 60,
        });
      }
    },
    enabled: Boolean(resolvedEmployeeId),
  });

  // 5. Personal QR Details
  const { data: qrDetails } = useQuery({
    queryKey: ['portal-employee-qr', resolvedEmployeeId],
    queryFn: async () => {
      if (!resolvedEmployeeId) return null;
      try {
        return await qrAttendanceService.getEmployeeQr(resolvedEmployeeId);
      } catch {
        return null;
      }
    },
    enabled: Boolean(resolvedEmployeeId),
  });

  // 6. Leave Types, Personal Balances & Personal Requests (strictly scoped to resolvedEmployeeId)
  const { data: leaveTypesRaw } = useQuery({
    queryKey: ['portal-leave-types'],
    queryFn: async () => {
      const res = await leaveService.getTypes();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const { data: leaveBalancesRaw, refetch: refetchBalances } = useQuery({
    queryKey: ['portal-leave-balances', resolvedEmployeeId],
    queryFn: async () => {
      const res = await leaveService.getRawBalances({ employee_id: resolvedEmployeeId });
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: Boolean(resolvedEmployeeId),
  });

  const { data: leaveRequestsRaw, refetch: refetchLeaves } = useQuery({
    queryKey: ['portal-leave-requests', resolvedEmployeeId],
    queryFn: async () => {
      const res = await leaveService.getRawRequests({
        employee_id: resolvedEmployeeId,
        per_page: 50,
      });
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: Boolean(resolvedEmployeeId),
  });

  // 7. Shifts & Holidays
  const { data: shiftsRaw } = useQuery({
    queryKey: ['portal-shifts'],
    queryFn: async () => {
      const res = await attendanceService.getShifts();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const { data: holidaysRaw } = useQuery({
    queryKey: ['portal-holidays'],
    queryFn: async () => {
      try {
        const res = await attendanceService.getHolidays();
        return Array.isArray(res) ? res : res?.data || [];
      } catch {
        return [];
      }
    },
  });

  const refreshAll = useCallback(async () => {
    try {
      await Promise.allSettled([
        refetchToday(),
        refetchHistory(),
        refetchBalances(),
        refetchLeaves(),
        refetchProfile(),
        queryClient.invalidateQueries({ queryKey: ['portal-attendance-today'] }),
      ]);
      toast.success('បានផ្ទុកទិន្នន័យថ្មីឡើងវិញដោយជោគជ័យ');
    } catch {
      toast.error('មិនអាចផ្ទុកទិន្នន័យឡើងវិញបានទេ');
    }
  }, [refetchToday, refetchHistory, refetchBalances, refetchLeaves, refetchProfile, queryClient]);

  // Normalized values
  const emp = employeeDetail || user?.employee || {};
  const primaryAssignment =
    emp?.primary_assignment || emp?.primaryAssignment || user?.employee?.primary_assignment;
  const fullName =
    emp?.full_name ||
    [emp?.first_name, emp?.last_name].filter(Boolean).join(' ') ||
    user?.name ||
    'បុគ្គលិក';
  const empCode = emp?.employee_code || user?.employee?.employee_code || '—';
  const departmentName = primaryAssignment?.department?.name || '—';
  const positionTitle = primaryAssignment?.position?.title || '—';
  const workLocationName =
    primaryAssignment?.work_location?.name ||
    primaryAssignment?.workLocation?.name ||
    'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ';
  const employmentTypeName = translateEmploymentTypeKh(
    primaryAssignment?.employment_type?.name ||
    primaryAssignment?.employmentType?.name ||
    'ពេញម៉ោង'
  );
  const supervisorObj = primaryAssignment?.supervisor;
  const supervisorName = supervisorObj
    ? supervisorObj.full_name ||
      [supervisorObj.first_name, supervisorObj.last_name].filter(Boolean).join(' ')
    : '—';
  const emergencyContact = Array.isArray(emp?.emergency_contacts || emp?.emergencyContacts)
    ? (emp.emergency_contacts || emp.emergencyContacts)[0]
    : null;
  const documents = Array.isArray(emp?.documents) ? emp.documents : [];

  const attendanceRecords: any[] = Array.isArray(attendanceHistoryRaw) ? attendanceHistoryRaw : [];
  const leaveTypes: any[] = Array.isArray(leaveTypesRaw) ? leaveTypesRaw : [];
  const leaveBalances: any[] = Array.isArray(leaveBalancesRaw) ? leaveBalancesRaw : [];
  const leaveRequests: any[] = Array.isArray(leaveRequestsRaw) ? leaveRequestsRaw : [];
  const shifts: any[] = Array.isArray(shiftsRaw) ? shiftsRaw : [];
  const holidays: any[] = Array.isArray(holidaysRaw) ? holidaysRaw : [];

  const monthOptions = useMemo(() => {
    const months: Array<{ value: string; label: string }> = [
      { value: 'all', label: 'ទាំងអស់ (ថ្មីៗបំផុត)' },
    ];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('km-KH', { month: 'long', year: 'numeric' });
      months.push({ value: val, label: i === 0 ? `${label} (បច្ចុប្បន្ន)` : label });
    }
    return months;
  }, []);

  const filteredAttendance = useMemo(() => {
    if (selectedMonth === 'all') return attendanceRecords;
    return attendanceRecords.filter((r) => {
      const dateStr = String(r.attendance_date || r.dateSort || '');
      return dateStr.startsWith(selectedMonth);
    });
  }, [attendanceRecords, selectedMonth]);

  const filteredLeaves = useMemo(() => {
    if (leaveStatusFilter === 'all') return leaveRequests;
    return leaveRequests.filter((r) => {
      const s = String(r.status || '').toLowerCase();
      if (leaveStatusFilter === 'pending') return s.includes('pending');
      return s === leaveStatusFilter;
    });
  }, [leaveRequests, leaveStatusFilter]);

  const monthlyStats = useMemo(() => {
    const present = filteredAttendance.filter((r) => {
      const s = String(r.status || '').toLowerCase();
      return s === 'present' || s === 'late' || s === 'half_day';
    }).length;
    const late = filteredAttendance.filter(
      (r) => String(r.status || '').toLowerCase() === 'late'
    ).length;
    const totalHours = filteredAttendance.reduce(
      (acc, r) => acc + (Number(r.working_hours) || 0),
      0
    );
    return {
      present,
      late,
      total: filteredAttendance.length,
      totalHours: totalHours.toFixed(1),
    };
  }, [filteredAttendance]);

  const totalRemainingLeave = useMemo(() => {
    return leaveBalances.reduce((acc, b) => acc + (Number(b.remaining_days) || 0), 0);
  }, [leaveBalances]);

  const pendingLeaveCount = useMemo(() => {
    return leaveRequests.filter((r) => String(r.status || '').toLowerCase().includes('pending'))
      .length;
  }, [leaveRequests]);

  const hasCheckedIn = Boolean(
    todayAttendance?.has_checked_in || todayAttendance?.attendance?.check_in_time
  );
  const hasCheckedOut = Boolean(
    todayAttendance?.has_checked_out || todayAttendance?.attendance?.check_out_time
  );
  const activeShift =
    todayAttendance?.shift || shifts.find((s) => s.status === 'active') || shifts[0];

  const upcomingHolidays = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return holidays
      .filter((h) => String(h.date || h.holiday_date || '') >= todayStr)
      .sort((a, b) =>
        String(a.date || a.holiday_date || '').localeCompare(
          String(b.date || b.holiday_date || '')
        )
      )
      .slice(0, 4);
  }, [holidays]);

  const handleCancelLeave = async (id: number) => {
    setCancellingId(id);
    try {
      await leaveService.cancelRequest(id, { reason: 'Cancelled by employee' });
      toast.success('បានបោះបង់សំណើសុំច្បាប់ដោយជោគជ័យ');
      refetchLeaves();
      refetchBalances();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'មិនអាចបោះបង់សំណើបានទេ');
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    logout();
    navigate('/login', { replace: true });
  };

  const scrollToTop = () => {
    setActiveSection('overview');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    if (sectionId === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const headerKhmerDate = useMemo(() => {
    const now = new Date();
    const daysKh = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
    const monthsKh = [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ];
    return `ថ្ងៃ${daysKh[now.getDay()]} ទី${now.getDate()} ខែ${monthsKh[now.getMonth()]} ឆ្នាំ${now.getFullYear()}`;
  }, []);

  const handleNavClick = (sectionId: string) => {
    if (sectionId === 'password') {
      setPasswordModalOpen(true);
      setMobileMenuOpen(false);
      return;
    }
    scrollToSection(sectionId);
  };

  const navItems = useMemo(
    () => [
      { id: 'overview', label: 'ទិដ្ឋភាពទូទៅ', icon: LayoutDashboard },
    ],
    []
  );

  const initials = useMemo(() => {
    if (emp?.first_name && emp?.last_name) {
      return `${emp.first_name.trim()[0]}${emp.last_name.trim()[0]}`.toUpperCase();
    }
    const clean = fullName.replace(/^(វេជ្ជ\.|លោក\.|លោកស្រី\.|កញ្ញា\.|វេជ្ជបណ្ឌិត)\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase() || 'EM';
  }, [emp?.first_name, emp?.last_name, fullName]);

  const empStatus = getEmploymentStatusBadge(emp?.employment_status);

  return (
    <div className="min-h-screen bg-muted/30 text-foreground font-sans flex antialiased">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Dark Emerald Admin-Style Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col justify-between transition-transform duration-200 ease-out select-none font-sans ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--sidebar-bg, #0a1e1d)',
          borderRight: '1px solid var(--sidebar-border-color, #123633)',
          color: 'var(--sidebar-fg, #8ea39f)',
        }}
      >
        {/* Brand + Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Header Brand */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#123633] dark:border-[#0e2725] shrink-0">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-3 min-w-0 text-left flex-1 group"
            >
              <div className="size-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md border border-slate-200/90 dark:border-slate-700 p-0.5 overflow-hidden ring-2 ring-emerald-500/20">
                <img
                  src="/hospital-logo.png"
                  alt="មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ"
                  className="w-full h-full object-contain rounded-full"
                  loading="eager"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[13px] text-white tracking-tight leading-tight truncate" title="មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ">
                    ម.ព កម្ពុជា-ចិន ត្បូងឃ្មុំ
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.2 rounded tracking-wider uppercase leading-none">
                    ផតថល
                  </span>
                </div>
                <span className="text-[10px] font-medium text-[#7fa9a3] tracking-wide leading-none mt-1 truncate">
                  ប្រព័ន្ធគ្រប់គ្រងបុគ្គលិក
                </span>
              </div>
            </button>
            {mobileMenuOpen && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden size-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Sidebar"
              >
                <X className="size-5 text-slate-300" />
              </button>
            )}
          </div>

          {/* Live Network Status Bar */}
          <div className="px-4 py-2 border-b border-[#123633]/80 flex items-center justify-between select-none text-[11px] font-mono shrink-0 bg-black/20">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-sans text-[11px] font-medium tracking-tight text-slate-300">
                បណ្តាញដំណើរការល្អ
              </span>
            </div>
            <span className="text-[9px] font-bold text-emerald-400/90 font-mono tracking-wider bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              ដំណើរការ
            </span>
          </div>

          {/* Nav Items - Navigation Menu (At The Top) */}
          <div className="p-3 space-y-1">
            <p className="px-3 pt-1 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#5a7d78] select-none">
              ម៉ឺនុយបុគ្គលិក
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium select-none outline-none transition-all text-left cursor-pointer group ${
                      isActive
                        ? 'bg-emerald-500/15 text-white font-semibold shadow-xs border-l-2 border-emerald-400'
                        : 'text-[#8ea39f] hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon
                      className={`size-4 shrink-0 transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-[#6b8b86] group-hover:text-emerald-300'
                      }`}
                    />
                    <span className="truncate flex-1 tracking-tight">{item.label}</span>
                    {isActive && (
                      <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Pinned Sticky Bottom Section (Profile Card & Action Controls - As in Reference Design) */}
        <div className="p-3 border-t border-[#123633] bg-[#061412] shrink-0 space-y-2.5">
          {/* Active Shift Status Card */}
          <div className="rounded-xl bg-[#0e2624]/90 border border-[#1b4b47] p-2 space-y-1 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-[#7fa9a3] uppercase tracking-wider">
                វេនការងារបច្ចុប្បន្ន
              </p>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                {translateShiftCodeKh(activeShift?.code)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`size-2 rounded-full shrink-0 ${
                  hasCheckedIn
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                    : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                }`}
              />
              <span className="text-[#96b8b2] truncate text-[11px]">
                {hasCheckedIn && hasCheckedOut
                  ? 'បានចុះវត្តមានរួចរាល់'
                  : hasCheckedIn
                  ? `បានចូលម៉ោង ${formatTimeShort(todayAttendance?.attendance?.check_in_time)}`
                  : 'មិនទាន់ស្កេនវត្តមានថ្ងៃនេះ'}
              </span>
            </div>
          </div>

          {/* User Profile Card (Matching Student/Employee Portal Reference) */}
          <div className="rounded-2xl bg-[#0c2724]/95 border border-[#1b4e49] p-3 shadow-md space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar className="size-11 ring-2 ring-emerald-500/30 border border-emerald-400/40 shrink-0">
                {emp?.avatar_url && <AvatarImage src={emp.avatar_url} alt={fullName} />}
                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-bold text-sm select-none">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white truncate leading-tight">
                  {fullName}
                </p>
                <p className="text-[11px] text-[#7fa39f] font-mono truncate">
                  {empCode || user?.email}
                </p>
                <div className="mt-1">
                  <span className="inline-block bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[9.5px] font-semibold px-2 py-0.2 rounded-full leading-relaxed">
                    {positionTitle || 'បុគ្គលិក'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons Row 1: Edit Profile & Scan Attendance */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => setEditProfileModalOpen(true)}
                className="w-full h-7 px-2 bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 text-white text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 transition-all border border-white/10 hover:border-emerald-500/40 cursor-pointer select-none"
                title="កែព័ត៌មានផ្ទាល់ខ្លួន"
              >
                <span className="text-xs">✏️</span>
                <span className="truncate">កែព័ត៌មាន</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQrModalTab('scan');
                  setQrModalOpen(true);
                }}
                className="w-full h-7 px-2 bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 transition-all border border-emerald-500/40 cursor-pointer select-none"
                title="ស្កេនវត្តមាន"
              >
                <QrCode className="size-3 shrink-0" />
                <span className="truncate">ស្កេនវត្តមាន</span>
              </button>
            </div>

            {/* Action Buttons Row 2: Change Password & Logout */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                className="w-full h-7 px-2 bg-white/5 hover:bg-amber-500/20 hover:text-amber-200 text-white/90 text-[10.5px] font-medium rounded-lg flex items-center justify-center gap-1 transition-all border border-white/10 hover:border-amber-500/40 cursor-pointer select-none"
                title="ប្តូរពាក្យសម្ងាត់"
              >
                <span className="text-xs">🔒</span>
                <span className="truncate">ប្តូរពាក្យសម្ងាត់</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full h-7 px-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-200 text-white/90 text-[10.5px] font-medium rounded-lg flex items-center justify-center gap-1 transition-all border border-white/10 hover:border-rose-500/40 cursor-pointer select-none"
                title="ចាកចេញពីប្រព័ន្ធ"
              >
                <span className="text-xs">🚪</span>
                <span className="truncate">ចាកចេញ</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Mobile Header Bar (Only visible on small mobile screens) */}
        <div className="lg:hidden h-14 px-4 bg-[#0a1e1d] border-b border-[#123633] flex items-center justify-between sticky top-0 z-30 select-none">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="size-9 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Open Menu"
            >
              <Menu className="size-5 text-emerald-400" />
            </button>
            <span className="font-bold text-xs text-white truncate">
              ម.ព កម្ពុជា-ចិន ត្បូងឃ្មុំ
            </span>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            className="size-8.5 rounded-lg text-[#8ea39f] hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="ផ្ទុកឡើងវិញ"
          >
            <RefreshCw className="size-4 text-emerald-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-6">
          {/* Executive Hero Welcome Banner */}
          <div className="rounded-2xl relative overflow-hidden bg-gradient-to-br from-emerald-950 via-[#0d2f2b] to-slate-900 text-white p-6 sm:p-7 shadow-xs border border-emerald-800/40">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 -mb-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left: Avatar + Title + Badges */}
              <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                <Avatar className="size-16 sm:size-20 ring-4 ring-white/10 border-2 border-emerald-400/40 shadow-lg shrink-0">
                  {emp?.avatar_url && <AvatarImage src={emp.avatar_url} alt={fullName} />}
                  <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-bold text-xl sm:text-2xl select-none">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                      ជម្រាបសួរ, {fullName}
                    </h1>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/10 text-emerald-300 border border-white/15">
                      {empCode}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {empStatus.label}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="font-medium text-emerald-200">{positionTitle}</span>
                    <span className="text-slate-500">•</span>
                    <span>{departmentName}</span>
                    <span className="text-slate-500">•</span>
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      <Building2 className="size-3.5 text-emerald-400 shrink-0" />
                      {workLocationName}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="flex items-center gap-1 text-emerald-300/90 text-xs font-sans">
                      <Calendar className="size-3.5 text-emerald-400 shrink-0" />
                      {headerKhmerDate}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right: Quick Action CTAs */}
              <HeaderActionsGroup className="self-center">
                <RefreshButton
                  onClick={refreshAll}
                  size="sm"
                  title="ផ្ទុកទិន្នន័យឡើងវិញ"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 dark:bg-white/10 dark:text-white dark:border-white/20"
                />
                <AddButton
                  onClick={() => {
                    setQrModalTab('scan');
                    setQrModalOpen(true);
                  }}
                  icon={<QrCode className="size-4" />}
                  label={hasCheckedIn && !hasCheckedOut ? 'ចុះវត្តមានចេញ' : 'ស្កេនវត្តមានចូល'}
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-md"
                />
                <ActionButton
                  onClick={() => {
                    setQrModalTab('card');
                    setQrModalOpen(true);
                  }}
                  icon={<IdCard className="size-4 text-emerald-300" />}
                  label="កាតកូដ QR"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 dark:bg-white/10 dark:text-white dark:border-white/20"
                />
                <ActionButton
                  onClick={() => setEditProfileModalOpen(true)}
                  icon={<Pencil className="size-4 text-emerald-300" />}
                  label="កែព័ត៌មាន"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 dark:bg-white/10 dark:text-white dark:border-white/20"
                />
                <ActionButton
                  onClick={() => setLeaveModalOpen(true)}
                  icon={<CalendarDays className="size-4 text-emerald-300" />}
                  label="សុំច្បាប់"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 dark:bg-white/10 dark:text-white dark:border-white/20"
                />
              </HeaderActionsGroup>
            </div>
          </div>

          {/* SECTION 1: Top 4 KPI Cards */}
          <section id="overview" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 scroll-mt-20">
            {/* Card 1: វត្តមានខែនេះ */}
            <Card className="rounded-2xl border-border/70 shadow-xs hover:shadow-sm transition-all bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  វត្តមានខែនេះ
                </CardTitle>
                <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CalendarCheck2 className="size-4.5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                    {monthlyStats.present} ថ្ងៃ
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {monthlyStats.total} កំណត់ត្រា
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-0.5">
                  សរុប {monthlyStats.totalHours} ម៉ោង • មកយឺត {monthlyStats.late} ដង
                </p>
              </CardContent>
            </Card>

            {/* Card 2: វត្តមានថ្ងៃនេះ */}
            <Card className="rounded-2xl border-border/70 shadow-xs hover:shadow-sm transition-all bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  វត្តមានថ្ងៃនេះ
                </CardTitle>
                <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Clock className="size-4.5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                    {hasCheckedIn
                      ? formatTimeShort(todayAttendance?.attendance?.check_in_time)
                      : 'មិនទាន់ស្កេន'}
                  </span>
                  {hasCheckedIn && (
                    <Badge variant={hasCheckedOut ? 'secondary' : 'success'}>
                      {hasCheckedOut ? 'បានចេញ' : 'កំពុងធ្វើការ'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground pt-0.5 truncate">
                  {activeShift
                    ? `${translateShiftNameKh(activeShift.name)} (${formatTimeShort(activeShift.start_time)} - ${formatTimeShort(activeShift.end_time)})`
                    : 'ម៉ោងការិយាល័យស្តង់ដារ (០៨:០០ - ១៧:០០)'}
                </p>
              </CardContent>
            </Card>

            {/* Card 3: ថ្ងៃឈប់សម្រាកនៅសល់ */}
            <Card className="rounded-2xl border-border/70 shadow-xs hover:shadow-sm transition-all bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  ថ្ងៃឈប់សម្រាកនៅសល់
                </CardTitle>
                <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <CalendarDays className="size-4.5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                    {totalRemainingLeave} ថ្ងៃ
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ឆ្នាំ {new Date().getFullYear()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-0.5">
                  {leaveBalances.length > 0
                    ? `${leaveBalances.length} ប្រភេទច្បាប់ផ្ទាល់ខ្លួន`
                    : 'តាមគោលការណ៍មន្ទីរពេទ្យ'}
                </p>
              </CardContent>
            </Card>

            {/* Card 4: សំណើច្បាប់ និងកាត QR */}
            <Card className="rounded-2xl border-border/70 shadow-xs hover:shadow-sm transition-all bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  សំណើច្បាប់ និងកាត QR
                </CardTitle>
                <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ShieldCheck className="size-4.5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                    {pendingLeaveCount > 0 ? `${pendingLeaveCount} រង់ចាំ` : 'រួចរាល់'}
                  </span>
                  {qrDetails?.active_qr && <Badge variant="info">កូដ QR សកម្ម</Badge>}
                </div>
                <p className="text-xs text-muted-foreground pt-0.5">
                  {pendingLeaveCount > 0
                    ? 'មានសំណើផ្ទាល់ខ្លួនកំពុងរង់ចាំអនុម័ត'
                    : 'គ្មានសំណើរង់ចាំអនុម័ត'}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* SECTION 2: Detailed Employee Info Card */}
          <section id="profile-details" className="scroll-mt-20">
            <Card className="rounded-2xl border-border/70 shadow-xs bg-card">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <Avatar className="size-12 ring-2 ring-emerald-500/20 border border-border shrink-0">
                    {emp?.avatar_url && <AvatarImage src={emp.avatar_url} alt={fullName} />}
                    <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-emerald-600 to-teal-800 text-white select-none">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-bold">{fullName}</CardTitle>
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {empCode}
                      </Badge>
                      <Badge variant={empStatus.variant}>{empStatus.label}</Badge>
                      <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                        {employmentTypeName}
                      </Badge>
                      {(emp?.specialization || emp?.blood_group) && (
                        <Badge variant="warning">{formatSpecializationOrBloodKh(emp?.specialization || emp?.blood_group)}</Badge>
                      )}
                    </div>
                    <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{positionTitle}</span>
                      <span>•</span>
                      <span>{departmentName}</span>
                      <span>•</span>
                      <span>{emp?.email || user?.email}</span>
                    </CardDescription>
                  </div>
                </div>
                <HeaderActionsGroup>
                  <ActionButton
                    onClick={() => setEditProfileModalOpen(true)}
                    icon={<Pencil className="size-4 text-emerald-600 dark:text-emerald-400" />}
                    label="✏️ កែព័ត៌មានផ្ទាល់ខ្លួន"
                    size="sm"
                    className="border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  />
                  <ActionButton
                    onClick={() => {
                      setQrModalTab('card');
                      setQrModalOpen(true);
                    }}
                    icon={<IdCard className="size-4 text-emerald-600 dark:text-emerald-400" />}
                    label="កាតបុគ្គលិក & QR"
                    size="sm"
                  />
                </HeaderActionsGroup>
              </CardHeader>

              <Separator />

              <CardContent className="pt-5">
                {loadingProfile ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3.5 transition-colors flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-muted-foreground">ភេទ</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">
                          {formatGenderKh(emp?.gender)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3.5 transition-colors flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-muted-foreground">ថ្ងៃខែឆ្នាំកំណើត</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5 tabular-nums">
                          {formatDateKh(emp?.date_of_birth)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3.5 transition-colors flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Phone className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-muted-foreground">លេខទូរស័ព្ទ</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5 tabular-nums">
                          {emp?.phone || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3.5 transition-colors flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        <IdCard className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-muted-foreground">អត្តសញ្ញាណប័ណ្ណ</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5 tabular-nums">
                          {emp?.national_id || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3.5 transition-colors flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-muted-foreground">ថ្ងៃចូលបម្រើការងារ</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5 tabular-nums">
                          {formatDateKh(emp?.join_date)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3.5 transition-colors flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-muted-foreground">ទីតាំងធ្វើការ</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5 truncate" title={workLocationName}>
                          {workLocationName}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3.5 transition-colors flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                        <UserCheck className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-muted-foreground">អ្នកគ្រប់គ្រងផ្ទាល់</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
                          {supervisorName}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3.5 transition-colors flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-muted-foreground">ទំនាក់ទំនងបន្ទាន់</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5 truncate" title={emergencyContact ? `${emergencyContact.name} (${emergencyContact.phone})` : emp?.address || '—'}>
                          {emergencyContact
                            ? `${emergencyContact.name} (${emergencyContact.phone})`
                            : emp?.address || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* SECTION 3: Today's Attendance & Quick QR Strip */}
          <section id="attendance-today" className="scroll-mt-20">
            <Card className="rounded-2xl border-border/70 shadow-xs bg-card">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
                <div>
                  <CardTitle className="text-base font-bold">ការចុះវត្តមាន និងស្កេន QR ថ្ងៃនេះ</CardTitle>
                  <CardDescription>
                    កត់ត្រាម៉ោងចូល-ចេញប្រចាំថ្ងៃ ឬបង្ហាញកាត QR ផ្ទាល់ខ្លួនរបស់អ្នក
                  </CardDescription>
                </div>
                <HeaderActionsGroup>
                  <RefreshButton onClick={refreshAll} size="sm" title="ផ្ទុកឡើងវិញ" />
                  <ActionButton
                    onClick={() => {
                      setQrModalTab('card');
                      setQrModalOpen(true);
                    }}
                    icon={<QrCode className="size-4 text-emerald-600 dark:text-emerald-400" />}
                    label="កាតកូដ QR របស់ខ្ញុំ"
                    size="sm"
                  />
                  <AddButton
                    onClick={() => {
                      setQrModalTab('scan');
                      setQrModalOpen(true);
                    }}
                    icon={
                      hasCheckedIn && !hasCheckedOut ? (
                        <LogOut className="size-4" />
                      ) : hasCheckedIn && hasCheckedOut ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <LogIn className="size-4" />
                      )
                    }
                    label={
                      hasCheckedIn && !hasCheckedOut
                        ? 'ចុះវត្តមានចេញ'
                        : hasCheckedIn && hasCheckedOut
                        ? 'វត្តមានបានកត់ត្រារួច'
                        : 'ស្កេនវត្តមានចូល'
                    }
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  />
                </HeaderActionsGroup>
              </CardHeader>

              <Separator />

              <CardContent className="pt-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-emerald-500 shrink-0" />
                      ទីតាំងធ្វើការ
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate" title={workLocationName}>
                      {workLocationName}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-blue-500 shrink-0" />
                      កាលបរិច្ឆេទ
                    </p>
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {formatDateKh(todayAttendance?.date || new Date().toISOString())}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3.5 space-y-1">
                    <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <LogIn className="size-3.5 shrink-0" />
                      ម៉ោងចុះវត្តមានចូល
                    </p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatTimeShort(todayAttendance?.attendance?.check_in_time)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <LogOut className="size-3.5 text-slate-500 shrink-0" />
                      ម៉ោងចុះវត្តមានចេញ
                    </p>
                    <p className="text-base font-bold text-foreground tabular-nums">
                      {formatTimeShort(todayAttendance?.attendance?.check_out_time)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Activity className="size-3.5 text-purple-500 shrink-0" />
                      ស្ថានភាពថ្ងៃនេះ
                    </p>
                    <div className="pt-0.5">
                      {todayAttendance?.attendance?.status ? (
                        <Badge
                          variant={getAttendanceStatusBadge(todayAttendance.attendance.status).variant}
                          className="text-xs"
                        >
                          {getAttendanceStatusBadge(todayAttendance.attendance.status).label}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          មិនទាន់ចុះវត្តមាន
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* SECTION 4: My Work Schedule & Upcoming Holidays (2-Column Panels) */}
          <section id="schedule" className="scroll-mt-20">
            <Card className="rounded-2xl border-border/70 shadow-xs bg-card">
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-baseline gap-2">
                  <CardTitle className="text-base font-bold">កាលវិភាគវេនធ្វើការរបស់ខ្ញុំ</CardTitle>
                  <CardDescription>
                    ឆ្នាំ {new Date().getFullYear()} • {departmentName}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Work Shifts */}
                  <div className="rounded-xl border border-border/70 bg-muted/35 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Briefcase className="size-3.5 text-muted-foreground" />
                        វេនបម្រើការងារ
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        {shifts.length} វេន
                      </span>
                    </div>

                    {shifts.length === 0 ? (
                      <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
                        ម៉ោងការិយាល័យស្តង់ដារ ០៨:០០ - ១៧:០០ (ច័ន្ទ - សុក្រ)
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {shifts.slice(0, 4).map((shift: any) => (
                          <div
                            key={shift.id}
                            className="rounded-lg border border-border/80 bg-card p-3.5 space-y-1.5 transition-colors hover:border-foreground/20"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-foreground tabular-nums">
                                {formatTimeShort(shift.start_time)} - {formatTimeShort(shift.end_time)}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {translateShiftCodeKh(shift.code)}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {translateShiftNameKh(shift.name)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {workLocationName} • អនុគ្រោះយឺត {shift.grace_period_minutes ?? 15} នាទី
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Upcoming Public Holidays */}
                  <div className="rounded-xl border border-border/70 bg-muted/35 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        ថ្ងៃឈប់សម្រាកបុណ្យជាតិជិតមកដល់
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        {upcomingHolidays.length} ថ្ងៃ
                      </span>
                    </div>

                    {upcomingHolidays.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center text-xs text-muted-foreground">
                        មិនមានថ្ងៃឈប់សម្រាកបុណ្យជាតិជិតមកដល់ក្នុងកាលវិភាគទេ
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {upcomingHolidays.map((h: any) => (
                          <div
                            key={h.id}
                            className="rounded-lg border border-border/80 bg-card p-3.5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-foreground tabular-nums">
                                {formatDateKh(h.date || h.holiday_date)}
                              </span>
                              <Badge variant="success" className="text-[10px]">
                                {h.is_recurring ? 'ប្រចាំឆ្នាំ' : 'ផ្លូវការ'}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-foreground">{h.name}</p>
                            {h.description && (
                              <p className="text-xs text-muted-foreground">{h.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* SECTION 5: Leave Balances & Leave Requests */}
          <section id="leaves" className="scroll-mt-20">
            <Card className="rounded-2xl border-border/70 shadow-xs bg-card">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
                <div>
                  <CardTitle className="text-base font-bold">ច្បាប់ឈប់សម្រាករបស់ខ្ញុំ</CardTitle>
                  <CardDescription>
                    ពិនិត្យសមតុល្យថ្ងៃឈប់សម្រាក និងតាមដានសំណើសុំច្បាប់ផ្ទាល់ខ្លួន
                  </CardDescription>
                </div>
                <HeaderActionsGroup>
                  <Select value={leaveStatusFilter} onValueChange={setLeaveStatusFilter}>
                    <SelectTrigger className="w-[155px] h-9 text-xs">
                      <SelectValue placeholder="គ្រប់ស្ថានភាព" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">គ្រប់ស្ថានភាព</SelectItem>
                      <SelectItem value="pending">កំពុងរង់ចាំ</SelectItem>
                      <SelectItem value="approved">បានអនុម័ត</SelectItem>
                      <SelectItem value="rejected">បានបដិសេធ</SelectItem>
                      <SelectItem value="cancelled">បានបោះបង់</SelectItem>
                    </SelectContent>
                  </Select>
                  <AddButton
                    onClick={() => setLeaveModalOpen(true)}
                    label="សុំច្បាប់ថ្មី"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  />
                </HeaderActionsGroup>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Leave Balance Mini-Cards */}
                {leaveBalances.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {leaveBalances.map((b: any) => (
                      <div
                        key={b.id}
                        className="rounded-xl border border-border/80 bg-muted/30 px-3.5 py-3 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {b.leave_type?.name || b.leaveType?.name || 'ច្បាប់ឈប់សម្រាក'}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                            ប្រើ {b.used_days ?? 0} / {b.allocated_days ?? 0} ថ្ងៃ
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-semibold text-foreground tabular-nums leading-none">
                            {b.remaining_days ?? 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">នៅសល់</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Leave Requests Table */}
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ប្រភេទច្បាប់</TableHead>
                        <TableHead>ចាប់ពី - ដល់ថ្ងៃ</TableHead>
                        <TableHead>ចំនួនថ្ងៃ</TableHead>
                        <TableHead>មូលហេតុ</TableHead>
                        <TableHead>ស្ថានភាព</TableHead>
                        <TableHead className="text-right">សកម្មភាព</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeaves.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="h-24 text-center text-xs text-muted-foreground"
                          >
                            មិនមានប្រវត្តិសំណើសុំច្បាប់ឈប់សម្រាកទេ
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLeaves.map((req: any) => {
                          const badge = getLeaveStatusBadge(req.status);
                          const isPending = String(req.status || '')
                            .toLowerCase()
                            .includes('pending');
                          return (
                            <TableRow key={req.id}>
                              <TableCell className="font-medium">
                                {req.leave_type?.name || req.leaveType?.name || 'ច្បាប់ឈប់សម្រាក'}
                              </TableCell>
                              <TableCell className="tabular-nums whitespace-nowrap text-muted-foreground">
                                {formatDateKh(req.start_date)} — {formatDateKh(req.end_date)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap tabular-nums">
                                {req.total_days ?? 1} ថ្ងៃ
                                {req.is_half_day ? ' (កន្លះថ្ងៃ)' : ''}
                              </TableCell>
                              <TableCell className="max-w-xs truncate text-muted-foreground" title={req.reason}>
                                {req.reason || '—'}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {isPending ? (
                                  <RowActionGroup>
                                    <RowActionButton
                                      type="button"
                                      variant="danger"
                                      size="sm"
                                      title="បោះបង់សំណើ"
                                      disabled={cancellingId === req.id}
                                      onClick={() => handleCancelLeave(req.id)}
                                      icon={
                                        cancellingId === req.id ? (
                                          <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                          <Ban className="size-3.5 text-rose-500" />
                                        )
                                      }
                                    />
                                  </RowActionGroup>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* SECTION 6: Monthly Attendance History */}
          <section id="attendance-history" className="scroll-mt-20">
            <Card className="rounded-2xl border-border/70 shadow-xs bg-card">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
                <div>
                  <CardTitle className="text-base font-bold">ប្រវត្តិវត្តមានប្រចាំខែ</CardTitle>
                  <CardDescription>
                    បង្ហាញ {filteredAttendance.length} កំណត់ត្រាសម្រាប់រយៈពេលដែលបានជ្រើសរើស
                  </CardDescription>
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[210px] h-9 text-xs">
                    <SelectValue placeholder="ជ្រើសរើសខែ" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>

              <CardContent>
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>កាលបរិច្ឆេទ</TableHead>
                        <TableHead>វេនការងារ</TableHead>
                        <TableHead>ម៉ោងចូល</TableHead>
                        <TableHead>ម៉ោងចេញ</TableHead>
                        <TableHead>ម៉ោងធ្វើការ</TableHead>
                        <TableHead>វិធីសាស្ត្រ</TableHead>
                        <TableHead>ស្ថានភាព</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttendance.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="h-24 text-center text-xs text-muted-foreground"
                          >
                            មិនមានទិន្នន័យវត្តមានសម្រាប់ខែដែលបានជ្រើសរើសទេ
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAttendance.map((rec: any, idx: number) => {
                          const badge = getAttendanceStatusBadge(rec.status);
                          return (
                            <TableRow key={rec.raw_id || rec.id || idx}>
                              <TableCell className="font-medium tabular-nums whitespace-nowrap">
                                {formatDateKh(rec.attendance_date || rec.dateSort)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {translateShiftNameKh(
                                  rec.work_shift?.name ||
                                    rec.workShift?.name ||
                                    rec.shift ||
                                    'ម៉ោងរដ្ឋបាល'
                                )}
                              </TableCell>
                              <TableCell className="font-medium text-emerald-700 tabular-nums">
                                {rec.checkIn || formatTimeShort(rec.check_in_time)}
                              </TableCell>
                              <TableCell className="font-medium tabular-nums">
                                {rec.checkOut || formatTimeShort(rec.check_out_time)}
                              </TableCell>
                              <TableCell className="tabular-nums text-muted-foreground">
                                {rec.workingHours ||
                                  (rec.working_hours ? `${rec.working_hours} ម៉ោង` : '—')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                  {translateMethodKh(rec.check_in_method)}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* SECTION 7: My Documents */}
          <section id="documents" className="scroll-mt-20 pb-8">
            <Card className="rounded-2xl border-border/70 shadow-xs bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-base font-bold">ឯកសារផ្ទាល់ខ្លួន</CardTitle>
                  <CardDescription>
                    កិច្ចសន្យាការងារ វិញ្ញាបនបត្រ និងឯកសារផ្ទាល់ខ្លួនក្នុងប្រព័ន្ធ
                  </CardDescription>
                </div>
                <Badge variant="secondary">{documents.length} ឯកសារ</Badge>
              </CardHeader>

              <CardContent>
                {documents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-xs text-muted-foreground">
                    មិនទាន់មានឯកសារផ្ទាល់ខ្លួនត្រូវបានបញ្ចូលក្នុងប្រព័ន្ធទេ
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="rounded-xl border border-border bg-card p-3.5 flex items-center justify-between gap-3 hover:border-foreground/20 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-lg border border-border bg-muted/40 flex items-center justify-center shrink-0">
                            <FileText className="size-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {doc.title || doc.document_name || 'ឯកសារ'}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {translateDocCategoryKh(doc.category || doc.document_type)}
                              {doc.expiry_date ? ` • ផុតកំណត់ ${formatDateKh(doc.expiry_date)}` : ''}
                            </p>
                          </div>
                        </div>
                        {doc.file_url && (
                          <RowActionGroup>
                            <RowActionButton
                              type="button"
                              variant="view"
                              size="sm"
                              title="មើល / ទាញយក"
                              onClick={() => window.open(doc.file_url, '_blank')}
                              icon={<Download className="size-3.5 text-blue-500" />}
                            />
                          </RowActionGroup>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </main>
      </div>

      {/* Modals */}
      <QrAttendanceModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        initialTab={qrModalTab}
        employeeId={resolvedEmployeeId}
        todayData={todayAttendance}
        qrDetails={qrDetails}
        onAttendanceUpdated={refreshAll}
      />

      <LeaveRequestModal
        open={leaveModalOpen}
        onOpenChange={setLeaveModalOpen}
        leaveTypes={leaveTypes}
        leaveBalances={leaveBalances}
        onSubmitted={() => {
          refetchLeaves();
          refetchBalances();
        }}
      />

      <ChangePasswordModal open={passwordModalOpen} onOpenChange={setPasswordModalOpen} />
      <EditProfileModal open={editProfileModalOpen} onOpenChange={setEditProfileModalOpen} />
    </div>
  );
};

export default EmployeePortalPage;
