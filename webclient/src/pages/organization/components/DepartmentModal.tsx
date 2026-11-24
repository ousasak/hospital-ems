import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/services/organizationService';
import { useLocaleStore } from '@/stores/localeStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CloseButton } from '@/components/common/CloseButton';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';

export interface DepartmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dept?: any;
  departments: any[];
  employees: any[];
  onSuccess?: () => void;
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  open,
  onOpenChange,
  dept,
  departments = [],
  employees = [],
  onSuccess,
}) => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const isEdit = Boolean(dept);

  const [form, setForm] = useState({
    name: '',
    code: '',
    parent_id: '',
    manager_id: '',
    description: '',
    status: 'active',
  });

  useEffect(() => {
    if (dept) {
      setForm({
        name: dept.name || '',
        code: dept.code || '',
        parent_id: dept.parent_id ? String(dept.parent_id) : '',
        manager_id: dept.manager_id ? String(dept.manager_id) : '',
        description: dept.description || '',
        status: dept.status || 'active',
      });
    } else {
      setForm({
        name: '',
        code: '',
        parent_id: '',
        manager_id: '',
        description: '',
        status: 'active',
      });
    }
  }, [dept, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        manager_id: form.manager_id ? Number(form.manager_id) : null,
        description: form.description.trim() || null,
        status: form.status,
      };

      if (isEdit) {
        return await organizationService.updateDepartment(dept.id, payload);
      }
      return await organizationService.createDepartment(payload);
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || t('common.success', 'ប្រតិបត្តិការបានជោគជ័យ'));
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['org-chart-tree'] });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('common.error', 'មានកំហុសមួយបានកើតឡើង'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !saveMutation.isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans">
        {/* ======================================================== */}
        {/* 1. GLOBAL STANDARD MODAL HEADER                          */}
        {/* ======================================================== */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                <Building2 size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {isEdit
                    ? t('organization.editDepartment', 'កែប្រែនាយកដ្ឋាន')
                    : t('organization.createNewDept', 'បង្កើតនាយកដ្ឋានថ្មី')}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t(
                    'organization.deptSubtitle',
                    'រចនាសម្ព័ន្ធអង្គភាព ប្រធានផ្នែក និងចំនួនបុគ្គលិក'
                  )}
                </DialogDescription>
              </div>
            </div>

            <CloseButton onClose={() => onOpenChange(false)} size="md" variant="default" />
          </div>
        </DialogHeader>

        {/* ======================================================== */}
        {/* 2. GLOBAL STANDARD FORM BODY                             */}
        {/* ======================================================== */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Department Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="dept-name"
              className="font-semibold text-foreground text-xs block"
            >
              {t('organization.deptName', 'ឈ្មោះនាយកដ្ឋាន')}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="dept-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('organization.deptNamePlaceholder', 'ឧ. ផ្នែកសង្គ្រោះបន្ទាន់')}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Department Code & Status (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="dept-code"
                className="font-semibold text-foreground text-xs block"
              >
                {t('organization.deptCode', 'លេខកូដនាយកដ្ឋាន')}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="dept-code"
                required
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="EMERG"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-mono font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all uppercase shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="dept-status"
                className="font-semibold text-foreground text-xs block"
              >
                {t('common.status', 'ស្ថានភាព')}
              </label>
              <select
                id="dept-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              >
                <option value="active">{t('status.active', 'សកម្ម')}</option>
                <option value="inactive">{t('status.inactive', 'អសកម្ម')}</option>
              </select>
            </div>
          </div>

          {/* Parent Department Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="dept-parent"
              className="font-semibold text-foreground text-xs block"
            >
              {t('organization.parentDept', 'នាយកដ្ឋានមេ')}
            </label>
            <select
              id="dept-parent"
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
            >
              <option value="">{t('organization.executiveUnit', 'ថ្នាក់ដឹកនាំកំពូល (គ្មាននាយកដ្ឋានមេ - Root)')}</option>
              {departments
                .filter((d: any) => !isEdit || d.id !== dept.id)
                .map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.code ? `[${d.code}] ` : ''}{d.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Department Manager (Lead) Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="dept-manager"
              className="font-semibold text-foreground text-xs block"
            >
              {t('organization.manager', 'ប្រធានផ្នែក')}
            </label>
            <select
              id="dept-manager"
              value={form.manager_id}
              onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
            >
              <option value="">{t('organization.unassignedLead', '-- មិនទាន់ចាត់តាំងប្រធាន --')}</option>
              {employees.map((emp: any) => {
                const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
                const pos = emp.primary_assignment?.position?.title;
                return (
                  <option key={emp.id} value={emp.id}>
                    {name} ({emp.employee_code}){pos ? ` — ${pos}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="dept-desc"
              className="font-semibold text-foreground text-xs block"
            >
              {t('organization.description', 'ការពិពណ៌នា')}
            </label>
            <textarea
              id="dept-desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t(
                'organization.deptDescPlaceholder',
                'ការពិពណ៌នាពីតួនាទី និងភារកិច្ចរបស់ផ្នែក...'
              )}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs resize-none"
            />
          </div>

          {/* ======================================================== */}
          {/* 3. GLOBAL STANDARD MODAL FOOTER                          */}
          {/* ======================================================== */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
            >
              {t('common.cancel', 'បោះបង់')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saveMutation.isPending}
              className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
            >
              {saveMutation.isPending
                ? t('common.loading', 'កំពុងរក្សាទុក...')
                : isEdit
                ? t('common.saveChanges', 'រក្សាទុកការផ្លាស់ប្តូរ')
                : t('organization.addDepartment', 'បន្ថែមនាយកដ្ឋាន')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentModal;
