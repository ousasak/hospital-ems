import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ExternalLink,
  CalendarCheck,
  Plane,
  CreditCard,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Eye,
  EyeOff,
  User,
} from 'lucide-react';
import { Employee } from '../types';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { getAbsoluteImageUrl } from '@/utils/image';

interface EmployeeDetailsDrawerProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
}

export const EmployeeDetailsDrawer: React.FC<EmployeeDetailsDrawerProps> = ({
  isOpen,
  employee,
  onClose,
  onEdit,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'general' | 'attendance' | 'leaves' | 'payroll'>('general');
  const [showPin, setShowPin] = useState(false);

  if (!isOpen || !employee) return null;

  const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Employee';
  const employeeCode = employee.employee_code || `EMP-${String(employee.id).padStart(4, '0')}`;
  const title = employee.primary_assignment?.position?.title || 'General Manager';
  const department = employee.primary_assignment?.department?.name || 'Executive & Management';
  const locationName =
    employee.primary_assignment?.work_location?.name ||
    employee.city ||
    t('employees.hospitalDefaultName');
  const companyName = t('employees.companyDefaultName');
  const supervisorName = employee.primary_assignment?.supervisor
    ? `${employee.primary_assignment.supervisor.first_name} ${employee.primary_assignment.supervisor.last_name}`
    : t('employees.seniorManagement');
  const contractType = employee.primary_assignment?.employment_type?.name || 'UDC';

  // Format Date of Birth
  const formatDob = (dob?: string | null) => {
    if (!dob) return 'Feb 1, 1991';
    try {
      const d = new Date(dob);
      if (isNaN(d.getTime())) return dob;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dob;
    }
  };

  const genderLabel =
    employee.gender?.toLowerCase() === 'female'
      ? t('employees.female')
      : employee.gender?.toLowerCase() === 'male'
      ? t('employees.male')
      : t('employees.otherGender');

  // Dynamic salary
  const salaryRaw = employee.current_salary?.base_salary ?? employee.base_salary ?? 1500;
  const salaryNum = Number(salaryRaw) || 1500;
  const salaryFormatted = `$${salaryNum.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const nationalId = employee.national_id || `KH-${String(employee.id).padStart(8, '0')}`;
  const rfidCode = `RFID-KH-${String(employee.id).padStart(5, '0')}`;
  const nssfNumber = `NSSF-${String(1000000 + employee.id * 781).slice(0, 7)}`;
  const bankName = employee.bank_name || 'ABA Bank';
  const bankAccNum = employee.bank_account_number || '000 123 456';
  const bankHolder = (employee.bank_account_name || fullName).toUpperCase();

  // Status mapping
  const status = (employee.employment_status || 'active').toLowerCase();
  const statusLabel =
    status === 'active'
      ? t('status.active')
      : status === 'probation'
      ? t('status.probation')
      : status === 'inactive'
      ? t('status.inactive')
      : t('status.resigned');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Drawer Container (Exact KHPosCommerce signature styling) */}
      <div
        id="emp-drawer"
        role="dialog"
        aria-label="Employee details drawer"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-50 flex w-full sm:max-w-[580px] lg:max-w-[620px] flex-col bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out font-sans select-text"
      >
        {/* 1. Header (Employee Profile Card) */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {t('employees.profileCard')}
                </h2>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {employeeCode}
                </span>
              </div>
              <p className="font-mono text-xs text-slate-400 dark:text-slate-500">
                {employeeCode}
              </p>
            </div>

            {/* Circular Close Button with blue border & hover */}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-blue-200/80 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4 stroke-[2.2]" />
            </button>
          </div>

          {/* ─── 2. Profile Banner Card ─── */}
          <div className="mt-4 flex items-center gap-3.5 pt-2">
            {/* 3D / Image Avatar */}
            <div className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-2xs shrink-0 select-none">
              {employee.avatar_url && !employee.avatar_url.includes('unsplash') ? (
                <img
                  src={getAbsoluteImageUrl(employee.avatar_url)}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                  <User className="h-6 w-6 stroke-[1.8]" />
                </div>
              )}
            </div>

            {/* Employee Name, Subtitle & Badges */}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  {fullName}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {statusLabel}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[420px]">
                {title} • {department} • {locationName}
              </p>

              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[10.5px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/80 px-2 py-0.5 rounded-md">
                  {t('employees.posSecurity')}
                </span>
                <span className="text-[10.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                  {contractType}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Horizontal Navigation Tabs (Overview | Attendance | Leaves | Payroll) */}
          <div className="mt-4 flex items-center gap-6 border-b border-slate-200/80 dark:border-slate-800 select-none">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`pb-2.5 text-xs transition-all relative font-bold cursor-pointer ${
                activeTab === 'general'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium border-b-2 border-transparent'
              }`}
            >
              {t("employees.tabs.overview")}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`pb-2.5 text-xs transition-all relative cursor-pointer ${
                activeTab === 'attendance'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium border-b-2 border-transparent'
              }`}
            >
              {t("employees.tabs.attendance")}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leaves')}
              className={`pb-2.5 text-xs transition-all relative cursor-pointer ${
                activeTab === 'leaves'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium border-b-2 border-transparent'
              }`}
            >
              {t("employees.tabs.leaves")}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payroll')}
              className={`pb-2.5 text-xs transition-all relative cursor-pointer ${
                activeTab === 'payroll'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium border-b-2 border-transparent'
              }`}
            >
              {t("employees.tabs.payroll")}
            </button>
          </div>
        </div>

        {/* ─── 4. Drawer Body - Tab Contents ─── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
          {/* TAB 1: Overview */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Card 1: Personal & Contact Info */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3.5 shadow-2xs">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {t("employees.personalContactInfo")}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.nationalId")}
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {nationalId}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.gender")}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {genderLabel} • {formatDob(employee.date_of_birth)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.email")}
                    </span>
                    <a
                      href={`mailto:${employee.email}`}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {employee.email || '—'}
                    </a>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.phone")}
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {employee.phone || '+855 12 888 101'}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.address")}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 leading-relaxed">
                      {employee.address || 'Street 271, Sangkat Boeng Tumpun, Khan Mean Chey, Phnom Penh #12'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Employment & Admin Info */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3.5 shadow-2xs">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {t("employees.employmentAdminInfo")}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.branch")}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {locationName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.company")}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {companyName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.department")}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {department}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.position")}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {title}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.supervisor")}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {supervisorName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.contractType")}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {contractType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: POS & Security */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3.5 shadow-2xs">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {t("employees.posSecurity")}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {t("employees.posPin")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {showPin ? t("employees.hide") : t("employees.reset")}
                      </button>
                    </div>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {showPin ? '8888' : '••••'}{' '}
                      <span className="text-[10.5px] text-slate-400 font-normal">
                        {t("employees.topSecret")}
                      </span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.rfidBadgeUid")}
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {rfidCode}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.commissionRate")}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      0%
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.managerPrivilege")}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {t("employees.allowDiscountVoid")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Social Benefits & Banking */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3.5 shadow-2xs">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {t("employees.socialBenefitsBanking")}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.baseSalary")}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {salaryFormatted}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.nssfNumber")}
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {nssfNumber}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                      {t("employees.bankAccount")}
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {bankName} - {bankAccNum} ({bankHolder})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Attendance */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center">
                  <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block">
                    {t("employees.attendanceThisMonth")}
                  </span>
                  <span className="text-lg font-bold text-emerald-600">22 {t("employees.days")}</span>
                </div>
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center">
                  <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block">
                    {t("employees.lateCount")}
                  </span>
                  <span className="text-lg font-bold text-amber-500">1 {t("employees.times")}</span>
                </div>
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center">
                  <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block">
                    {t("employees.absentCount")}
                  </span>
                  <span className="text-lg font-bold text-slate-400">0 {t("employees.days")}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {t("employees.last5DaysAttendance")}
                  </h4>
                  <Link
                    to="/attendance"
                    onClick={onClose}
                    className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{t("employees.viewAll")}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                  {[
                    { date: '11 Nov 2026', checkIn: '07:55 AM', checkOut: '05:05 PM', status: t("employees.onTime") },
                    { date: '10 Nov 2026', checkIn: '07:58 AM', checkOut: '05:02 PM', status: t("employees.onTime") },
                    { date: '09 Nov 2026', checkIn: '08:12 AM', checkOut: '05:00 PM', status: t("employees.lateMinutes", { min: 12 }) },
                    { date: '08 Nov 2026', checkIn: '07:50 AM', checkOut: '05:10 PM', status: t("employees.onTime") },
                    { date: '07 Nov 2026', checkIn: '07:54 AM', checkOut: '05:01 PM', status: t("employees.onTime") },
                  ].map((row, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{row.date}</span>
                        <span className="text-[10.5px] text-slate-400 font-mono">
                          {row.checkIn} — {row.checkOut}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                          row.status === t("employees.onTime")
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Leaves */}
          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3.5 shadow-2xs">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {t("employees.leaveBalanceYear", { year: 2026 })}
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-slate-500">{t("employees.annualLeave")}:</span>
                    <span className="font-bold text-blue-600 font-mono">14 / 18 {t("employees.daysRemaining")}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-slate-500">{t("employees.sickLeave")}:</span>
                    <span className="font-bold text-emerald-600 font-mono">12 / 15 {t("employees.daysRemaining")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("employees.specialLeave")}:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">5 / 7 {t("employees.daysRemaining")}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {t("employees.recentLeaveRequests")}
                  </h4>
                  <Link
                    to="/leaves"
                    onClick={onClose}
                    className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{t("employees.requestNewLeave")}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                  {[
                    { type: t("employees.annualLeave"), range: '14 Oct 2026 - 15 Oct 2026', days: "2 " + t("employees.days"), status: t("employees.approved") },
                    { type: t("employees.sickLeave"), range: '02 Sep 2026', days: "1 " + t("employees.days"), status: t("employees.approved") },
                  ].map((req, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{req.type}</span>
                        <span className="text-[10.5px] text-slate-400">{req.range} ({req.days})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Payroll */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3.5 shadow-2xs">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {t("employees.monthlySalarySummary")}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">{t("employees.baseSalary")}:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{salaryFormatted}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">{t("employees.allowance")}:</span>
                    <span className="font-mono font-semibold text-emerald-600">+$120.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">{t("employees.taxNssf")}:</span>
                    <span className="font-mono font-semibold text-rose-500">-$45.00</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-bold text-slate-900 dark:text-white">{t("employees.netSalary")}:</span>
                    <span className="font-mono font-bold text-blue-600 text-sm">
                      ${(salaryNum + 75).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {t("employees.payslips")}
                  </h4>
                  <Link
                    to="/payroll"
                    onClick={onClose}
                    className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{t("employees.viewPayrollList")}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                  {[t('employees.october2026'), t('employees.september2026'), t('employees.august2026')].map((month, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{t("employees.payslipForMonth", { month })}</span>
                        <span className="text-[10.5px] text-slate-400 font-mono">{t("employees.paidVia", { bank: bankName })}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {t("employees.paid")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Sticky Footer (View 360 Profile | Close | Edit) */}
        <div className="border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 px-6 flex items-center justify-between gap-3 shrink-0">
          <Link
            to={`/employees/${employee.id}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>{t("employees.viewProfile360")}</span>
          </Link>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Button: Close */}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-5 rounded-xl border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t("employees.close")}
            </Button>

            {/* Button: Edit */}
            <Button
              type="button"
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
              className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              {t("employees.edit")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeDetailsDrawer;
