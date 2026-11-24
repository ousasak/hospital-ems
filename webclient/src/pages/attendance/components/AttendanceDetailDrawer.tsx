import React from 'react';
import {
  X,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Wifi,
  Printer,
  ShieldCheck,
  LogIn,
  LogOut,
  Briefcase,
  Building2,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { AttendanceRecordItem } from '../types';
import { Button } from '@/components/ui/button';
import { getAbsoluteImageUrl } from '@/utils/image';

interface AttendanceDetailDrawerProps {
  isOpen: boolean;
  record: AttendanceRecordItem | null;
  onClose: () => void;
  onAuditVerify?: (record: AttendanceRecordItem) => void;
}

const getInitials = (name?: string): string => {
  if (!name) return 'AT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const AttendanceDetailDrawer: React.FC<AttendanceDetailDrawerProps> = ({
  isOpen,
  record,
  onClose,
  onAuditVerify,
}) => {
  const { t } = useTranslation();

  if (!isOpen || !record) return null;

  const initials = getInitials(record.name);
  const avatarUrl = getAbsoluteImageUrl(record.avatar || record.avatar_url);

  // Status-aware colors & labels
  const isLate = record.status === 'Late';
  const isAbsent = record.status === 'Absent';
  const isOnLeave = record.status === 'On Leave';
  const isHalfDay = record.status === 'Half Day';
  const isPresent = record.status === 'Present';

  return (
    <>
      {/* ─── Backdrop matching standard Modal ─── */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* ─── Drawer Container (Clean Medical Design) ─── */}
      <div
        id="attendance-drawer"
        role="dialog"
        aria-label="Attendance details drawer"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-50 flex w-full sm:max-w-[540px] lg:max-w-[580px] flex-col bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out font-sans select-text"
      >
        {/* ─── 1. Header (Avatar + Name + Code + Close) ─── */}
        <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={record.name}
                  className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-sm font-bold text-white shadow-2xs font-mono">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                    {record.name}
                  </h2>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                    {record.id}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {record.department || 'ផ្នែកទូទៅ'}
                  {record.position ? ` · ${record.position}` : ''}
                </p>
              </div>
            </div>

            {/* Circular Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
              title={t('common.close', 'បិទ')}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ─── 2. Scrollable Body ─── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          {/* Status Alert Banner */}
          {isLate && (
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-900/60 p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">
                  {t('status.late', 'មកយឺត (Late Arrival)')}
                </h4>
                <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                  {record.notes || 'បុគ្គលិកបានចុះវត្តមានស្កេនចូលយឺតជាងម៉ោងកំណត់នៃវេនការងារ។'}
                </p>
              </div>
            </div>
          )}

          {isAbsent && (
            <div className="rounded-xl border border-rose-200/90 bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-900/60 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-800 dark:text-rose-400 text-sm">
                  {t('status.absent', 'អវត្តមាន (Absent)')}
                </h4>
                <p className="mt-1 text-xs text-rose-700/90 dark:text-rose-400/90 leading-relaxed">
                  {record.notes || 'មិនមានការចុះវត្តមានស្កេនចូលក្នុងប្រព័ន្ធឡើយ។'}
                </p>
              </div>
            </div>
          )}

          {isOnLeave && (
            <div className="rounded-xl border border-purple-200/90 bg-purple-50/70 dark:bg-purple-950/30 dark:border-purple-900/60 p-4 flex items-start gap-3">
              <Calendar className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-purple-800 dark:text-purple-400 text-sm">
                  {t('status.onLeave', 'សុំច្បាប់ឈប់សម្រាក (On Leave)')}
                </h4>
                <p className="mt-1 text-xs text-purple-700/90 dark:text-purple-400/90 leading-relaxed">
                  {record.notes || 'បុគ្គលិកមានការអនុញ្ញាតច្បាប់ឈប់សម្រាកត្រឹមត្រូវតាមប្រព័ន្ធ។'}
                </p>
              </div>
            </div>
          )}

          {isPresent && (
            <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-900/60 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">
                  {t('attendance.compliantTitle', 'វត្តមានត្រឹមត្រូវ & ទៀងទាត់')}
                </h4>
                <p className="mt-1 text-xs text-emerald-700/90 dark:text-emerald-400/90 leading-relaxed">
                  ការស្កេនវត្តមានរបស់បុគ្គលិកត្រូវបានអនុលោមតាមកាលវិភាគការងារនៃរបបវេនការងារ។
                </p>
              </div>
            </div>
          )}

          {/* ─── 4 Metric Cards Grid (Check-In, Check-Out, Working Hours, Overtime) ─── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Check-In */}
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-card p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <LogIn className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-semibold text-foreground">
                  {t('attendance.checkIn', 'ចុះវត្តមានចូល')}
                </span>
              </div>
              <p className="font-mono text-lg font-bold text-slate-800 dark:text-slate-100">
                {record.checkIn || '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isLate ? 'យឺតជាងម៉ោងកំណត់' : 'ម៉ោងចូលការងារ'}
              </p>
            </div>

            {/* Check-Out */}
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-card p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <LogOut className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-semibold text-foreground">
                  {t('attendance.checkOut', 'ចុះវត្តមានចេញ')}
                </span>
              </div>
              <p className="font-mono text-lg font-bold text-slate-800 dark:text-slate-100">
                {record.checkOut || '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {record.checkOut !== '—' ? 'បានស្កេនចេញរួចរាល់' : 'កំពុងបំពេញការងារ'}
              </p>
            </div>

            {/* Total Working Hours */}
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-card p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span className="text-[11px] font-semibold text-foreground">
                  {t('attendance.workingHours', 'ម៉ោងធ្វើការ')}
                </span>
              </div>
              <p className="font-mono text-lg font-bold text-slate-800 dark:text-slate-100">
                {record.workingHours || '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ម៉ោងបំពេញការងារសរុប
              </p>
            </div>

            {/* Overtime */}
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-card p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] font-semibold text-foreground">
                  {t('attendance.overtime', 'ម៉ោងបន្ថែម')}
                </span>
              </div>
              <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {record.overtime || '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ម៉ោងការងារលើសកាលវិភាគ
              </p>
            </div>
          </div>

          {/* ─── Work Shift & Schedule Card ─── */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-card p-4 space-y-2.5 shadow-2xs">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>កាលវិភាគ & វេនការងារ</span>
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-1">
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-muted-foreground">កាលបរិច្ឆេទវត្តមាន</span>
                <span className="font-semibold text-foreground font-mono">
                  {record.dateLabel || record.dateSort}
                </span>
              </div>

              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-muted-foreground">វេនការងារដែលកំណត់</span>
                <span className="font-semibold text-foreground">
                  {record.shift || 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)'}
                </span>
              </div>

              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-muted-foreground">ផ្នែក / ដេប៉ាតឺម៉ង់</span>
                <span className="font-semibold text-foreground">
                  {record.department || 'ផ្នែកទូទៅ'}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Location & Device Verification Card ─── */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-card p-4 space-y-2.5 shadow-2xs">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>ព័ត៌មានទីតាំង & សុវត្ថិភាពស្កេន</span>
            </h3>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-xs">
                    មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    ខេត្តត្បូងឃ្មុំ, ព្រះរាជាណាចក្រកម្ពុជា
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Smartphone className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="text-foreground text-xs">
                  វិធីសាស្ត្រ: <strong className="font-semibold">{record.verificationMethod || 'Wi-Fi + GPS ត្រឹមត្រូវ'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Wifi className="h-4 w-4 text-teal-500 shrink-0" />
                <span className="font-mono text-[11px] text-muted-foreground">
                  IP Stamp: {record.ipAddress || '192.168.1.102'} (Wi-Fi មន្ទីរពេទ្យមានសុវត្ថិភាព)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. Drawer Footer ─── */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/40 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 px-3.5 rounded-xl border-slate-300 dark:border-slate-700 bg-card text-xs font-semibold shadow-2xs gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{t('attendance.printSlip', 'បោះពុម្ពប័ណ្ណ')}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-3.5 rounded-xl border-slate-300 dark:border-slate-700 bg-card text-xs font-semibold shadow-2xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span>{t('common.close', 'បិទ')}</span>
            </Button>

            {onAuditVerify && (
              <Button
                type="button"
                size="sm"
                onClick={() => onAuditVerify(record)}
                className="h-9 px-4 rounded-xl bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-semibold shadow-xs gap-1.5 cursor-pointer transition-all"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{t('attendance.managerVerify', 'ផ្ទៀងផ្ទាត់វត្តមាន')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceDetailDrawer;
