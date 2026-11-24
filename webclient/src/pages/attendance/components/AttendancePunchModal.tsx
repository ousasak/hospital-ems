import React, { useState, useEffect } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CloseButton } from '@/components/common';
import { Button } from '@/components/ui/button';

interface AttendancePunchModalProps {
  isOpen: boolean;
  currentUser: any;
  todayStatus: any;
  onClose: () => void;
  onCheckIn: () => Promise<void>;
  onCheckOut: () => Promise<void>;
  isSubmitting?: boolean;
}

export const AttendancePunchModal: React.FC<AttendancePunchModalProps> = ({
  isOpen,
  currentUser,
  todayStatus,
  onClose,
  onCheckIn,
  onCheckOut,
  isSubmitting,
}) => {
  const { t } = useTranslation();
  const [clockTime, setClockTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasCheckedIn = todayStatus?.has_checked_in;
  const hasCheckedOut = todayStatus?.has_checked_out;
  const userName =
    currentUser?.name ||
    `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() ||
    'បុគ្គលិក';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Clock className="h-4.5 w-4.5" />
              </span>
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                {t('attendance.punchModalTitle', 'ផ្ទាំងស្កេនវត្តមានការងារ')}
              </DialogTitle>
            </div>
            <CloseButton onClose={onClose} size="md" variant="default" />
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 text-center">
          {/* Real-time Digital Clock Box */}
          <div className="rounded-2xl border border-slate-800 bg-[#0e272a] text-[#4ade80] p-6 shadow-inner">
            <span className="font-mono text-4xl font-extrabold tracking-wider block">
              {clockTime}
            </span>
            <div className="mt-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-[#4ade80]" />
              <span>
                {new Date().toLocaleDateString('km-KH', { dateStyle: 'full' }) ||
                  new Date().toLocaleDateString('en-GB', { dateStyle: 'full' })}
              </span>
            </div>
          </div>

          {/* User & Terminal Info */}
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs text-foreground space-y-2 text-left shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {t('employees.fullName', 'បុគ្គលិក')}:
              </span>
              <span className="font-bold text-foreground">{userName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {t('employees.colLocation', 'ទីតាំងស្កេន')}:
              </span>
              <span className="font-medium text-foreground">
                មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ
              </span>
            </div>

            {hasCheckedIn && (
              <div className="flex items-center justify-between pt-1 border-t border-border text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t('attendance.checkInTime', 'ម៉ោងចូល')}:
                </span>
                <span className="font-mono">{todayStatus.check_in_time || '08:00'}</span>
              </div>
            )}
          </div>

          {/* Action Punch Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Check-In Button */}
            <Button
              type="button"
              onClick={onCheckIn}
              disabled={Boolean(hasCheckedIn) || isSubmitting}
              className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs gap-2 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
            >
              <LogIn className="h-4 w-4" />
              <span>
                {hasCheckedIn
                  ? t('status.present', 'បានស្កេនចូល')
                  : t('attendance.checkIn', 'ស្កេនចូល')}
              </span>
            </Button>

            {/* Check-Out Button */}
            <Button
              type="button"
              onClick={onCheckOut}
              disabled={!hasCheckedIn || Boolean(hasCheckedOut) || isSubmitting}
              className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs gap-2 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4" />
              <span>
                {hasCheckedOut
                  ? t('status.completed', 'បានស្កេនចេញ')
                  : t('attendance.checkOut', 'ស្កេនចេញ')}
              </span>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3.5 bg-muted/20 text-center">
          <p className="text-[11px] text-muted-foreground">
            {t(
              'attendance.punchModalDesc',
              'កំណត់ត្រាវត្តមាននឹងត្រូវបានធ្វើសមកាលកម្មដោយស្វ័យប្រវត្តិចូលទៅកាន់ប្រព័ន្ធ។'
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendancePunchModal;
