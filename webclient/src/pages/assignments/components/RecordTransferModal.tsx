import React, { useState, useEffect } from 'react';
import { GitFork } from 'lucide-react';
import { useLocaleStore } from '@/stores/localeStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CloseButton } from '@/components/common/CloseButton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface RecordTransferFormValues {
  employee_id: string;
  department_id: string;
  position_id: string;
  supervisor_id: string;
  start_date: string;
  is_primary: boolean;
  status: string;
  notes: string;
}

interface RecordTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: any[];
  departments: any[];
  positions: any[];
  onSubmit: (values: RecordTransferFormValues) => void;
  isPending?: boolean;
}

export const RecordTransferModal: React.FC<RecordTransferModalProps> = ({
  isOpen,
  onClose,
  employees,
  departments,
  positions,
  onSubmit,
  isPending = false,
}) => {
  const { t } = useLocaleStore();

  // Normalize arrays safely to prevent TypeError: employees?.map is not a function
  const employeeList: any[] = Array.isArray(employees)
    ? employees
    : Array.isArray((employees as any)?.data)
    ? (employees as any).data
    : [];

  const departmentList: any[] = Array.isArray(departments)
    ? departments
    : Array.isArray((departments as any)?.data)
    ? (departments as any).data
    : [];

  const positionList: any[] = Array.isArray(positions)
    ? positions
    : Array.isArray((positions as any)?.data)
    ? (positions as any).data
    : [];

  const [form, setForm] = useState<RecordTransferFormValues>({
    employee_id: '',
    department_id: '',
    position_id: '',
    supervisor_id: '',
    start_date: new Date().toISOString().split('T')[0],
    is_primary: true,
    status: 'active',
    notes: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        employee_id: '',
        department_id: '',
        position_id: '',
        supervisor_id: '',
        start_date: new Date().toISOString().split('T')[0],
        is_primary: true,
        status: 'active',
        notes: '',
      });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id) {
      toast.error('សូមជ្រើសរើសបុគ្គលិកគោលដៅ');
      return;
    }
    if (!form.department_id) {
      toast.error('សូមជ្រើសរើសនាយកដ្ឋានថ្មី');
      return;
    }
    if (!form.position_id) {
      toast.error('សូមជ្រើសរើសតួនាទីថ្មី');
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                <GitFork size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {t('assignments.recordTransfer', 'កត់ត្រាការផ្ទេរផ្នែក / តួនាទីថ្មី')}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  កត់ត្រាការផ្ទេរនាយកដ្ឋាន ឬផ្លាស់ប្តូរតួនាទីថ្មីជូនបុគ្គលិក
                </DialogDescription>
              </div>
            </div>
            <CloseButton onClose={onClose} size="md" variant="default" />
          </div>
        </DialogHeader>

        {/* Form Body - Clean and minimalist without icon clutter */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* 1. Target Employee */}
          <div className="space-y-1.5">
            <label
              htmlFor="rt-employee"
              className="font-semibold text-foreground text-xs block"
            >
              {t('assignments.targetEmployee', 'បុគ្គលិកគោលដៅ')} <span className="text-rose-500">*</span>
            </label>
            <select
              id="rt-employee"
              required
              value={form.employee_id}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
            >
              <option value="">-- ជ្រើសរើសបុគ្គលិកត្រូវផ្ទេរ ឬតម្លើងតំណែង --</option>
              {employeeList.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()} ({emp.employee_code})
                  {emp.primary_assignment?.department?.name
                    ? ` — ${emp.primary_assignment.department.name}`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Department & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="rt-dept"
                className="font-semibold text-foreground text-xs block"
              >
                {t('assignments.newDepartment', 'នាយកដ្ឋានថ្មី')} <span className="text-rose-500">*</span>
              </label>
              <select
                id="rt-dept"
                required
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              >
                <option value="">-- ជ្រើសរើសនាយកដ្ឋាន --</option>
                {departmentList.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="rt-pos"
                className="font-semibold text-foreground text-xs block"
              >
                {t('assignments.newPosition', 'តួនាទីថ្មី')} <span className="text-rose-500">*</span>
              </label>
              <select
                id="rt-pos"
                required
                value={form.position_id}
                onChange={(e) => setForm({ ...form, position_id: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              >
                <option value="">-- ជ្រើសរើសតួនាទី --</option>
                {positionList.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.title} {p.level ? `(${p.level})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Supervisor */}
          <div className="space-y-1.5">
            <label
              htmlFor="rt-sup"
              className="font-semibold text-foreground text-xs block"
            >
              {t('assignments.supervisor', 'ប្រធានផ្នែក')}
            </label>
            <select
              id="rt-sup"
              value={form.supervisor_id}
              onChange={(e) => setForm({ ...form, supervisor_id: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
            >
              <option value="">គ្មាន / រាយការណ៍ជូនថ្នាក់ដឹកនាំ</option>
              {employeeList.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Start Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="rt-start"
                className="font-semibold text-foreground text-xs block"
              >
                {t('assignments.effectiveStartDate', 'ថ្ងៃចាប់ផ្តើមអនុវត្ត')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="rt-start"
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="rt-status"
                className="font-semibold text-foreground text-xs block"
              >
                {t('assignments.assignmentStatus', 'ស្ថានភាពចាត់តាំង')}
              </label>
              <select
                id="rt-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              >
                <option value="active">មានវត្តមានសកម្ម — មានប្រសិទ្ធភាពភ្លាមៗ (Active)</option>
                <option value="pending">រង់ចាំ — តាមកាលវិភាគអនាគត (Pending)</option>
              </select>
            </div>
          </div>

          {/* 5. Transfer Notes */}
          <div className="space-y-1.5">
            <label
              htmlFor="rt-notes"
              className="font-semibold text-foreground text-xs block"
            >
              {t('assignments.transferNotes', 'មូលហេតុ / កំណត់សម្គាល់ការផ្ទេរ')}
            </label>
            <textarea
              id="rt-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="ឧ. តម្លើងតំណែងជាប្រធានផ្នែក, ផ្ទេរនាយកដ្ឋានតាមផែនការ..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs resize-y min-h-[76px]"
            />
          </div>

          {/* 6. Primary placement checkbox */}
          <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 border border-border p-3">
            <input
              type="checkbox"
              id="rt-primary"
              checked={form.is_primary}
              onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
              className="h-4 w-4 rounded accent-teal-600 cursor-pointer"
            />
            <label
              htmlFor="rt-primary"
              className="text-xs font-semibold text-foreground cursor-pointer select-none"
            >
              {t('assignments.isPrimary', 'ជាការចាត់តាំងចម្បង (Primary Assignment)')}
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
            >
              {t('common.cancel', 'បោះបង់')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
            >
              {isPending ? t('common.loading', 'កំពុងរក្សាទុក...') : t('assignments.recordTransfer', 'កត់ត្រាការផ្ទេរផ្នែក / តួនាទីថ្មី')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordTransferModal;
