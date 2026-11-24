import React, { useState, useMemo } from 'react';
import {
  Palmtree,
  Stethoscope,
  Heart,
  Briefcase,
  Search,
  Filter,
  Eye,
  Settings2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Plus,
  Minus,
  ChevronDown,
  Check,
} from 'lucide-react';
import { sound } from '@/utils/sound';
import { CloseButton, StatusBadge } from '@/components/common';
import {
  LeaveCategoryBalance,
  LeaveCategoryType,
  LeaveEmployee,
  LeaveRequestItem,
} from '../types';
import { LeavePagination } from './LeavePagination';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { toast } from 'sonner';

interface LeaveBalanceGridProps {
  balances: LeaveCategoryBalance[];
  employees?: LeaveEmployee[];
  requests?: LeaveRequestItem[];
}

interface EmployeeBalanceRecord {
  employeeId: string;
  name: string;
  avatarUrl?: string;
  employeeCode: string;
  department: string;
  office: string;
  annualTotal: number;
  annualUsed: number;
  annualRemaining: number;
  sickTotal: number;
  sickUsed: number;
  sickRemaining: number;
  personalTotal: number;
  personalUsed: number;
  personalRemaining: number;
  totalRemaining: number;
}

export const LeaveBalanceGrid: React.FC<LeaveBalanceGridProps> = ({
  balances,
  employees = [],
  requests = [],
}) => {
  // Filter draft states (Matching EmployeeFilters pattern)
  const [searchDraft, setSearchDraft] = useState('');
  const [deptDraft, setDeptDraft] = useState('all');
  const [officeDraft, setOfficeDraft] = useState('all');
  const [quotaStatusDraft, setQuotaStatusDraft] = useState('all');

  // Applied filter states
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    department: 'all',
    office: 'all',
    quotaStatus: 'all',
  });

  const [selectedEmployeeRecord, setSelectedEmployeeRecord] = useState<EmployeeBalanceRecord | null>(null);
  const [adjustModalRecord, setAdjustModalRecord] = useState<EmployeeBalanceRecord | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Adjustment form states
  const [adjustType, setAdjustType] = useState<LeaveCategoryType>('Annual Leave');
  const [adjustOperation, setAdjustOperation] = useState<'add' | 'deduct'>('add');
  const [adjustDays, setAdjustDays] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState('');

  // Local adjustments state to update balances dynamically
  const [localAdjustments, setLocalAdjustments] = useState<Record<string, { annual: number; sick: number; personal: number }>>({});

  // 1. Calculate aggregated quota meta
  const getCategoryMeta = (type: LeaveCategoryType | string) => {
    switch (type) {
      case 'Annual Leave':
        return {
          title: 'ច្បាប់ប្រចាំឆ្នាំ',
          icon: Palmtree,
          standardDays: '១៨ ថ្ងៃ/ឆ្នាំ',
          color: 'from-teal-600 to-emerald-500',
          dotColor: 'bg-teal-500',
          badgeColor: 'border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300',
          description: 'កូតាសម្រាកលំហែកាយប្រចាំឆ្នាំ ទទួលបានប្រាក់បៀវត្សរ៍ ១០០%',
        };
      case 'Sick Leave':
        return {
          title: 'ច្បាប់ឈឺ',
          icon: Stethoscope,
          standardDays: '៦ ថ្ងៃ/ឆ្នាំ',
          color: 'from-amber-600 to-yellow-500',
          dotColor: 'bg-amber-500',
          badgeColor: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
          description: 'សម្រាប់សម្រាកព្យាបាលជំងឺ តម្រូវឱ្យមានវេជ្ជបញ្ជាលើសពី ២ ថ្ងៃ',
        };
      case 'Personal Leave':
      case 'Special Personal Leave':
        return {
          title: 'ច្បាប់ផ្ទាល់ខ្លួន',
          icon: Heart,
          standardDays: '៣ ថ្ងៃ/ឆ្នាំ',
          color: 'from-indigo-600 to-blue-500',
          dotColor: 'bg-indigo-500',
          badgeColor: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
          description: 'ដោះស្រាយកិច្ចការបន្ទាន់គ្រួសារ ការយល់ព្រមពីប្រធានផ្នែក/HR',
        };
      case 'Unpaid Leave':
      default:
        return {
          title: type === 'Unpaid Leave' ? 'គ្មានប្រាក់ឈ្នួល' : type || 'ផ្សេងៗ',
          icon: Briefcase,
          standardDays: 'មិនកំណត់',
          color: 'from-slate-600 to-slate-500',
          dotColor: 'bg-slate-400',
          badgeColor: 'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300',
          description: 'ឈប់សម្រាកលើសពីកូតា កាត់កងតាមថ្ងៃឈប់សម្រាកជាក់ស្ដែង',
        };
    }
  };

  // 2. Build detailed records for each employee
  const employeeBalances: EmployeeBalanceRecord[] = useMemo(() => {
    return employees.map((emp, idx) => {
      const empId = emp.id || `EMP-${idx + 1}`;
      const empCode = emp.employee_code || `EMP-${idx + 1001}`;

      // Sum approved days for this employee from requests list
      const empRequests = requests.filter(
        (r) =>
          r.employee.toLowerCase() === emp.name.toLowerCase() &&
          r.status === 'Approved'
      );

      const annualTaken = empRequests
        .filter((r) => r.type === 'Annual Leave')
        .reduce((sum, r) => sum + r.duration, 0);

      const sickTaken = empRequests
        .filter((r) => r.type === 'Sick Leave')
        .reduce((sum, r) => sum + r.duration, 0);

      const personalTaken = empRequests
        .filter((r) => r.type === 'Personal Leave')
        .reduce((sum, r) => sum + r.duration, 0);

      // Add any local manual adjustments
      const adj = localAdjustments[empId] || { annual: 0, sick: 0, personal: 0 };

      // Cambodian Hospital Standard: Annual 18, Sick 6, Personal 3
      const annualTotal = 18 + adj.annual;
      const sickTotal = 6 + adj.sick;
      const personalTotal = 3 + adj.personal;

      const annualRemaining = Math.max(0, annualTotal - annualTaken);
      const sickRemaining = Math.max(0, sickTotal - sickTaken);
      const personalRemaining = Math.max(0, personalTotal - personalTaken);
      const totalRemaining = annualRemaining + sickRemaining + personalRemaining;

      return {
        employeeId: empId,
        name: emp.name,
        avatarUrl: emp.avatarUrl,
        employeeCode: empCode,
        department: emp.department || 'ផ្នែកទូទៅ',
        office: emp.office || 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន',
        annualTotal,
        annualUsed: annualTaken,
        annualRemaining,
        sickTotal,
        sickUsed: sickTaken,
        sickRemaining,
        personalTotal,
        personalUsed: personalTaken,
        personalRemaining,
        totalRemaining,
      };
    });
  }, [employees, requests, localAdjustments]);

  // Unique departments for filtering
  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(set) as string[];
  }, [employees]);

  // Unique offices / locations for filtering
  const offices = useMemo(() => {
    const set = new Set(employees.map((e) => e.office).filter(Boolean));
    return Array.from(set) as string[];
  }, [employees]);

  // Handle Apply filters (matching EmployeeFilters behavior)
  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playClick();
    setAppliedFilters({
      search: searchDraft.trim(),
      department: deptDraft,
      office: officeDraft,
      quotaStatus: quotaStatusDraft,
    });
    setCurrentPage(1);
  };

  // Handle Reset filters
  const handleReset = () => {
    sound.playClick();
    setSearchDraft('');
    setDeptDraft('all');
    setOfficeDraft('all');
    setQuotaStatusDraft('all');
    setAppliedFilters({
      search: '',
      department: 'all',
      office: 'all',
      quotaStatus: 'all',
    });
    setCurrentPage(1);
  };

  // Filtered employees
  const filteredBalances = useMemo(() => {
    return employeeBalances.filter((emp) => {
      const q = appliedFilters.search.toLowerCase();
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q);

      const matchesDept =
        appliedFilters.department === 'all' ||
        emp.department === appliedFilters.department;

      const matchesOffice =
        appliedFilters.office === 'all' ||
        emp.office === appliedFilters.office;

      let matchesStatus = true;
      if (appliedFilters.quotaStatus === 'available') {
        matchesStatus = emp.totalRemaining > 5;
      } else if (appliedFilters.quotaStatus === 'low') {
        matchesStatus = emp.totalRemaining > 0 && emp.totalRemaining <= 5;
      } else if (appliedFilters.quotaStatus === 'exhausted') {
        matchesStatus = emp.totalRemaining === 0;
      }

      return matchesSearch && matchesDept && matchesOffice && matchesStatus;
    });
  }, [employeeBalances, appliedFilters]);

  // Paginated employees for clean table rendering
  const paginatedBalances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBalances.slice(start, start + pageSize);
  }, [filteredBalances, currentPage, pageSize]);

  // Handle Save Balance Adjustment
  const handleSaveAdjustment = () => {
    if (!adjustModalRecord) return;
    const empId = adjustModalRecord.employeeId;
    const delta = adjustOperation === 'add' ? adjustDays : -adjustDays;

    setLocalAdjustments((prev) => {
      const current = prev[empId] || { annual: 0, sick: 0, personal: 0 };
      if (adjustType === 'Annual Leave') {
        return { ...prev, [empId]: { ...current, annual: current.annual + delta } };
      } else if (adjustType === 'Sick Leave') {
        return { ...prev, [empId]: { ...current, sick: current.sick + delta } };
      } else {
        return { ...prev, [empId]: { ...current, personal: current.personal + delta } };
      }
    });

    toast.success(
      `បាន${adjustOperation === 'add' ? 'បន្ថែម' : 'កាត់'} ${adjustDays} ថ្ងៃលើ${adjustType} របស់ ${adjustModalRecord.name} ដោយជោគជ័យ!`
    );
    setAdjustModalRecord(null);
    setAdjustReason('');
    setAdjustDays(1);
  };

  const controlHeightCls = 'h-10 min-h-[40px] max-h-[40px]';
  const selectCls =
    `w-full ${controlHeightCls} pl-3 pr-7 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-card dark:bg-slate-900 text-foreground dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all appearance-none cursor-pointer outline-none shadow-2xs`;

  return (
    <div className="space-y-4">
      {/* ─── 1. Unified Search Bar & Filter Toolbar (Employee Format) ─── */}
      <div className="w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-card p-2.5 sm:p-3 shadow-2xs transition-all print:hidden">
        <form onSubmit={handleApply} className="flex flex-wrap xl:flex-nowrap items-center gap-1.5 sm:gap-2">
          {/* 1. Search input */}
          <div className={`relative w-full sm:w-60 md:w-64 lg:w-72 xl:w-72 shrink-0 ${controlHeightCls}`}>
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
            />
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="ស្វែងរកឈ្មោះ, អត្តលេខ, ដេប៉ាតឺម៉ង់..."
              className={`w-full ${controlHeightCls} pl-9 pr-8 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-card dark:bg-slate-900 text-foreground dark:text-slate-100 placeholder:text-muted-foreground/60 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-2xs`}
            />
            {searchDraft && (
              <button
                type="button"
                onClick={() => {
                  setSearchDraft('');
                  if (appliedFilters.search) {
                    setAppliedFilters((prev) => ({ ...prev, search: '' }));
                    setCurrentPage(1);
                  }
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer"
                title="សម្អាតការស្វែងរក"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 2. All Departments (គ្រប់ផ្នែក) */}
          <div className={`relative flex-1 min-w-[120px] sm:min-w-[135px] xl:w-[155px] xl:flex-none ${controlHeightCls}`}>
            <select
              value={deptDraft}
              onChange={(e) => setDeptDraft(e.target.value)}
              className={selectCls}
            >
              <option value="all">គ្រប់ផ្នែកទាំងអស់</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* 3. All Branches / Locations (គ្រប់សាខា) */}
          <div className={`relative flex-1 min-w-[120px] sm:min-w-[135px] xl:w-[155px] xl:flex-none ${controlHeightCls}`}>
            <select
              value={officeDraft}
              onChange={(e) => setOfficeDraft(e.target.value)}
              className={selectCls}
            >
              <option value="all">គ្រប់សាខា</option>
              {offices.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* 4. Quota Balance Status (ស្ថានភាពកូតា) */}
          <div className={`relative flex-1 min-w-[120px] sm:min-w-[135px] xl:w-[150px] xl:flex-none ${controlHeightCls}`}>
            <select
              value={quotaStatusDraft}
              onChange={(e) => setQuotaStatusDraft(e.target.value)}
              className={selectCls}
            >
              <option value="all">ស្ថានភាពទាំងអស់</option>
              <option value="available">នៅសល់កូតា (&gt; 5 ថ្ងៃ)</option>
              <option value="low">ជិតអស់កូតា (≤ 5 ថ្ងៃ)</option>
              <option value="exhausted">អស់កូតា (០ ថ្ងៃ)</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* 5. Apply Button (Dark Teal/Forest Green #0f766e) */}
          <button
            type="submit"
            className={`${controlHeightCls} px-3.5 rounded-lg bg-[#0f766e] hover:bg-[#115e59] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0`}
            title="អនុវត្ត"
          >
            <Check size={14} className="stroke-[2.5]" />
            <span>អនុវត្ត</span>
          </button>

          {/* 6. Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className={`${controlHeightCls} px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-card hover:bg-muted/80 text-foreground dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer shrink-0`}
            title="កំណត់ឡើងវិញ"
          >
            <span>កំណត់ឡើងវិញ</span>
          </button>
        </form>
      </div>

      {/* ─── 2. EMPLOYEE LEAVE BALANCE LEDGER TABLE ─── */}
      <Card className="border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs rounded-2xl overflow-hidden">
        {/* Table Header with Title & Inline Summary Strip */}
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                តារាងសមតុល្យច្បាប់បុគ្គលិកម្នាក់ៗ (Employee Leave Balances)
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[11px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              >
                សរុប {filteredBalances.length} នាក់
              </Badge>
            </div>
          </div>

          {/* Inline Summary Strip (Subtle, sleek, horizontal metrics) */}
          {balances.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                កូតាសរុបស្ថាប័ន៖
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {balances.slice(0, 4).map((cat) => {
                  const meta = getCategoryMeta(cat.type);
                  const remaining = Math.max(0, cat.total - cat.used);
                  const percent = cat.total > 0 ? Math.round((cat.used / cat.total) * 100) : 0;
                  return (
                    <div
                      key={cat.type}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 shadow-2xs"
                    >
                      <span className={`h-2 w-2 rounded-full ${meta.dotColor || 'bg-teal-500'} shrink-0`} />
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {meta.title}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        ({meta.standardDays})
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        នៅសល់ <strong>{remaining}</strong>/{cat.total} ថ្ងៃ
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-1 rounded">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardHeader>

        {/* Table Content */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800">
                <TableRow>
                  <TableHead className="pl-5 text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-[200px]">
                    បុគ្គលិក
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-[140px]">
                    ដេប៉ាតឺម៉ង់
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-[160px]">
                    ច្បាប់ប្រចាំឆ្នាំ (១៨ ថ្ងៃ)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-[140px]">
                    ច្បាប់ឈឺ (៦ ថ្ងៃ)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-[140px]">
                    ច្បាប់ផ្ទាល់ខ្លួន (៣ ថ្ងៃ)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-[110px] text-center">
                    សរុបនៅសល់
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-800 dark:text-slate-200 pr-5 text-right w-[110px]">
                    សកម្មភាព
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedBalances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-xs text-muted-foreground">
                      រកមិនឃើញទិន្នន័យសមតុល្យបុគ្គលិកតាមការស្វែងរកឡើយ។
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBalances.map((emp) => {
                    const initials = emp.name
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('');

                    // Status of remaining balance
                    const isLow = emp.totalRemaining <= 5;
                    const isExhausted = emp.totalRemaining === 0;

                    return (
                      <TableRow
                        key={emp.employeeId}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80 transition-colors"
                      >
                        {/* Employee info */}
                        <TableCell className="pl-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0 ring-1 ring-slate-200 dark:ring-slate-700">
                              {emp.avatarUrl && (
                                <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                              )}
                              <AvatarFallback className="bg-teal-50 text-teal-700 dark:bg-teal-950 font-bold text-xs border border-teal-200 dark:border-teal-800">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 block truncate">
                                {emp.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono block">
                                {emp.employeeCode} • {emp.office}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Department */}
                        <TableCell className="py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {emp.department}
                          </span>
                        </TableCell>

                        {/* Annual Leave Progress */}
                        <TableCell className="py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {emp.annualRemaining}{' '}
                                <span className="text-[11px] font-normal text-muted-foreground">
                                  / {emp.annualTotal} ថ្ងៃ
                                </span>
                              </span>
                              {emp.annualUsed > 0 ? (
                                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                                  ប្រើ {emp.annualUsed} ថ្ងៃ
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  នៅពេញ
                                </span>
                              )}
                            </div>
                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, Math.round((emp.annualRemaining / emp.annualTotal) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Sick Leave Progress */}
                        <TableCell className="py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {emp.sickRemaining}{' '}
                                <span className="text-[11px] font-normal text-muted-foreground">
                                  / {emp.sickTotal} ថ្ងៃ
                                </span>
                              </span>
                              {emp.sickUsed > 0 ? (
                                <span className="text-[10px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200/60 dark:border-rose-800/40">
                                  ប្រើ {emp.sickUsed} ថ្ងៃ
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  នៅពេញ
                                </span>
                              )}
                            </div>
                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, Math.round((emp.sickRemaining / emp.sickTotal) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Personal Leave Progress */}
                        <TableCell className="py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {emp.personalRemaining}{' '}
                                <span className="text-[11px] font-normal text-muted-foreground">
                                  / {emp.personalTotal} ថ្ងៃ
                                </span>
                              </span>
                              {emp.personalUsed > 0 ? (
                                <span className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/40">
                                  ប្រើ {emp.personalUsed} ថ្ងៃ
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  នៅពេញ
                                </span>
                              )}
                            </div>
                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, Math.round((emp.personalRemaining / emp.personalTotal) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Total Remaining Badge */}
                        <TableCell className="py-3.5 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold font-mono shadow-2xs ${
                              isExhausted
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                : isLow
                                ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            }`}
                          >
                            {emp.totalRemaining} ថ្ងៃ
                          </span>
                        </TableCell>

                        {/* Actions (1-Click Inline Buttons) */}
                        <TableCell className="py-3.5 pr-5 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* View History Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedEmployeeRecord(emp)}
                              title="មើលប្រវត្តិច្បាប់បុគ្គលិក"
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-slate-600 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {/* Adjust Quota Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustModalRecord(emp);
                                setAdjustDays(1);
                                setAdjustReason('');
                              }}
                              title="កែតម្រូវកូតាច្បាប់ (Adjust Balance)"
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-slate-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                            >
                              <Settings2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Table Footer with Pagination */}
          {filteredBalances.length > 0 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
              <LeavePagination
                total={filteredBalances.length}
                page={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 3. MODAL 1: VIEW EMPLOYEE LEAVE BREAKDOWN & HISTORY (Global Pattern) ─── */}
      <Dialog
        open={!!selectedEmployeeRecord}
        onOpenChange={(open) => !open && setSelectedEmployeeRecord(null)}
      >
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    ប្រវត្តិកូតា & សំណើសុំច្បាប់បុគ្គលិក
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {selectedEmployeeRecord?.name} ({selectedEmployeeRecord?.employeeCode}) • {selectedEmployeeRecord?.department}
                  </DialogDescription>
                </div>
              </div>
              <CloseButton onClose={() => setSelectedEmployeeRecord(null)} size="md" variant="default" />
            </div>
          </DialogHeader>

          {selectedEmployeeRecord && (
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              {/* 3 Quota Breakdown Cards */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl border border-teal-200/90 dark:border-teal-800/60 bg-teal-50/50 dark:bg-teal-950/30 transition-all">
                  <span className="text-[11px] text-teal-800 dark:text-teal-300 font-semibold flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
                    ច្បាប់ប្រចាំឆ្នាំ
                  </span>
                  <span className="text-2xl font-mono font-bold text-teal-700 dark:text-teal-200 block my-1">
                    {selectedEmployeeRecord.annualRemaining}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    នៅសល់ / {selectedEmployeeRecord.annualTotal} ថ្ងៃ
                  </span>
                  <span className="text-[10px] text-teal-700/80 dark:text-teal-400 font-medium block mt-0.5">
                    ប្រើ {selectedEmployeeRecord.annualUsed} ថ្ងៃ
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-amber-200/90 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 transition-all">
                  <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    ច្បាប់ឈឺ
                  </span>
                  <span className="text-2xl font-mono font-bold text-amber-700 dark:text-amber-200 block my-1">
                    {selectedEmployeeRecord.sickRemaining}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    នៅសល់ / {selectedEmployeeRecord.sickTotal} ថ្ងៃ
                  </span>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-medium block mt-0.5">
                    ប្រើ {selectedEmployeeRecord.sickUsed} ថ្ងៃ
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-indigo-200/90 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 transition-all">
                  <span className="text-[11px] text-indigo-800 dark:text-indigo-300 font-semibold flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                    ច្បាប់ផ្ទាល់ខ្លួន
                  </span>
                  <span className="text-2xl font-mono font-bold text-indigo-700 dark:text-indigo-200 block my-1">
                    {selectedEmployeeRecord.personalRemaining}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    នៅសល់ / {selectedEmployeeRecord.personalTotal} ថ្ងៃ
                  </span>
                  <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400 font-medium block mt-0.5">
                    ប្រើ {selectedEmployeeRecord.personalUsed} ថ្ងៃ
                  </span>
                </div>
              </div>

              {/* History of Requests */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground text-xs">
                    ប្រវត្តិនៃការស្នើសុំច្បាប់ថ្មីៗ
                  </h4>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {requests.filter((r) => r.employee.toLowerCase() === selectedEmployeeRecord.name.toLowerCase()).length} កំណត់ត្រា
                  </span>
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-card">
                  {requests.filter((r) => r.employee.toLowerCase() === selectedEmployeeRecord.name.toLowerCase()).length === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        បុគ្គលិកនេះមិនទាន់មានប្រវត្តិនៃការស្នើសុំច្បាប់នៅឡើយទេ។
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/40 text-[11px] text-muted-foreground font-medium sticky top-0 border-b border-border">
                          <tr>
                            <th className="py-2.5 pl-3.5">កាលបរិច្ឆេទ</th>
                            <th className="py-2.5">ប្រភេទច្បាប់</th>
                            <th className="py-2.5">រយៈពេល</th>
                            <th className="py-2.5 pr-3.5 text-right">ស្ថានភាព</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {requests
                            .filter((r) => r.employee.toLowerCase() === selectedEmployeeRecord.name.toLowerCase())
                            .map((r) => (
                              <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-2.5 pl-3.5 font-mono text-[11px] text-muted-foreground">
                                  {r.appliedDate || (r.start ? new Date(r.start).toLocaleDateString('en-CA') : '២០២៦')}
                                </td>
                                <td className="py-2.5 font-medium text-foreground">
                                  {r.type === 'Annual Leave'
                                    ? 'ច្បាប់ប្រចាំឆ្នាំ'
                                    : r.type === 'Sick Leave'
                                    ? 'ច្បាប់ឈឺ'
                                    : r.type === 'Personal Leave'
                                    ? 'ច្បាប់ផ្ទាល់ខ្លួន'
                                    : r.type}
                                </td>
                                <td className="py-2.5 font-mono text-foreground font-medium">
                                  {r.duration} ថ្ងៃ
                                </td>
                                <td className="py-2.5 pr-3.5 text-right">
                                  <StatusBadge status={r.status} />
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-border bg-muted/20 flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedEmployeeRecord(null)}
              className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
            >
              បិទផ្ទាំង
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── 4. MODAL 2: ADJUST EMPLOYEE BALANCE (Global Pattern) ─── */}
      <Dialog
        open={!!adjustModalRecord}
        onOpenChange={(open) => !open && setAdjustModalRecord(null)}
      >
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    កែតម្រូវកូតាច្បាប់បុគ្គលិក (Adjust Balance)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {adjustModalRecord?.name} ({adjustModalRecord?.employeeCode}) • {adjustModalRecord?.department}
                  </DialogDescription>
                </div>
              </div>
              <CloseButton onClose={() => setAdjustModalRecord(null)} size="md" variant="default" />
            </div>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveAdjustment();
            }}
            className="p-5 sm:p-6 space-y-4 text-xs"
          >
            {/* Current balance mini overview banner */}
            {adjustModalRecord && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground font-medium">សមតុល្យបច្ចុប្បន្ន៖</span>
                <div className="flex items-center gap-2.5 font-mono text-[11px]">
                  <span className="text-teal-700 dark:text-teal-400 font-semibold">
                    ប្រចាំឆ្នាំ {adjustModalRecord.annualRemaining} ថ្ងៃ
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    ឈឺ {adjustModalRecord.sickRemaining} ថ្ងៃ
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="text-indigo-700 dark:text-indigo-400 font-semibold">
                    ផ្ទាល់ខ្លួន {adjustModalRecord.personalRemaining} ថ្ងៃ
                  </span>
                </div>
              </div>
            )}

            {/* 1. Category selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground text-xs block">
                ជ្រើសរើសប្រភេទច្បាប់ដែលត្រូវកែតម្រូវ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as LeaveCategoryType)}
                  className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all appearance-none cursor-pointer shadow-2xs"
                >
                  <option value="Annual Leave">ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)</option>
                  <option value="Sick Leave">ច្បាប់ឈឺ (Sick Leave)</option>
                  <option value="Personal Leave">ច្បាប់ផ្ទាល់ខ្លួន (Personal Leave)</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
            </div>

            {/* 2. Operation: Add vs Deduct */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground text-xs block">
                ប្រតិបត្តិការកែតម្រូវ <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setAdjustOperation('add')}
                  className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    adjustOperation === 'add'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>បន្ថែមថ្ងៃកូតា (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustOperation('deduct')}
                  className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    adjustOperation === 'deduct'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Minus className="h-4 w-4" />
                  <span>កាត់បន្ថយថ្ងៃកូតា (-)</span>
                </button>
              </div>
            </div>

            {/* 3. Number of days */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground text-xs block">
                ចំនួនថ្ងៃដែលត្រូវកែតម្រូវ <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={adjustDays}
                onChange={(e) => setAdjustDays(Math.max(0.5, Number(e.target.value)))}
                className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-mono font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs"
              />
            </div>

            {/* 4. Reason / Notes */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground text-xs block">
                មូលហេតុ ឬកំណត់ត្រារបស់ HR
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="ឧ. ប៉ះប៉ូវម៉ោងបន្ថែម (OT) ឬច្បាប់លើកលែងពិសេស..."
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustModalRecord(null)}
                className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
              >
                បោះបង់
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>រក្សាទុកការកែប្រែ</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
