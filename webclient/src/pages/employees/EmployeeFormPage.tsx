import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Trash2, User } from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import { organizationService } from '@/services/organizationService';
import { userService } from '@/services/userService';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/i18n';
import {
  FormLayout,
  FormContent,
  FormCard,
  FieldError,
  getFieldClass,
  EnterpriseDatePicker,
} from '@/components/common';
import { getAbsoluteImageUrl } from '@/utils/image';

const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.results)) return res.results;
  return [];
};

export interface EmployeeFormData {
  // Identity & Personal Information (employees table)
  employee_code: string;
  name: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | '';
  nationality: string;
  national_id: string;
  passport_number: string;
  avatar_url: string;
  employment_status: 'active' | 'probation' | 'suspended' | 'terminated' | 'resigned';

  // Hospital Medical Credentials (employees table)
  medical_license_number: string;
  license_expiry_date: string;
  specialization: string;

  // Contact & Address (employees table)
  email: string;
  personal_email: string;
  phone: string;
  city: string;
  address: string;

  // Organizational Placement & Assignment (employee_assignments table)
  department_id: string;
  position_id: string;
  supervisor_id: string;
  employment_type_id: string;
  join_date: string;
  probation_end_date: string;
  contract_end_date: string;

  // User Account (users table)
  user_id: string;
  create_user_account: boolean;
  user_role: string;
}

const BLANK_EMPLOYEE_FORM: EmployeeFormData = {
  employee_code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
  name: '',
  first_name: '',
  last_name: '',
  gender: 'male',
  date_of_birth: '',
  marital_status: 'single',
  nationality: 'Cambodian',
  national_id: '',
  passport_number: '',
  medical_license_number: '',
  license_expiry_date: '',
  specialization: '',
  avatar_url: '',
  employment_status: 'active',
  email: '',
  personal_email: '',
  phone: '',
  city: 'Tbong Khmum',
  address: '',
  department_id: '',
  position_id: '',
  supervisor_id: '',
  employment_type_id: '',
  join_date: new Date().toISOString().split('T')[0],
  probation_end_date: '',
  contract_end_date: '',
  user_id: '',
  create_user_account: false,
  user_role: 'Employee',
};

