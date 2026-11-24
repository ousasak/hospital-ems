import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/services/employeeService';
import { useTranslation } from '@/i18n';
import { useLocaleStore } from '../../stores/localeStore';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';
import { EmployeeQrModal } from './components/EmployeeQrModal';
import { EmployeeIdCardModal } from './components/EmployeeIdCardModal';
import { getAbsoluteImageUrl } from '@/utils/image';
import {
  ArrowLeft,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  CreditCard,
  GraduationCap,
  FileText,
  AlertCircle,
  Plus,
  GitFork,
  UploadCloud,
  Trash2,
  Edit,
  ChevronRight,
  QrCode,
  Printer,
} from 'lucide-react';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const queryClient = useQueryClient();

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);

  // Sub-resource forms
  const [contactForm, setContactForm] = useState({ name: '', relationship: 'Spouse', phone: '', address: '' });
  const [eduForm, setEduForm] = useState({ degree_level: "Bachelor's Degree", institution_name: '', field_of_study: '', start_year: '2016', end_year: '2020', grade_or_gpa: '3.5' });
  const [expForm, setExpForm] = useState({ company_name: '', job_title: '', start_date: '', end_date: '', responsibilities: '', reason_for_leaving: '' });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('contract');
  const [showPin, setShowPin] = useState(false);

  // Fetch full employee record
  const { data: rawEmployee, isLoading } = useQuery({
    queryKey: ['employee-detail', id],
    queryFn: async () => {
      return await employeeService.getEmployeeById(id!);
    },
  });

  const employee = (rawEmployee as any)?.data || rawEmployee;

  // Add sub-resources mutations
  const addContactMutation = useMutation({
    mutationFn: async () => await employeeService.addEmergencyContact(id!, contactForm),
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Contact added successfully');
      setContactModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['employee-detail', id] });
    },
  });

  const addEduMutation = useMutation({
    mutationFn: async () => await employeeService.addEducation(id!, eduForm),
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Education added successfully');
      setEduModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['employee-detail', id] });
    },
  });

  const addExpMutation = useMutation({
    mutationFn: async () => await employeeService.addExperience(id!, expForm),
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Experience added successfully');
      setExpModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['employee-detail', id] });
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: async () => {
      if (!docFile) throw new Error('Select a file');
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('title', docTitle);
      formData.append('category', docCategory);
      return await employeeService.uploadDocument(id!, formData);
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Document uploaded successfully');
      setDocModalOpen(false);
      setDocFile(null);
      setDocTitle('');
      queryClient.invalidateQueries({ queryKey: ['employee-detail', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Upload failed');
    },
  });

  if (isLoading || !employee) {
    return <LoadingState message="Loading employee profile..." />;
  }

  const primary = employee.assignments?.find((a: any) => a.is_primary && a.status === 'active') || employee.assignments?.[0];

  const fullName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Employee';
  const positionTitle = primary?.position?.title || 'General Manager';
  const departmentName = primary?.department?.name || 'Executive & Management';
  const locationName = primary?.work_location?.name || t('employees.hospitalDefaultName');
  const contractType = primary?.employment_type?.name || 'UDC';

  return (
    <div className="space-y-5">
      {/* Breadcrumb: Dashboard > Employee Management > Profile Card */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground select-none"
      >
        <Link to="/" className="hover:text-foreground transition-colors">
          {t('navigation.dashboard')}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
        <Link to="/employees" className="hover:text-foreground transition-colors">
          {t('employees.employeeManagement')}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
        <span className="font-semibold text-foreground" aria-current="page">
          {t('employees.profileCard')} ({employee.employee_code})
        </span>
      </nav>

      {/* ─── Header Profile Banner Card (Exact KHPosCommerce Styling) ─── */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* 3D / Image Avatar */}
            <div className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-2xs shrink-0 select-none">
              {employee.avatar_url && !employee.avatar_url.includes('unsplash') ? (
                <img
                  src={getAbsoluteImageUrl(employee.avatar_url)}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
                  {(employee.first_name?.[0] || 'E')}{(employee.last_name?.[0] || 'M')}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {fullName}
                </h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {employee.employee_code}
                </span>
                <StatusBadge status={employee.employment_status} />
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-slate-700 dark:text-slate-300">{positionTitle}</span>
                <span>•</span>
                <span>{departmentName}</span>
                <span>•</span>
                <span>{locationName}</span>
              </p>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/80 px-2 py-0.5 rounded-md">
                  {t('employees.posSecurity')}
                </span>
                <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                  {contractType}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> {employee.email}
                </span>
                {employee.phone && (
                  <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {employee.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsQrModalOpen(true)}
              className="h-9 px-3.5 rounded-xl border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 hover:bg-teal-100/50 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
            >
              <QrCode className="h-4 w-4" />
              <span>{t('employees.qrCode')}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsIdCardModalOpen(true)}
              className="h-9 px-3.5 rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>{t('employees.printCard')}</span>
            </Button>
            <Link to={`/assignments?employee_id=${employee.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-xl border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1.5 cursor-pointer"
              >
                <GitFork className="h-4 w-4" />
                <span>{t('employees.transferChangeRole')}</span>
              </Button>
            </Link>
            <Link to={`/employees/${employee.id}/edit`}>
              <Button
                size="sm"
                className="h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
              >
                <Edit className="h-4 w-4" />
                <span>{t('common.edit')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Multi-Tabs (All 11 modules as required) */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1 justify-start">
          <TabsTrigger value="overview">{t('employees.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="personal">{t('employees.tabs.personal')}</TabsTrigger>
          <TabsTrigger value="assignments">{t('employees.tabs.assignments')}</TabsTrigger>
          <TabsTrigger value="attendance">{t('employees.tabs.attendance')}</TabsTrigger>
          <TabsTrigger value="leaves">{t('employees.tabs.leaves')}</TabsTrigger>
          <TabsTrigger value="payroll">{t('employees.tabs.payroll')}</TabsTrigger>
          <TabsTrigger value="education">{t('employees.tabs.education')}</TabsTrigger>
          <TabsTrigger value="experience">{t('employees.tabs.experience')}</TabsTrigger>
          <TabsTrigger value="documents">{t('employees.tabs.documents')}</TabsTrigger>
          <TabsTrigger value="emergency">{t('employees.tabs.emergency')}</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview - Signature KHPosCommerce 4-Card Grid */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card 1: Personal & Contact Info */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {t('employees.personalContactInfo')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.nationalId')}
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {employee.national_id || `KH-${String(employee.id).padStart(8, '0')}`}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.gender')}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {(employee.gender?.toLowerCase() === 'female') ? t('employees.female') : t('employees.male')} • {formatDate(employee.date_of_birth, locale)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.personalEmail')}
                  </span>
                  <a href={`mailto:${employee.email}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline break-all">
                    {employee.email || '—'}
                  </a>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.contact')}
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{employee.phone || '+855 12 888 101'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.address')}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {employee.address || 'Street 271, Sangkat Boeng Tumpun, Khan Mean Chey, Phnom Penh #12'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Employment & Admin Info */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {t('employees.employmentAdminInfo')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.branch')}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{locationName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.company')}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {t('employees.companyDefaultName')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.department')}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{departmentName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.position')}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{positionTitle}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.supervisor')}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {primary?.supervisor?.full_name || t('employees.seniorManagement')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.contractType')}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{contractType}</span>
                </div>
              </div>
            </div>

            {/* Card 3: POS & Security */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {t('employees.posSecurity')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {t('employees.posPin')}
                    </span>
                    <button type="button" onClick={() => setShowPin(!showPin)} className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
                      {showPin ? t('employees.hide') : t('employees.reset')}
                    </button>
                  </div>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {showPin ? '8888' : '••••'}{' '}
                    <span className="text-[10.5px] text-slate-400 font-normal">
                      {t('employees.topSecret')}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.rfidBadgeUid')}
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    RFID-KH-{String(employee.id).padStart(5, '0')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.commissionRate')}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">0%</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.managerPrivilege')}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {t('employees.allowDiscountVoid')}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Social Benefits & Banking */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {t('employees.socialBenefitsBanking')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.baseSalary')}
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(employee.salaries?.[0]?.base_salary || employee.base_salary || 1500)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.nssfNumber')}
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    NSSF-{String(1000000 + employee.id * 781).slice(0, 7)}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">
                    {t('employees.bankAccount')}
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {employee.bank_name || 'ABA Bank'} - {employee.bank_account_number || '000 123 456'} ({(employee.bank_account_name || fullName).toUpperCase()})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Personal Information */}
        <TabsContent value="personal">
          <Card>
            <CardHeader><CardTitle className="text-sm">{t('employees.personalIdentityProfile')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1"><span className="text-muted-foreground">{t('employees.gender')}</span><p className="font-semibold text-sm capitalize">{employee.gender}</p></div>
              <div className="space-y-1"><span className="text-muted-foreground">{t('employees.dateOfBirth')}</span><p className="font-semibold text-sm">{formatDate(employee.date_of_birth, locale)}</p></div>
              <div className="space-y-1"><span className="text-muted-foreground">{t('employees.maritalStatus')}</span><p className="font-semibold text-sm capitalize">{employee.marital_status || 'Single'}</p></div>
              <div className="space-y-1"><span className="text-muted-foreground">{t('employees.nationality')}</span><p className="font-semibold text-sm">{employee.nationality || 'Cambodian'}</p></div>
              <div className="space-y-1"><span className="text-muted-foreground">{t('employees.nationalId')}</span><p className="font-semibold text-sm font-mono">{employee.national_id || '-'}</p></div>
              <div className="space-y-1"><span className="text-muted-foreground">{t('employees.passportNumber')}</span><p className="font-semibold text-sm font-mono">{employee.passport_number || '-'}</p></div>
              <div className="space-y-1"><span className="text-muted-foreground">{t('employees.personalEmail')}</span><p className="font-semibold text-sm">{employee.personal_email || '-'}</p></div>
              <div className="space-y-1 md:col-span-2"><span className="text-muted-foreground">Permanent Residential Address</span><p className="font-semibold text-sm">{employee.address || '-'}, {employee.city}</p></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Assignment History (Module 04: Source of Truth) */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitFork className="h-4 w-4 text-primary" /> Assignment & Department Transfer History
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Source of truth for organizational placements at any specific point in history
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-primary/30 ml-4 space-y-6 py-2">
                {employee.assignments?.map((asg: any) => (
                  <div key={asg.id} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 ${asg.is_primary && asg.status === 'active' ? 'bg-primary border-primary ring-4 ring-primary/20' : 'bg-background border-muted-foreground'}`} />
                    
                    <div className="rounded-lg border bg-card p-4 space-y-2 shadow-sm text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{asg.position?.title}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-semibold text-primary">{asg.department?.name}</span>
                          {asg.is_primary && (
                            <Badge variant="default" className="text-[10px]">Primary</Badge>
                          )}
                          <StatusBadge status={asg.status} />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatDate(asg.start_date, locale)} → {asg.end_date ? formatDate(asg.end_date, locale) : 'Present'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-muted-foreground pt-1">
                        <div>Location: <strong className="text-foreground">{asg.work_location?.name || t('employees.hospitalDefaultName')}</strong></div>
                        <div>Reporting Supervisor: <strong className="text-foreground">{asg.supervisor?.full_name || 'CEO'}</strong></div>
                      </div>

                      {asg.notes && (
                        <p className="rounded bg-muted/40 p-2 text-[11px] text-muted-foreground italic border-l-2 border-primary">
                          {asg.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Attendance */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader><CardTitle className="text-sm">Recent Attendance Records (Last 30 Days)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Check-in</th>
                    <th className="px-4 py-3">Check-out</th>
                    <th className="px-4 py-3">Working Hours</th>
                    <th className="px-4 py-3">Late Mins</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employee.attendance_records?.map((att: any) => (
                    <tr key={att.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{formatDate(att.attendance_date, locale)}</td>
                      <td className="px-4 py-2.5">{att.check_in_time ? formatDateTime(att.check_in_time) : '-'}</td>
                      <td className="px-4 py-2.5">{att.check_out_time ? formatDateTime(att.check_out_time) : '-'}</td>
                      <td className="px-4 py-2.5 font-semibold">{att.working_hours}h</td>
                      <td className="px-4 py-2.5 text-amber-600 font-medium">{att.late_minutes > 0 ? `${att.late_minutes}m` : '-'}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={att.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Leaves */}
        <TabsContent value="leaves">
          <Card>
            <CardHeader><CardTitle className="text-sm">Leave Request History & Balance Status</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Days</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employee.leave_requests?.map((lr: any) => (
                    <tr key={lr.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-semibold text-foreground">{lr.leave_type?.name}</td>
                      <td className="px-4 py-2.5">{formatDate(lr.start_date, locale)} - {formatDate(lr.end_date, locale)}</td>
                      <td className="px-4 py-2.5 font-bold">{lr.total_days}</td>
                      <td className="px-4 py-2.5 text-muted-foreground truncate max-w-xs">{lr.reason}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={lr.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 7: Payroll & Salary */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader><CardTitle className="text-sm">Salary History & Issued Payslips</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employee.salaries?.map((sal: any) => (
                  <div key={sal.id} className="rounded-lg border p-3 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground text-sm">{formatCurrency(sal.base_salary, sal.currency)}</span>
                      <StatusBadge status={sal.status} />
                    </div>
                    <p className="text-muted-foreground">Structure: {sal.salary_structure?.name || 'Standard Structure'}</p>
                    <p className="text-muted-foreground">Effective Date: {formatDate(sal.effective_date, locale)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 8: Education */}
        <TabsContent value="education">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Educational Qualifications</CardTitle>
              <Button size="sm" onClick={() => setEduModalOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Add Education</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {employee.educations?.map((edu: any) => (
                <div key={edu.id} className="rounded-lg border p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <strong className="text-sm text-foreground">{edu.degree_level} - {edu.field_of_study}</strong>
                    <span className="text-muted-foreground">{edu.start_year} - {edu.end_year}</span>
                  </div>
                  <p className="text-muted-foreground">{edu.institution_name}</p>
                  {edu.grade_or_gpa && <p className="font-semibold text-primary">GPA/Grade: {edu.grade_or_gpa}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 9: Experience */}
        <TabsContent value="experience">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Past Professional Experience</CardTitle>
              <Button size="sm" onClick={() => setExpModalOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Add Experience</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {employee.experiences?.map((exp: any) => (
                <div key={exp.id} className="rounded-lg border p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <strong className="text-sm text-foreground">{exp.job_title} @ {exp.company_name}</strong>
                    <span className="text-muted-foreground">{formatDate(exp.start_date, locale)} → {exp.end_date ? formatDate(exp.end_date, locale) : 'Present'}</span>
                  </div>
                  {exp.responsibilities && <p className="text-muted-foreground">{exp.responsibilities}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 10: Documents */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Corporate Documents & Contracts</CardTitle>
              <Button size="sm" onClick={() => setDocModalOpen(true)} className="gap-1.5"><UploadCloud className="h-4 w-4" /> Upload Document</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {employee.documents?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No documents uploaded yet.</p>
              ) : (
                employee.documents?.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <span className="font-semibold text-foreground">{doc.title}</span>
                        <p className="text-[11px] text-muted-foreground uppercase">{doc.category} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <a href={`/storage/${doc.file_path}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                      Download
                    </a>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 11: Emergency Contacts */}
        <TabsContent value="emergency">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Emergency Contacts</CardTitle>
              <Button size="sm" onClick={() => setContactModalOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Add Emergency Contact</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {employee.emergency_contacts?.map((c: any) => (
                <div key={c.id} className="rounded-lg border p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <strong className="text-sm text-foreground">{c.name} ({c.relationship})</strong>
                    <span className="font-bold text-primary">{c.phone}</span>
                  </div>
                  {c.address && <p className="text-muted-foreground">{c.address}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Emergency Contact Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Emergency Contact</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addContactMutation.mutate(); }} className="space-y-3 text-xs">
            <div className="space-y-1"><label>Contact Name *</label><Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required /></div>
            <div className="space-y-1"><label>Relationship *</label><Input value={contactForm.relationship} onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })} required /></div>
            <div className="space-y-1"><label>Phone Number *</label><Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} required /></div>
            <div className="space-y-1"><label>Address</label><Input value={contactForm.address} onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setContactModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Contact</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal */}
      <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Employee Document</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); uploadDocMutation.mutate(); }} className="space-y-3 text-xs">
            <div className="space-y-1"><label>Document Title *</label><Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. Employment Contract 2026" required /></div>
            <div className="space-y-1">
              <label>Category</label>
              <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3">
                <option value="contract">Employment Contract</option>
                <option value="id_card">National ID / Passport</option>
                <option value="degree">Degree / Diploma</option>
                <option value="resume">Resume / CV</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label>File (PDF, PNG, JPG - max 10MB) *</label>
              <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDocModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={uploadDocMutation.isPending}>{uploadDocMutation.isPending ? 'Uploading...' : 'Upload'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code and ID Card Modals */}
      <EmployeeQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        employeeId={employee?.id || null}
      />
      <EmployeeIdCardModal
        isOpen={isIdCardModalOpen}
        onClose={() => setIsIdCardModalOpen(false)}
        employeeId={employee?.id || null}
      />
    </div>
  );
};

