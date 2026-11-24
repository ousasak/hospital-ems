import React from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building2,
  Calendar,
  Clock,
  Briefcase,
  FileText,
  Mail,
  Phone,
  ArrowRight,
  User,
} from 'lucide-react';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  category: string;
}

// ─── Avatar Initials & Color Helper ───────────────────────────────────────────
const getInitials = (name?: string): string => {
  if (!name) return 'SS';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getAvatarBg = (idStr: string = '') => {
  const colors = [
    'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 ring-teal-200/60 dark:ring-teal-800/60',
    'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-blue-200/60 dark:ring-blue-800/60',
    'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 ring-indigo-200/60 dark:ring-indigo-800/60',
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-emerald-200/60 dark:ring-emerald-800/60',
    'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 ring-sky-200/60 dark:ring-sky-800/60',
    'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 ring-violet-200/60 dark:ring-violet-800/60',
    'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-amber-200/60 dark:ring-amber-800/60',
    'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 ring-rose-200/60 dark:ring-rose-800/60',
  ];
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  category,
}) => {
  const { t } = useLocaleStore();

  if (!record) return null;

  const getStatusText = (status: string) => {
    if (!status) return '—';
    const normalized = status.toLowerCase();
    const translated = t(`reports.status.${normalized}`);
    return translated || status;
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'attendance':
        return t('reports.tables.tabAttendance');
      case 'leave':
        return t('reports.tables.tabLeaves');
      case 'employee':
        return t('reports.tables.tabEmployees');
      case 'shift':
        return t('reports.tables.tabShifts');
      case 'department':
        return t('reports.tables.tabDepartments');
      case 'payroll':
        return t('reports.tables.tabPayroll');
      default:
        return cat;
    }
  };

  const renderStatusBadge = (status: string) => {
    if (!status) return <span className="text-muted-foreground/40 font-mono text-xs">—</span>;
    const s = status.toLowerCase();

    if (s === 'present' || s === 'active' || s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{getStatusText(status)}</span>
        </span>
      );
    }

    if (s === 'late' || s.startsWith('pending') || s === 'probation') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>{getStatusText(status)}</span>
        </span>
      );
    }

    if (s === 'absent' || s === 'rejected' || s === 'terminated') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{getStatusText(status)}</span>
        </span>
      );
    }

    if (s === 'on_leave' || s === 'leave') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
          <span>{getStatusText(status)}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
        <span>{getStatusText(status)}</span>
      </span>
    );
  };

  const displayName = record.employee_name || record.name || record.shift_name || record.code || t('reports.modal.recordDetails');
  const displayCode = record.employee_code || record.code || `ID: #${record.id}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-6 bg-card border-border/80 shadow-lg">
        {/* Header */}
        <DialogHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-3.5">
            {record.avatar_url || record.employee_name ? (
              <Avatar className="h-11 w-11 rounded-full ring-2 ring-border/50 shrink-0">
                <AvatarImage src={record.avatar_url} />
                <AvatarFallback className={`text-xs font-bold ${getAvatarBg(displayName)}`}>
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                <FileText className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <DialogTitle className="text-base font-bold text-foreground truncate">
                  {displayName}
                </DialogTitle>
                {renderStatusBadge(record.status)}
              </div>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{displayCode}</span>
                <span>•</span>
                <span>{getCategoryLabel(category)}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="py-4 space-y-3.5 text-xs max-h-[60vh] overflow-y-auto pr-1">
          {category === 'attendance' && (
            <>
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-primary" /> {t('reports.modal.date')}
                  </span>
                  <p className="font-mono font-medium text-foreground text-xs">{record.date}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-primary" /> {t('reports.modal.department')}
                  </span>
                  <p className="font-medium text-foreground text-xs truncate">{record.department}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-muted-foreground block text-[11px] mb-1 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-primary" /> {t('reports.modal.shift')}
                </span>
                <p className="font-medium text-foreground text-xs">{record.shift_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">{t('reports.modal.checkIn')}</span>
                  <p className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {record.check_in || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">{t('reports.modal.checkOut')}</span>
                  <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {record.check_out || '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">{t('reports.modal.workingHours')}</span>
                  <p className="font-mono text-xs font-semibold text-foreground">{record.working_hours || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">{t('reports.modal.overtime')}</span>
                  <p className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {record.overtime_hours || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">{t('reports.modal.late')}</span>
                  <p className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {record.late_minutes || '0m'}
                  </p>
                </div>
              </div>

              {record.notes && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground block text-[11px] mb-1 font-medium">{t('reports.modal.notes')}</span>
                  <p className="text-foreground leading-relaxed">{record.notes}</p>
                </div>
              )}
            </>
          )}

          {category === 'leave' && (
            <>
              <div className="p-3 rounded-xl bg-muted/20 border border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> {t('reports.modal.leaveType')}
                  </span>
                  <span className="font-semibold text-foreground">{record.leave_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> {t('reports.modal.department')}
                  </span>
                  <span className="font-medium text-foreground">{record.department}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">{t('reports.modal.startDate')}</span>
                  <p className="font-mono font-medium text-foreground">{record.start_date}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">{t('reports.modal.endDate')}</span>
                  <p className="font-mono font-medium text-foreground">{record.end_date}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-muted-foreground">{t('reports.modal.duration')}</span>
                <Badge variant="secondary" className="font-mono font-semibold">
                  {record.total_days} {t('reports.modal.days', 'ថ្ងៃ')}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-muted-foreground">{t('reports.modal.approvingSupervisor')}</span>
                <span className="font-medium text-foreground">{record.supervisor_name || '—'}</span>
              </div>

              {record.reason && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground block text-[11px] mb-1 font-medium">{t('reports.modal.reason')}</span>
                  <p className="text-foreground leading-relaxed">{record.reason}</p>
                </div>
              )}
            </>
          )}

          {category === 'employee' && (
            <>
              <div className="space-y-2.5 p-3 rounded-xl bg-muted/20 border border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> {t('reports.modal.department')}
                  </span>
                  <span className="font-medium text-foreground">{record.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-primary" /> {t('reports.modal.position')}
                  </span>
                  <span className="font-medium text-foreground">{record.position || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" /> {t('reports.modal.email')}
                  </span>
                  <span className="font-medium text-foreground">{record.email || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> {t('reports.modal.phone')}
                  </span>
                  <span className="font-mono text-foreground">{record.phone || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">{t('reports.modal.employmentType')}</span>
                  <p className="font-medium text-foreground">{record.employment_type || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">{t('reports.tables.joinDate')}</span>
                  <p className="font-mono font-medium text-foreground">{record.join_date || '—'}</p>
                </div>
              </div>
            </>
          )}

          {category === 'shift' && (
            <>
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">{t('reports.modal.startTime')}</span>
                  <p className="font-mono font-semibold text-foreground">{record.start_time}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">{t('reports.modal.endTime')}</span>
                  <p className="font-mono font-semibold text-foreground">{record.end_time}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-muted-foreground">{t('reports.modal.breakMinutes')}</span>
                <span className="font-mono font-medium text-foreground">{record.break_minutes} mins</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-muted-foreground">{t('reports.modal.isOvernight')}</span>
                <span className="font-medium text-foreground">
                  {record.is_overnight ? t('reports.modal.yes') : t('reports.modal.no')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-muted-foreground">{t('reports.modal.assignedRecords')}</span>
                <Badge variant="secondary" className="font-mono font-semibold">
                  {record.assigned_count}
                </Badge>
              </div>
            </>
          )}

          {category === 'department' && (
            <>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-muted-foreground">{t('reports.modal.deptHead')}</span>
                <span className="font-medium text-foreground">{record.manager_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-muted-foreground">{t('reports.modal.activeStaffCount')}</span>
                <Badge variant="secondary" className="font-mono font-semibold text-primary">
                  {record.employee_count}
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="pt-3 border-t border-border/60">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl w-full">
            {t('reports.modal.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecordDetailModal;