export const EmployeeFormPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const employeeId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const [formData, setFormData] = useState<EmployeeFormData>(BLANK_EMPLOYEE_FORM);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const setFormField = (field: keyof EmployeeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const generateAutoCode = () => {
    setFormField('employee_code', `EMP-${Math.floor(100 + Math.random() * 900)}`);
  };

  // Fetch employee details if editing
  const {
    data: employeeDetail,
    isLoading: isLoadingDetail,
  } = useQuery({
    queryKey: ['employee-detail', employeeId],
    queryFn: () => (employeeId ? employeeService.getEmployeeById(employeeId) : null),
    enabled: isEdit && !isNaN(employeeId as number),
  });

  // Organization Master Queries (Source of truth from database)
  const { data: rawDepartments } = useQuery({
    queryKey: ['organization-departments'],
    queryFn: () => organizationService.getDepartments().catch(() => []),
  });

  const { data: rawPositions } = useQuery({
    queryKey: ['organization-positions'],
    queryFn: () => organizationService.getPositions().catch(() => []),
  });

  const { data: rawEmploymentTypes } = useQuery({
    queryKey: ['employment-types'],
    queryFn: () => organizationService.getEmploymentTypes().catch(() => []),
  });

  const { data: rawManagers } = useQuery({
    queryKey: ['employee-managers'],
    queryFn: () => employeeService.getEmployees({ per_page: 100 }).catch(() => ({ data: [] })),
  });

  const { data: rawUsers } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => userService.getUsers({ per_page: 100 }).catch(() => []),
  });

  const departments = useMemo(() => extractArray(rawDepartments), [rawDepartments]);
  const positions = useMemo(() => extractArray(rawPositions), [rawPositions]);
  const employmentTypes = useMemo(() => extractArray(rawEmploymentTypes), [rawEmploymentTypes]);
  const managers = useMemo(() => extractArray(rawManagers?.data || rawManagers), [rawManagers]);
  const users = useMemo(() => extractArray(rawUsers?.data || rawUsers), [rawUsers]);

  const currentEmploymentTypeName = useMemo(() => {
    if (!formData.employment_type_id) {
      return t('employees.permanentContract');
    }
    const match = employmentTypes.find((et: any) => String(et.id) === String(formData.employment_type_id));
    return match?.name || t('employees.permanentContract');
  }, [formData.employment_type_id, employmentTypes, t]);

  // Populate data when editing
  useEffect(() => {
    if (employeeDetail && isEdit) {
      const emp = (employeeDetail as any)?.data || (employeeDetail as any)?.employee || employeeDetail;
      const primaryAssign = emp.primary_assignment || emp.primaryAssignment || emp.assignments?.[0];

      const fullName = emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();

      setFormData({
        employee_code: emp.employee_code || '',
        name: fullName,
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        gender: emp.gender || 'male',
        date_of_birth: emp.date_of_birth ? emp.date_of_birth.split('T')[0] : '',
        marital_status: emp.marital_status || 'single',
        nationality: emp.nationality || 'Cambodian',
        national_id: emp.national_id || '',
        passport_number: emp.passport_number || '',
        medical_license_number: emp.medical_license_number || '',
        license_expiry_date: emp.license_expiry_date ? emp.license_expiry_date.split('T')[0] : '',
        specialization: emp.specialization || '',
        avatar_url: emp.avatar_url || '',
        employment_status: emp.employment_status || 'active',
        email: emp.email || '',
        personal_email: emp.personal_email || '',
        phone: emp.phone || '',
        city: emp.city || 'Tbong Khmum',
        address: emp.address || '',
        department_id: String(primaryAssign?.department_id || ''),
        position_id: String(primaryAssign?.position_id || ''),
        supervisor_id: String(primaryAssign?.supervisor_id || ''),
        employment_type_id: String(primaryAssign?.employment_type_id || ''),
        join_date: emp.join_date ? emp.join_date.split('T')[0] : new Date().toISOString().split('T')[0],
        probation_end_date: emp.probation_end_date ? emp.probation_end_date.split('T')[0] : '',
        contract_end_date: emp.contract_end_date ? emp.contract_end_date.split('T')[0] : '',
        user_id: String(emp.user_id || ''),
        create_user_account: false,
        user_role: 'Employee',
      });

      if (emp.avatar_url) {
        setPhotoPreview(getAbsoluteImageUrl(emp.avatar_url));
      }
    }
  }, [employeeDetail, isEdit]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('employees.photoSizeTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setFormField('avatar_url', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormField('avatar_url', '');
  };

  // Create / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEdit && employeeId) {
        return employeeService.updateEmployee(employeeId, payload);
      }
      return employeeService.createEmployee(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee-detail', employeeId] });
      toast.success(
        isEdit
          ? t('employees.updateSuccessToast')
          : t('employees.createSuccessToast')
      );
      navigate('/employees');
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.message || err?.message || 'Failed to save employee';
      const errors = err?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const flatErrors: Record<string, string> = {};
        Object.entries(errors).forEach(([k, v]) => {
          flatErrors[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setFormErrors(flatErrors);
      }
      toast.error(detail, { code: err?.response?.status || 500 });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.employee_code.trim()) {
      errors.employee_code = t('employees.errCodeRequired');
    }
    const enteredName = formData.name.trim() || `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();
    if (!enteredName) {
      errors.name = t('employees.errNameRequired');
    }
    if (!formData.email.trim()) {
      errors.email = t('employees.errEmailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = t('employees.errEmailInvalid');
    }
    if (!formData.department_id) {
      errors.department_id = t('employees.errDeptRequired');
    }
    if (!formData.position_id) {
      errors.position_id = t('employees.errPosRequired');
    }
    if (!formData.join_date) {
      errors.join_date = t('employees.errJoinDateRequired');
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(t('employees.errCheckFields'));
      return;
    }

    const nameParts = enteredName.split(' ');
    const computedFirstName = formData.first_name.trim() || nameParts[0] || 'Employee';
    const computedLastName = formData.last_name.trim() || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Staff');

    // Prepare payload exactly matching backend schema
    const payload: any = {
      employee_code: formData.employee_code.trim(),
      name: enteredName,
      first_name: computedFirstName,
      last_name: computedLastName,
      gender: formData.gender,
      date_of_birth: formData.date_of_birth || null,
      marital_status: formData.marital_status || null,
      nationality: formData.nationality || 'Cambodian',
      national_id: formData.national_id.trim() || null,
      passport_number: formData.passport_number.trim() || null,
      medical_license_number: formData.medical_license_number.trim() || null,
      license_expiry_date: formData.license_expiry_date || null,
      specialization: formData.specialization.trim() || null,
      avatar_url: formData.avatar_url || null,
      employment_status: formData.employment_status,
      email: formData.email.trim(),
      personal_email: formData.personal_email.trim() || null,
      phone: formData.phone.trim() || null,
      city: formData.city.trim() || null,
      address: formData.address.trim() || null,
      // Assignment
      department_id: parseInt(formData.department_id, 10),
      position_id: parseInt(formData.position_id, 10),
      supervisor_id: formData.supervisor_id ? parseInt(formData.supervisor_id, 10) : null,
      employment_type_id: formData.employment_type_id ? parseInt(formData.employment_type_id, 10) : null,
      join_date: formData.join_date,
      probation_end_date: formData.probation_end_date || null,
      contract_end_date: formData.contract_end_date || null,
      // User Account
      user_id: formData.user_id ? parseInt(formData.user_id, 10) : null,
      create_user_account: formData.create_user_account,
      user_role: formData.user_role || 'Employee',
    };

    saveMutation.mutate(payload);
  };

  const labelCls = 'block text-xs font-semibold text-foreground/90 dark:text-slate-200 mb-1.5';

  return (
    <FormLayout
      onSubmit={handleSubmit}
      isLoading={isLoadingDetail}
      loadingText={t('common.loading')}
      headerProps={{
        title: isEdit
          ? t('employees.editEmployee')
          : t('employees.addEmployee'),
        subtitle: t(
          'employees.employeeManagementSubtitle',
          t('employees.formSubtitle')
        ),
        breadcrumbs: [
          { label: t('employees.home'), href: '/' },
          { label: t('employees.employeeManagement'), href: '/employees' },
          { label: isEdit ? t('employees.edit') : t('employees.create'), active: true },
        ],
        backPath: '/employees',
        backLabel: t('employees.back'),
        frameless: true,
      }}
      footerProps={{
        cancelPath: '/employees',
        cancelLabel: t('employees.cancel'),
        submitLabel: isEdit
          ? t('employees.saveChanges')
          : t('employees.save'),
        isSubmitting: saveMutation.isPending,
        isEdit,
      }}
    >
      <FormContent maxWidth="full" layout="stack" className="space-y-6">
        {/* CARD 1: Basic Information */}
        <FormCard
          title={t('employees.basicInfo')}
          subtitle={t(
            'employees.basicInfoDesc',
            t('employees.basicInfoDesc')
          )}
        >
          {/* Photo Avatar Section (Identical to pos-ecommerce) */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border/70 dark:border-slate-800 bg-muted/20 dark:bg-slate-800/40 mb-6">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-border/80 dark:border-slate-700 shrink-0 bg-background dark:bg-slate-900 flex items-center justify-center">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Employee Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="size-7 text-muted-foreground/40" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="employee-photo-input"
                  className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Camera size={13} />
                  <span>
                    {photoPreview
                      ? t('employees.changePhoto')
                      : t('employees.uploadPhoto')}
                  </span>
                  <input
                    id="employee-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="h-8 px-2.5 rounded-lg border border-rose-500/30 dark:border-rose-500/40 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <Trash2 size={13} />
                    <span>{t('employees.removePhoto')}</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground dark:text-slate-400">
                {t('employees.photoConstraint')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Employee ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>
                  {t('employees.code')} <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateAutoCode}
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                >
                  {t('employees.auto')}
                </button>
              </div>
              <input
                type="text"
                value={formData.employee_code}
                onChange={(e) => setFormField('employee_code', e.target.value)}
                placeholder="EMP-0001"
                className={getFieldClass(
                  formErrors.employee_code,
                  'form-input font-mono uppercase'
                )}
                required
              />
              <FieldError error={formErrors.employee_code} />
            </div>

            {/* Full Name */}
            <div>
              <label className={labelCls}>
                {t('employees.fullName')} <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const parts = val.trim().split(' ');
                  setFormData((prev) => ({
                    ...prev,
                    name: val,
                    first_name: parts[0] || '',
                    last_name: parts.slice(1).join(' ') || parts[0] || '',
                  }));
                }}
                placeholder={t('employees.fullNamePlaceholder')}
                className={getFieldClass(
                  formErrors.name,
                  'form-input'
                )}
                required
              />
              <FieldError error={formErrors.name} />
            </div>

            {/* Employment Status */}
            <div>
              <label className={labelCls}>{t('employees.status')}</label>
              <select
                value={formData.employment_status}
                onChange={(e) => setFormField('employment_status', e.target.value as any)}
                className="form-select cursor-pointer font-semibold"
              >
                <option value="active">{t('employees.active')}</option>
                <option value="probation">{t('employees.probation')}</option>
                <option value="suspended">{t('employees.suspended')}</option>
                <option value="terminated">{t('employees.terminated')}</option>
                <option value="resigned">{t('employees.resigned')}</option>
              </select>
            </div>

            {/* Work Email */}
            <div>
              <label className={labelCls}>
                {t('employees.workEmail', 'អ៊ីមែលការងារ / ផ្លូវការ')} <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormField('email', e.target.value)}
                placeholder="employee@hospital.gov.kh"
                className={getFieldClass(
                  formErrors.email,
                  'form-input'
                )}
                required
              />
              <FieldError error={formErrors.email} />
            </div>

            {/* Phone */}
            <div>
              <label className={labelCls}>
                {t('employees.phone')}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormField('phone', e.target.value)}
                placeholder="012 345 678"
                className="form-input font-mono"
              />
            </div>

            {/* National ID */}
            <div>
              <label className={labelCls}>
                {t('employees.nationalId')}
              </label>
              <input
                type="text"
                value={formData.national_id}
                onChange={(e) => setFormField('national_id', e.target.value)}
                placeholder="KH-01234567"
                className="form-input font-mono"
              />
            </div>

            {/* Gender */}
            <div>
              <label className={labelCls}>{t('employees.gender')}</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormField('gender', e.target.value as any)}
                className="form-select cursor-pointer"
              >
                <option value="male">{t('employees.male')}</option>
                <option value="female">{t('employees.female')}</option>
                <option value="other">{t('employees.otherGender')}</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <EnterpriseDatePicker
                label={t('employees.dateOfBirth')}
                value={formData.date_of_birth}
                onChange={(v) => setFormField('date_of_birth', v)}
                placeholder="YYYY-MM-DD"
              />
            </div>

            {/* Marital Status */}
            <div>
              <label className={labelCls}>
                {t('employees.maritalStatus')}
              </label>
              <select
                value={formData.marital_status}
                onChange={(e) => setFormField('marital_status', e.target.value as any)}
                className="form-select cursor-pointer"
              >
                <option value="single">{t('employees.single')}</option>
                <option value="married">{t('employees.married')}</option>
                <option value="divorced">{t('employees.divorced')}</option>
                <option value="widowed">{t('employees.widowed')}</option>
              </select>
            </div>

            {/* Nationality */}
            <div>
              <label className={labelCls}>
                {t('employees.nationality')}
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormField('nationality', e.target.value)}
                placeholder={t('employees.nationalityPlaceholder')}
                className="form-input"
              />
            </div>

            {/* Passport Number */}
            <div>
              <label className={labelCls}>
                {t('employees.passportNumber')}
              </label>
              <input
                type="text"
                value={formData.passport_number}
                onChange={(e) => setFormField('passport_number', e.target.value)}
                placeholder="N01234567"
                className="form-input font-mono uppercase"
              />
            </div>

            {/* Personal Email */}
            <div>
              <label className={labelCls}>
                {t('employees.personalEmail')}
              </label>
              <input
                type="email"
                value={formData.personal_email}
                onChange={(e) => setFormField('personal_email', e.target.value)}
                placeholder="personal@gmail.com"
                className="form-input"
              />
            </div>

            {/* City / Province */}
            <div>
              <label className={labelCls}>
                {t('employees.cityProvince')}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormField('city', e.target.value)}
                placeholder="Tbong Khmum"
                className="form-input"
              />
            </div>

            {/* Medical License Number */}
            <div>
              <label className={labelCls}>
                {t('employees.medicalLicenseNo')}
              </label>
              <input
                type="text"
                value={formData.medical_license_number}
                onChange={(e) => setFormField('medical_license_number', e.target.value)}
                placeholder="DOC-2024-001"
                className="form-input font-mono uppercase"
              />
            </div>

            {/* License Expiry Date */}
            <div>
              <EnterpriseDatePicker
                label={t('employees.licenseExpiryDate')}
                value={formData.license_expiry_date}
                onChange={(v) => setFormField('license_expiry_date', v)}
                placeholder="YYYY-MM-DD"
              />
            </div>

            {/* Medical Specialization */}
            <div>
              <label className={labelCls}>
                {t('employees.medicalSpecialization')}
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormField('specialization', e.target.value)}
                placeholder={t('employees.medicalSpecializationPlaceholder')}
                className="form-input"
              />
            </div>

            {/* Residential Address */}
            <div className="sm:col-span-2">
              <label className={labelCls}>
                {t('employees.residentialAddress')}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormField('address', e.target.value)}
                placeholder={t('employees.residentialAddressPlaceholder')}
                className="form-input"
              />
            </div>
          </div>
        </FormCard>

        {/* CARD 2: Placement & Organizational Structure */}
        <FormCard
          title={t('employees.placementStructure')}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              {currentEmploymentTypeName}
            </span>
          }
          subtitle={t(
            'employees.placementStructureDesc',
            t('employees.placementDesc')
          )}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Hospital Organization */}
            <div>
              <label className={labelCls}>
                {t('employees.hospital')} <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                readOnly
                value={t('employees.hospitalDefaultName')}
                className="form-input bg-muted/30 text-foreground font-semibold cursor-not-allowed select-none"
              />
            </div>

            {/* Department */}
            <div>
              <label className={labelCls}>
                {t('employees.department')} <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormField('department_id', e.target.value)}
                className={getFieldClass(
                  formErrors.department_id,
                  'form-select cursor-pointer'
                )}
                required
              >
                <option value="">{t('employees.selectDepartment')}</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.code ? `(${d.code})` : ''}
                  </option>
                ))}
              </select>
              <FieldError error={formErrors.department_id} />
            </div>

            {/* Position */}
            <div>
              <label className={labelCls}>
                {t('employees.position')} <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <select
                value={formData.position_id}
                onChange={(e) => setFormField('position_id', e.target.value)}
                className={getFieldClass(
                  formErrors.position_id,
                  'form-select cursor-pointer'
                )}
                required
              >
                <option value="">{t('employees.selectPosition')}</option>
                {positions.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.title}
                  </option>
                ))}
              </select>
              <FieldError error={formErrors.position_id} />
            </div>

            {/* Direct Supervisor */}
            <div>
              <label className={labelCls}>
                {t('employees.supervisor')}
              </label>
              <select
                value={formData.supervisor_id}
                onChange={(e) => setFormField('supervisor_id', e.target.value)}
                className="form-select cursor-pointer"
              >
                <option value="">
                  {t('employees.noSupervisorTop')}
                </option>
                {managers.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.full_name} ({m.employee_code || m.employee_number})
                  </option>
                ))}
              </select>
            </div>

            {/* Linked User Account */}
            <div>
              <label className={labelCls}>
                {t('employees.linkUserAccount')}
              </label>
              <select
                value={formData.user_id}
                onChange={(e) => setFormField('user_id', e.target.value)}
                className="form-select cursor-pointer"
              >
                <option value="">{t('employees.noLinkedUser')}</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Employment Type */}
            <div>
              <label className={labelCls}>
                {t('employees.contractType')}
              </label>
              <select
                value={formData.employment_type_id}
                onChange={(e) => setFormField('employment_type_id', e.target.value)}
                className="form-select cursor-pointer"
              >
                <option value="">{t('employees.selectType')}</option>
                {employmentTypes.length > 0 ? (
                  employmentTypes.map((et: any) => (
                    <option key={et.id} value={et.id}>
                      {et.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">{t('employees.permanentContract')}</option>
                    <option value="2">{t('employees.fdcContract')}</option>
                    <option value="3">{t('employees.probationContract')}</option>
                  </>
                )}
              </select>
            </div>

            {/* Join Date */}
            <div>
              <EnterpriseDatePicker
                label={t('employees.joinDate')}
                required
                value={formData.join_date}
                onChange={(v) => setFormField('join_date', v)}
                placeholder="YYYY-MM-DD"
                error={formErrors.join_date}
              />
              <FieldError error={formErrors.join_date} />
            </div>

            {/* Contract End Date */}
            <div>
              <EnterpriseDatePicker
                label={t('employees.contractEndDate')}
                value={formData.contract_end_date}
                onChange={(v) => setFormField('contract_end_date', v)}
                placeholder="YYYY-MM-DD"
              />
            </div>

            {/* Probation End Date */}
            <div>
              <EnterpriseDatePicker
                label={t('employees.probationEndDate')}
                value={formData.probation_end_date}
                onChange={(v) => setFormField('probation_end_date', v)}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>

          {/* Optional: Create User Account for new employee */}
          {!isEdit && (
            <div className="mt-5 pt-4 border-t border-border/60">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.create_user_account}
                  onChange={(e) => setFormField('create_user_account', e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-xs font-semibold text-foreground">
                  {t(
                    'employees.createUserAccount',
                    t('employees.autoCreateAccountDesc')
                  )}
                </span>
              </label>

              {formData.create_user_account && (
                <div className="mt-3 max-w-xs">
                  <label className={labelCls}>
                    {t('employees.systemRole')}
                  </label>
                  <select
                    value={formData.user_role}
                    onChange={(e) => setFormField('user_role', e.target.value)}
                    className="form-select cursor-pointer font-medium"
                  >
                    <option value="Employee">Employee / Staff</option>
                    <option value="Doctor">Doctor / Medical Specialist</option>
                    <option value="Nurse">Nurse / Medical Attendant</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </FormCard>
      </FormContent>
    </FormLayout>
  );
};

export default EmployeeFormPage;
