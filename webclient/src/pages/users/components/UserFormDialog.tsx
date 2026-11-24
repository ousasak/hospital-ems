import React, { useState, useEffect } from 'react';
import {
  User,
  UserPlus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { User as IUser, Role, UserFormData } from '../types';
import { GlobalModal } from '@/components/common/GlobalModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  editingUser: IUser | null;
  roles: Role[];
  branches: { id: number; name: string }[];
  employees: any[];
  isLoading: boolean;
  companyName?: string;
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingUser,
  roles,
  branches,
  employees,
  isLoading,
  companyName = 'StaffStream Enterprise',
}) => {
  const { t } = useTranslation();

  const [form, setForm] = useState<UserFormData>({
    name: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Employee',
    company: companyName,
    branch: '',
    employee_id: null,
    status: 'active',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingUser) {
      const emp = editingUser.employee;
      const empWorkLocId = emp?.primary_assignment?.work_location_id || emp?.primary_assignment?.work_location?.id;
      setForm({
        name: editingUser.name || '',
        email: editingUser.email || '',
        username: editingUser.email ? editingUser.email.split('@')[0] : '',
        phone: emp?.phone || '',
        password: '',
        confirmPassword: '',
        role: editingUser.roles?.[0]?.name || 'Employee',
        company: companyName,
        branch: empWorkLocId ? String(empWorkLocId) : '',
        employee_id: emp?.id ?? null,
        status: (editingUser.status || '').toLowerCase() === 'inactive' ? 'inactive' : 'active',
      });
      setErrorMsg(null);
    } else {
      setForm({
        name: '',
        email: '',
        username: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: roles[0]?.name || 'Employee',
        company: companyName,
        branch: branches[0] ? String(branches[0].id) : '',
        employee_id: null,
        status: 'active',
      });
      setErrorMsg(null);
    }
  }, [editingUser, isOpen, companyName, roles, branches]);

  const handleSelectEmployee = (empIdStr: string) => {
    if (!empIdStr) {
      setForm((prev) => ({ ...prev, employee_id: null }));
      return;
    }
    const empId = Number(empIdStr);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name;
      const workLocId = emp.primary_assignment?.work_location_id || emp.primary_assignment?.work_location?.id;
      setForm((prev) => ({
        ...prev,
        employee_id: empId,
        name: prev.name ? prev.name : fullName,
        email: prev.email ? prev.email : (emp.email || ''),
        phone: emp.phone || prev.phone || '',
        branch: workLocId ? String(workLocId) : prev.branch,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.name.trim()) {
      setErrorMsg(t('users.messages.nameRequired', 'សូមបញ្ចូលឈ្មោះ'));
      return;
    }
    if (!form.email.trim()) {
      setErrorMsg(t('users.messages.emailRequired', 'សូមបញ្ចូលអ៊ីមែល'));
      return;
    }
    if (!editingUser) {
      if (!form.password || form.password.length < 6) {
        setErrorMsg(t('users.messages.passwordTooShort', 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ'));
        return;
      }
      if (form.password !== form.confirmPassword) {
        setErrorMsg(t('users.messages.passwordsDoNotMatch', 'ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ'));
        return;
      }
    } else {
      if (form.password && form.password.length < 6) {
        setErrorMsg(t('users.messages.passwordTooShort', 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ'));
        return;
      }
      if (form.password && form.password !== form.confirmPassword) {
        setErrorMsg(t('users.messages.passwordsDoNotMatch', 'ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ'));
        return;
      }
    }

    try {
      await onSubmit(form);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || t('users.messages.actionFailed', 'ប្រតិបត្តិការបរាជ័យ'));
    }
  };

  return (
    <GlobalModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      preventClose={isLoading}
      size="xl"
      icon={editingUser ? <User size={20} /> : <UserPlus size={20} />}
      title={
        editingUser
          ? t('users.dialog.editUserTitle', 'កែប្រែគណនីអ្នកប្រើប្រាស់')
          : t('users.dialog.createUserTitle', 'បង្កើតគណនីអ្នកប្រើប្រាស់ថ្មី')
      }
      description={
        editingUser
          ? t('users.dialog.editUserDesc', 'ធ្វើបច្ចុប្បន្នភាពព័ត៌មានគណនី តួនាទី ឬស្ថានភាពអ្នកប្រើប្រាស់។')
          : t('users.dialog.createUserDesc', 'បំពេញព័ត៌មានខាងក្រោមដើម្បីបង្កើតគណនី និងកំណត់សិទ្ធិចូលប្រើ។')
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
          >
            {t('common.cancel', 'បោះបង់')}
          </Button>
          <Button
            type="submit"
            form="user-form-dialog"
            size="sm"
            disabled={isLoading}
            className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {editingUser
              ? t('common.saveChanges', 'រក្សាទុកការកែប្រែ')
              : t('users.actions.addUser', 'បន្ថែមអ្នកប្រើប្រាស់')}
          </Button>
        </>
      }
    >
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form id="user-form-dialog" onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Account Information */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t('users.form.accountInfo', 'ព័ត៌មានគណនី')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('users.form.accountInfoSub', 'ព័ត៌មានមូលដ្ឋានសម្រាប់ចូលប្រើប្រព័ន្ធ')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="uf-name" className="text-xs font-medium">
                {t('users.form.fullName', 'ឈ្មោះពេញ')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="uf-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('users.form.fullNamePlaceholder', 'ឧ. សុខ ចិន្តា')}
                className="h-9 text-xs sm:text-sm"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="uf-email" className="text-xs font-medium">
                {t('users.form.email', 'អ៊ីមែលសាជីវកម្ម')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="uf-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t('users.form.emailPlaceholder', 'user@company.com')}
                className="h-9 text-xs sm:text-sm"
                required
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="uf-username" className="text-xs font-medium">
                {t('users.form.username', 'ឈ្មោះគណនី (Username)')}
              </Label>
              <Input
                id="uf-username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder={t('users.form.usernamePlaceholder', 'ឧ. sok.chenda')}
                className="h-9 text-xs sm:text-sm"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="uf-phone" className="text-xs font-medium">
                {t('users.form.phone', 'លេខទូរស័ព្ទ')}
              </Label>
              <Input
                id="uf-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t('users.form.phonePlaceholder', '012 345 678')}
                className="h-9 text-xs sm:text-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="uf-password" className="text-xs font-medium">
                {t('users.form.password', 'ពាក្យសម្ងាត់')}{' '}
                {!editingUser && <span className="text-destructive">*</span>}
                {editingUser && (
                  <span className="text-[11px] text-muted-foreground font-normal ml-1">
                    {t('users.form.passwordEditHint', '(ទុកនៅទំនេរ ប្រសិនបើមិនចង់ប្តូរ)')}
                  </span>
                )}
              </Label>
              <Input
                id="uf-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t('users.form.passwordPlaceholder', '••••••••')}
                className="h-9 text-xs sm:text-sm"
                required={!editingUser}
              />
            </div>

            {/* Confirm Password */}
            {(!editingUser || form.password) && (
              <div className="space-y-1.5">
                <Label htmlFor="uf-confirm-password" className="text-xs font-medium">
                  {t('users.form.confirmPassword', 'បញ្ជាក់ពាក្យសម្ងាត់')}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="uf-confirm-password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="h-9 text-xs sm:text-sm"
                  required
                />
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* SECTION 2: Organization & Role Information */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t('users.form.orgInfo', 'ព័ត៌មានស្ថាប័ន & តួនាទី')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('users.form.orgInfoSub', 'ការកំណត់អង្គភាព និងសិទ្ធិប្រតិបត្តិការ')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company */}
            <div className="space-y-1.5">
              <Label htmlFor="uf-company" className="text-xs font-medium">
                {t('users.form.company', 'ក្រុមហ៊ុន / ស្ថាប័ន')}
              </Label>
              <Input
                id="uf-company"
                value={form.company || companyName}
                readOnly
                className="h-9 text-xs sm:text-sm bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Branch */}
            <div className="space-y-1.5">
              <Label htmlFor="uf-branch" className="text-xs font-medium">
                {t('users.form.branch', 'សាខា / ទីតាំង')}
              </Label>
              <Select
                value={form.branch || '__none__'}
                onValueChange={(val) =>
                  setForm({ ...form, branch: val === '__none__' ? '' : val })
                }
              >
                <SelectTrigger id="uf-branch" className="h-9 text-xs sm:text-sm">
                  <SelectValue placeholder={t('users.form.branchPlaceholder', 'ជ្រើសរើសសាខា')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    {t('users.form.branchPlaceholder', 'ជ្រើសរើសសាខា')}
                  </SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="uf-role" className="text-xs font-medium">
                {t('users.form.assignedRole', 'តួនាទីកំណត់')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.role}
                onValueChange={(val) => setForm({ ...form, role: val })}
              >
                <SelectTrigger id="uf-role" className="h-9 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Link Employee Profile */}
            <div className="space-y-1.5">
              <Label htmlFor="uf-employee" className="text-xs font-medium">
                {t('users.form.linkEmployee', 'ភ្ជាប់ជាមួយបុគ្គលិក')}
              </Label>
              <Select
                value={form.employee_id ? String(form.employee_id) : '__none__'}
                onValueChange={(val) =>
                  handleSelectEmployee(val === '__none__' ? '' : val)
                }
              >
                <SelectTrigger id="uf-employee" className="h-9 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    {t('users.form.unlinked', 'អ្នកប្រើប្រាស់ប្រព័ន្ធ (មិនភ្ជាប់បុគ្គលិក)')}
                  </SelectItem>
                  {employees.map((emp) => {
                    const empName =
                      `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name;
                    return (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {empName} ({emp.employee_code || `EMP-${emp.id}`})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* SECTION 3: Account Status */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t('users.form.statusSection', 'ស្ថានភាពគណនី')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('users.form.statusSectionSub', 'កំណត់ថាតើគណនីនេះអាចចូលប្រើប្រព័ន្ធបានឬទេ')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                form.status === 'active'
                  ? 'border-emerald-500/70 bg-emerald-500/5 text-foreground font-medium'
                  : 'border-border bg-background hover:bg-muted/30 text-muted-foreground'
              }`}
            >
              <input
                type="radio"
                name="status"
                value="active"
                checked={form.status === 'active'}
                onChange={() => setForm({ ...form, status: 'active' })}
                className="sr-only"
              />
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  form.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                }`}
              />
              <span className="text-xs sm:text-sm">
                {t('users.form.statusActive', 'សកម្ម (អនុញ្ញាតឱ្យចូលប្រើ)')}
              </span>
            </label>

            <label
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                form.status === 'inactive'
                  ? 'border-rose-500/70 bg-rose-500/5 text-foreground font-medium'
                  : 'border-border bg-background hover:bg-muted/30 text-muted-foreground'
              }`}
            >
              <input
                type="radio"
                name="status"
                value="inactive"
                checked={form.status === 'inactive'}
                onChange={() => setForm({ ...form, status: 'inactive' })}
                className="sr-only"
              />
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  form.status === 'inactive' ? 'bg-rose-500' : 'bg-muted-foreground/40'
                }`}
              />
              <span className="text-xs sm:text-sm">
                {t('users.form.statusInactive', 'អសកម្ម (ផ្អាកការចូលប្រើ)')}
              </span>
            </label>
          </div>
        </div>
      </form>
    </GlobalModal>
  );
};
