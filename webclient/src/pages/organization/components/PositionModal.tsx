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
import { Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export interface PositionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: any;
  departments: any[];
  onSuccess?: () => void;
}

export const PositionModal: React.FC<PositionModalProps> = ({
  open,
  onOpenChange,
  position,
  departments = [],
  onSuccess,
}) => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const isEdit = Boolean(position);

  const [form, setForm] = useState({
    title: '',
    code: '',
    department_id: '',
    level: 'mid',
    min_salary: '',
    max_salary: '',
    description: '',
    status: 'active',
  });

  useEffect(() => {
    if (position) {
      setForm({
        title: position.title || '',
        code: position.code || '',
        department_id: position.department_id ? String(position.department_id) : '',
        level: position.level || 'mid',
        min_salary: position.min_salary ? String(Number(position.min_salary)) : '',
        max_salary: position.max_salary ? String(Number(position.max_salary)) : '',
        description: position.description || '',
        status: position.status || 'active',
      });
    } else {
      setForm({
        title: '',
        code: '',
        department_id: '',
        level: 'mid',
        min_salary: '',
        max_salary: '',
        description: '',
        status: 'active',
      });
    }
  }, [position, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const minSal = form.min_salary ? Number(form.min_salary) : null;
      const maxSal = form.max_salary ? Number(form.max_salary) : null;

      if (minSal !== null && maxSal !== null && maxSal < minSal) {
        throw new Error(t('organization.salaryError', 'ប្រាក់ខែអតិបរមាត្រូវតែធំជាង ឬស្មើប្រាក់ខែអប្បបរមា'));
      }

      const payload = {
        title: form.title.trim(),
        code: form.code.trim().toUpperCase(),
        department_id: form.department_id ? Number(form.department_id) : null,
        level: form.level,
        min_salary: minSal,
        max_salary: maxSal,
        description: form.description.trim() || null,
        status: form.status,
      };

      if (isEdit) {
        return await organizationService.updatePosition(position.id, payload);
      }
      return await organizationService.createPosition(payload);
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || t('common.success', 'ប្រតិបត្តិការបានជោគជ័យ'));
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      onSuccess?.();
    },
    onError: (err: any) => {
      const message = err.message || err.response?.data?.message || t('common.error', 'មានកំហុសមួយបានកើតឡើង');
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.code.trim()) return;
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
                <Briefcase size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {isEdit
                    ? t('organization.editPosition', 'កែប្រែមុខតំណែង')
                    : t('organization.addPosition', 'បង្កើតមុខតំណែងថ្មី')}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t(
                    'organization.posSubtitle',
                    'កំណត់រចនាសម្ព័ន្ធមុខតំណែង កម្រិតថ្នាក់ ប្រាក់ខែគោល និងការចាត់តាំងតាមផ្នែក'
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
          {/* Position Title */}
          <div className="space-y-1.5">
            <label
              htmlFor="pos-title"
              className="font-semibold text-foreground text-xs block"
            >
              {t('organization.positionTitle', 'ចំណងជើងមុខតំណែង')}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="pos-title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t('organization.posTitlePlaceholder', 'ឧ. គ្រូពេទ្យព្យាបាលឯកទេស')}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Position Code & Status (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="pos-code"
                className="font-semibold text-foreground text-xs block"
              >
                {t('organization.positionCode', 'លេខកូដមុខតំណែង')}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="pos-code"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="ឧ. POS-SURG-MED"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs uppercase font-mono tracking-wide"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pos-status"
                className="font-semibold text-foreground text-xs block"
              >
                {t('common.status', 'ស្ថានភាព')}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <select
                id="pos-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs cursor-pointer"
              >
                <option value="active">{t('status.active', 'សកម្ម')}</option>
                <option value="inactive">{t('status.inactive', 'អសកម្ម')}</option>
              </select>
            </div>
          </div>

          {/* Department & Seniority Level (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="pos-dept"
                className="font-semibold text-foreground text-xs block"
              >
                {t('organization.departments', 'នាយកដ្ឋាន / ផ្នែក')}
              </label>
              <select
                id="pos-dept"
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs cursor-pointer"
              >
                <option value="">{t('organization.crossDepartmental', 'អន្តរនាយកដ្ឋាន (ទូទៅ)')}</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.code ? `[${d.code}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pos-level"
                className="font-semibold text-foreground text-xs block"
              >
                {t('organization.seniorityLevel', 'កម្រិតថ្នាក់ការងារ')}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <select
                id="pos-level"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs cursor-pointer"
              >
                <option value="executive">{t('organization.levelExecutive', 'ថ្នាក់ដឹកនាំជាន់ខ្ពស់ (Executive)')}</option>
                <option value="lead">{t('organization.levelLead', 'ប្រធានដឹកនាំ (Lead)')}</option>
                <option value="senior">{t('organization.levelSenior', 'កម្រិតជាន់ខ្ពស់ (Senior)')}</option>
                <option value="mid">{t('organization.levelMid', 'កម្រិតមធ្យម (Mid)')}</option>
                <option value="entry">{t('organization.levelEntry', 'កម្រិតដំបូង (Entry)')}</option>
              </select>
            </div>
          </div>

          {/* Salary Band (Min & Max Salary USD) (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="pos-min-salary"
                className="font-semibold text-foreground text-xs block"
              >
                {t('organization.minSalary', 'ប្រាក់ខែគោលអប្បបរមា (USD)')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs font-semibold">
                  $
                </span>
                <input
                  id="pos-min-salary"
                  type="number"
                  min="0"
                  step="50"
                  value={form.min_salary}
                  onChange={(e) => setForm({ ...form, min_salary: e.target.value })}
                  placeholder="800"
                  className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-mono font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pos-max-salary"
                className="font-semibold text-foreground text-xs block"
              >
                {t('organization.maxSalary', 'ប្រាក់ខែគោលអតិបរមា (USD)')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs font-semibold">
                  $
                </span>
                <input
                  id="pos-max-salary"
                  type="number"
                  min="0"
                  step="50"
                  value={form.max_salary}
                  onChange={(e) => setForm({ ...form, max_salary: e.target.value })}
                  placeholder="1500"
                  className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-mono font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="pos-desc"
              className="font-semibold text-foreground text-xs block"
            >
              {t('organization.description', 'ការពិពណ៌នាការងារ')}
            </label>
            <textarea
              id="pos-desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('organization.posDescPlaceholder', 'ពិពណ៌នាអំពីភារកិច្ច និងការទទួលខុសត្រូវនៃមុខតំណែងនេះ...')}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs resize-none"
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
                : t('organization.addPosition', 'បន្ថែមមុខតំណែង')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PositionModal;
