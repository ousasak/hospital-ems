import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CloseButton } from '@/components/common';
import { Button } from '@/components/ui/button';
import { employeeService } from '@/services/employeeService';
import { attendanceService } from '@/services/attendanceService';
import { useTranslation } from '@/i18n';

interface AdminAttendanceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSuccess?: () => void;
}

export const AdminAttendanceEntryModal: React.FC<AdminAttendanceEntryModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [employeeId, setEmployeeId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(defaultDate || '');
  const [checkInTime, setCheckInTime] = useState<string>('07:30');
  const [checkOutTime, setCheckOutTime] = useState<string>('17:00');
  const [status, setStatus] = useState<string>('present');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (defaultDate) {
      setAttendanceDate(defaultDate);
    }
  }, [defaultDate]);

  // Fetch employees list
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['admin-entry-employees'],
    queryFn: () => employeeService.getEmployees({ per_page: 300 }),
    enabled: isOpen,
    staleTime: 60000,
  });

  const employees = employeesData?.data || [];

  // Mutation for admin entry
  const { mutate: submitEntry, isPending } = useMutation({
    mutationFn: (data: any) => attendanceService.adminEntry(data),
    onSuccess: () => {
      toast.success(t('attendance.entrySuccess', 'បានចុះវត្តមានជូនបុគ្គលិកដោយជោគជ័យ!'));
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'មានកំហុសក្នុងការកត់ត្រាវត្តមាន';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error('សូមជ្រើសរើសបុគ្គលិក');
      return;
    }
    if (!attendanceDate) {
      toast.error('សូមជ្រើសរើសកាលបរិច្ឆេទ');
      return;
    }

    submitEntry({
      employee_id: parseInt(employeeId, 10),
      attendance_date: attendanceDate,
      check_in_time: status === 'absent' || status === 'on_leave' ? null : checkInTime || null,
      check_out_time: status === 'absent' || status === 'on_leave' ? null : checkOutTime || null,
      status,
      notes: notes.trim() || 'ចុះវត្តមានដោយរដ្ឋបាល (Admin Entry)',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {t('attendance.manualEntryTitle', 'ចុះវត្តមានជំនួស (Admin Entry)')}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t('attendance.manualEntryDesc', 'កត់ត្រាវត្តមានសម្រាប់គ្រូពេទ្យ ឬបុគ្គលិកដែលខកខានស្កេន')}
                </DialogDescription>
              </div>
            </div>
            <CloseButton onClose={onClose} size="md" variant="default" />
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* 1. Employee Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <User size={14} className="text-teal-600" />
              <span>បុគ្គលិក / គ្រូពេទ្យ <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
            >
              <option value="">
                {isLoadingEmployees ? 'កំពុងទាញទិន្នន័យបុគ្គលិក...' : '-- ជ្រើសរើសបុគ្គលិក --'}
              </option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employee_code} - {emp.full_name || `${emp.first_name} ${emp.last_name}`}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Attendance Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                <span>កាលបរិច្ឆេទ <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock size={14} className="text-amber-600" />
                <span>ស្ថានភាពវត្តមាន <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              >
                <option value="present">មានវត្តមាន (Present)</option>
                <option value="late">មកយឺត (Late Arrival)</option>
                <option value="half_day">ច្បាប់កន្លះថ្ងៃ (Half Day)</option>
                <option value="on_leave">សុំច្បាប់ (On Leave)</option>
                <option value="absent">អវត្តមាន (Absent)</option>
              </select>
            </div>
          </div>

          {/* 3. Check-In & Check-Out Times (Conditional if present / late) */}
          {status !== 'absent' && status !== 'on_leave' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">ម៉ោងស្កេនចូល</label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium font-mono focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">ម៉ោងស្កេនចេញ (បើមាន)</label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs font-medium font-mono focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* 4. Notes / Reason */}
          <div className="space-y-1.5 pt-1">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <FileText size={14} className="text-slate-500" />
              <span>មូលហេតុ ឬកំណត់សម្គាល់</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="ឧ. ជាប់សង្គ្រោះបន្ទាន់ភ្លេចស្កេន, បេសកកម្មក្រៅ..."
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-card text-foreground text-xs focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-2xs resize-none"
            />
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
              {isPending ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកវត្តមាន'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAttendanceEntryModal;
