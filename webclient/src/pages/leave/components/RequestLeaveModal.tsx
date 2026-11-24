import React, { useState } from 'react';
import { PlaneTakeoff, Calendar, User, FileText, Check } from 'lucide-react';
import { LeaveEmployee, LeaveCategoryType } from '../types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import { CloseButton } from '@/components/common';

interface RequestLeaveModalProps {
  open: boolean;
  onClose: () => void;
  employees: LeaveEmployee[];
  onSubmit: (data: {
    employee: string;
    employeeId?: string | number;
    type: LeaveCategoryType;
    start: Date;
    end: Date;
    reason: string;
    isHalfDay: boolean;
  }) => void;
}

export const RequestLeaveModal: React.FC<RequestLeaveModalProps> = ({
  open,
  onClose,
  employees,
  onSubmit,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => {
    return employees[0]?.id ? String(employees[0].id) : (employees[0]?.name || '');
  });

  React.useEffect(() => {
    if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id ? String(employees[0].id) : employees[0].name);
    }
  }, [employees, selectedEmpId]);

  const [type, setType] = useState<LeaveCategoryType>('Annual Leave');
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error('សូមបញ្ជាក់កាលបរិច្ឆេទចាប់ផ្តើម និងបញ្ចប់។');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      toast.error('កាលបរិច្ឆេទចាប់ផ្តើមមិនអាចក្រោយកាលបរិច្ឆេទបញ្ចប់បានទេ។');
      return;
    }

    const selectedEmp = employees.find((e) => String(e.id) === selectedEmpId || e.name === selectedEmpId);
    const empName = selectedEmp?.name || selectedEmpId;
    const empId = selectedEmp?.id || selectedEmpId;

    onSubmit({
      employee: empName,
      employeeId: empId,
      type,
      start,
      end,
      reason: reason.trim() || 'សំណើសុំច្បាប់ប្រចាំឆ្នាំ',
      isHalfDay,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                <PlaneTakeoff size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  បង្កើតសំណើសុំច្បាប់ (Submit Leave Request)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  ស្នើសុំការឈប់សម្រាកសម្រាប់ការពិនិត្យ និងអនុម័តដោយប្រធានផ្នែក/HR
                </DialogDescription>
              </div>
            </div>
            <CloseButton onClose={onClose} size="md" variant="default" />
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Employee Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground text-xs block">
              បុគ្គលិកស្នើសុំ <span className="text-rose-500">*</span>
            </label>
            <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
              <SelectTrigger className="h-10 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-card">
                <SelectValue placeholder="ជ្រើសរើសបុគ្គលិក" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => {
                  const val = emp.id ? String(emp.id) : emp.name;
                  return (
                    <SelectItem key={val} value={val} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span>{emp.name}</span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          ({emp.office || emp.department})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Leave Type */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground text-xs block">
              ប្រភេទច្បាប់ <span className="text-rose-500">*</span>
            </label>
            <Select
              value={type}
              onValueChange={(val) => setType(val as LeaveCategoryType)}
            >
              <SelectTrigger className="h-10 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-card">
                <SelectValue placeholder="ជ្រើសរើសប្រភេទច្បាប់" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Annual Leave" className="text-xs">
                  🌴 ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)
                </SelectItem>
                <SelectItem value="Sick Leave" className="text-xs">
                  🩺 ច្បាប់ឈឺ (Sick Leave)
                </SelectItem>
                <SelectItem value="Personal Leave" className="text-xs">
                  ❤️ ច្បាប់ផ្ទាល់ខ្លួន (Personal Leave)
                </SelectItem>
                <SelectItem value="Unpaid Leave" className="text-xs">
                  💼 គ្មានប្រាក់ឈ្នួល (Unpaid Leave)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Pickers Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground text-xs block">
                កាលបរិច្ឆេទចាប់ផ្ដើម <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-card font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground text-xs block">
                កាលបរិច្ឆេទបញ្ចប់ <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-card font-mono"
                required
              />
            </div>
          </div>

          {/* Half Day Checkbox */}
          <div className="flex items-center space-x-2 rounded-xl border border-border/80 bg-muted/20 p-3">
            <Checkbox
              id="half-day"
              checked={isHalfDay}
              onCheckedChange={(c) => setIsHalfDay(!!c)}
            />
            <label
              htmlFor="half-day"
              className="text-xs font-medium leading-none cursor-pointer"
            >
              ស្នើសុំជាកន្លះថ្ងៃ (កាត់កងកូតា ០.៥ ថ្ងៃ)
            </label>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground text-xs block">
              មូលហេតុ / ការបញ្ជាក់បន្ថែម
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ឧ. ឈប់សម្រាកព្យាបាលជំងឺ, ដំណើរកម្សាន្តគ្រួសារ..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-2xs resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
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
              <span>ផ្ញើសំណើសុំច្បាប់</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestLeaveModal;
