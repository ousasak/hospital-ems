import React, { useState, useEffect } from 'react';
import { CalendarPlus } from 'lucide-react';
import { ShiftEmployee } from '../types';
import { ALL_OFFICES, ALL_DEPARTMENTS, getShiftTemplate } from '../mockData';
import { useLocaleStore } from '@/stores/localeStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CloseButton } from '@/components/common';
import { Button } from '@/components/ui/button';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: ShiftEmployee[];
  onAddShift: (
    employeeName: string,
    shiftKey: string,
    dateStr: string
  ) => void;
  defaultDate?: string;
  defaultEmployeeName?: string;
}

export const AddShiftModal: React.FC<AddShiftModalProps> = ({
  isOpen,
  onClose,
  employees,
  onAddShift,
  defaultDate,
  defaultEmployeeName,
}) => {
  const { t } = useLocaleStore();
  const [selectedEmployeeName, setSelectedEmployeeName] = useState(
    defaultEmployeeName || (employees[0]?.name ?? '')
  );
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('Morning');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [shiftDate, setShiftDate] = useState(defaultDate || '');

  // Synchronize defaults on open or prop change
  useEffect(() => {
    if (defaultEmployeeName) {
      setSelectedEmployeeName(defaultEmployeeName);
      const emp = employees.find((e) => e.name === defaultEmployeeName);
      if (emp) {
        setSelectedOffice(emp.office);
        setSelectedDepartment(emp.department);
      }
    } else if (employees.length > 0) {
      setSelectedEmployeeName(employees[0].name);
      setSelectedOffice(employees[0].office);
      setSelectedDepartment(employees[0].department);
    }
    if (defaultDate) {
      setShiftDate(defaultDate);
    }
  }, [defaultEmployeeName, defaultDate, employees, isOpen]);

  const currentEmployee =
    employees.find((e) => e.name === selectedEmployeeName) || employees[0];
  const currentTemplate = getShiftTemplate(selectedTemplateKey);

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedEmployeeName(name);
    const emp = employees.find((item) => item.name === name);
    if (emp) {
      setSelectedOffice(emp.office);
      setSelectedDepartment(emp.department);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeName || !selectedTemplateKey) return;
    onAddShift(selectedEmployeeName, selectedTemplateKey, shiftDate);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                <CalendarPlus size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {t('shifts.addModal.title', 'ដាក់កាលវិភាគវេនថ្មី')}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t('shifts.addModal.subtitle', 'កំណត់វេនបំពេញការងារ ឬតួនាទីប្រចាំថ្ងៃសម្រាប់បុគ្គលិក')}
                </DialogDescription>
              </div>
            </div>
            <CloseButton onClose={onClose} size="md" variant="default" />
          </div>
        </DialogHeader>

        {/* Form Body - Clean and minimalist without icon clutter */}
        <form
          id="shift-add-form"
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 space-y-4 text-xs"
        >
          {/* 1. Employee Selection */}
          <div className="space-y-1.5">
            <label
              htmlFor="sa-employee"
              className="font-semibold text-foreground text-xs block"
            >
              {t('shifts.addModal.employee', 'បុគ្គលិក')} <span className="text-rose-500">*</span>
            </label>
            <select
              id="sa-employee"
              name="employee"
              required
              value={selectedEmployeeName}
              onChange={handleEmployeeChange}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name} — {emp.department} ({emp.office})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Office & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="sa-office"
                className="font-semibold text-foreground text-xs block"
              >
                {t('shifts.addModal.office', 'ការិយាល័យ')}
              </label>
              <select
                id="sa-office"
                name="office"
                value={selectedOffice || currentEmployee?.office}
                onChange={(e) => setSelectedOffice(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              >
                {ALL_OFFICES.map((office) => (
                  <option key={office} value={office}>
                    {office}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="sa-dept"
                className="font-semibold text-foreground text-xs block"
              >
                {t('shifts.addModal.department', 'ផ្នែក')}
              </label>
              <select
                id="sa-dept"
                name="department"
                value={selectedDepartment || currentEmployee?.department}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              >
                {ALL_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Shift Template */}
          <div className="space-y-1.5">
            <label
              htmlFor="sa-template"
              className="font-semibold text-foreground text-xs block"
            >
              {t('shifts.addModal.shiftTemplate', 'ទម្រង់វេន')} <span className="text-rose-500">*</span>
            </label>
            <select
              id="sa-template"
              name="template"
              required
              value={selectedTemplateKey}
              onChange={(e) => setSelectedTemplateKey(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
            >
              <option value="" disabled hidden>
                {t('shifts.addModal.selectTemplate', 'ជ្រើសរើសទម្រង់វេន')}
              </option>
              <option value="Morning">{t('shifts.shifts.morning', 'វេនព្រឹក')} (07:00–15:00)</option>
              <option value="Day">{t('shifts.shifts.day', 'វេនថ្ងៃ/រដ្ឋបាល')} (08:00–17:00)</option>
              <option value="Evening">{t('shifts.shifts.evening', 'វេនរសៀល')} (14:00–21:00)</option>
              <option value="Night">{t('shifts.shifts.night', 'វេនយប់ប្រចាំការ')} (20:00–08:00)</option>
              <option value="OFF">{t('shifts.shifts.off', 'សម្រាក')} (Off Duty)</option>
            </select>
          </div>

          {/* 4. Start Time, End Time, Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="sa-start" className="font-semibold text-foreground text-xs block">
                {t('shifts.addModal.startTime', 'ម៉ោងចាប់ផ្តើម')}
              </label>
              <input
                id="sa-start"
                type="text"
                readOnly
                value={currentTemplate?.start || '09:00'}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-muted/40 text-muted-foreground text-xs font-mono font-medium outline-none shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sa-end" className="font-semibold text-foreground text-xs block">
                {t('shifts.addModal.endTime', 'ម៉ោងបញ្ចប់')}
              </label>
              <input
                id="sa-end"
                type="text"
                readOnly
                value={currentTemplate?.end || '17:00'}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-muted/40 text-muted-foreground text-xs font-mono font-medium outline-none shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="sa-date"
                className="font-semibold text-foreground text-xs block"
              >
                {t('shifts.addModal.date', 'កាលបរិច្ឆេទ')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="sa-date"
                type="date"
                required
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              id="shift-add-cancel"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
            >
              {t('shifts.addModal.cancel', 'បោះបង់')}
            </Button>
            <Button
              type="submit"
              size="sm"
              id="shift-add-submit"
              className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
            >
              {t('shifts.addModal.save', 'រក្សាទុកវេន')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddShiftModal;
