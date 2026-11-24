import React from 'react';
import {
  FileText,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Building,
} from 'lucide-react';
import { LeaveRequestItem, LeaveCategoryType } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { CloseButton, StatusBadge } from '@/components/common';

interface LeaveDetailModalProps {
  request: LeaveRequestItem | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const khmerMonths = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ',
];

const formatKhmerDate = (date: Date | string | undefined): string => {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return `${d.getDate()} ${khmerMonths[d.getMonth()]} ${d.getFullYear()}`;
};

const getCategoryKhmer = (type: LeaveCategoryType | string): string => {
  switch (type) {
    case 'Annual Leave':
      return 'ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)';
    case 'Sick Leave':
      return 'ច្បាប់ឈឺ (Sick Leave)';
    case 'Personal Leave':
      return 'ច្បាប់ផ្ទាល់ខ្លួន (Personal Leave)';
    case 'Unpaid Leave':
      return 'គ្មានប្រាក់ឈ្នួល (Unpaid Leave)';
    default:
      return String(type);
  }
};

const getReasonKhmer = (reason?: string, type?: LeaveCategoryType): string => {
  if (!reason || reason === 'Personal / family commitments' || reason === 'No detailed reason provided') {
    switch (type) {
      case 'Sick Leave':
        return 'សម្រាកព្យាបាលជំងឺទូទៅ';
      case 'Personal Leave':
        return 'ដោះស្រាយកិច្ចការបន្ទាន់គ្រួសារ';
      case 'Annual Leave':
        return 'សម្រាកលម្ហែកាយប្រចាំឆ្នាំ';
      case 'Unpaid Leave':
        return 'កិច្ចការផ្ទាល់ខ្លួនក្រៅកាតព្វកិច្ច';
      default:
        return 'កិច្ចការបន្ទាន់ផ្ទាល់ខ្លួន';
    }
  }
  return reason.replace(/^["'“”]|["'“”]$/g, '').trim();
};

export const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({
  request,
  onClose,
  onApprove,
  onReject,
}) => {
  if (!request) return null;

  const initials = request.employee
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                <FileText size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  ព័ត៌មានលម្អិត & កំណត់ត្រាសំណើច្បាប់
                </DialogTitle>
                <DialogDescription className="font-mono text-xs text-muted-foreground mt-0.5">
                  លេខកូដសំណើ៖ <span className="font-semibold text-foreground">{request.id}</span>
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={request.status} />
              <CloseButton onClose={onClose} size="md" variant="default" />
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Employee Card */}
          <div className="flex items-center gap-3.5 rounded-xl border border-border/80 bg-muted/30 p-3.5">
            <Avatar className="h-11 w-11 ring-2 ring-border/50">
              {request.avatarUrl && (
                <AvatarImage src={request.avatarUrl} alt={request.employee} />
              )}
              <AvatarFallback className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-foreground">
                {request.employee}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground mt-0.5 text-xs">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {request.office}, {request.country}
                </span>
                <span>•</span>
                <span className="font-mono">អត្តលេខ៖ {request.employeeId || 'EMP-2026'}</span>
              </div>
            </div>
          </div>

          {/* Leave Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 p-3.5 bg-card">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px]">
                ប្រភេទច្បាប់
              </span>
              <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
                {getCategoryKhmer(request.type)}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px]">
                រយៈពេលសរុប
              </span>
              <span className="font-bold text-foreground text-xs font-mono">
                {request.duration} ថ្ងៃ {request.isHalfDay ? '(កន្លះថ្ងៃ)' : ''}
              </span>
            </div>
            <div className="space-y-0.5 pt-2 border-t border-border/60">
              <span className="text-muted-foreground block text-[11px]">
                កាលបរិច្ឆេទចាប់ផ្ដើម
              </span>
              <span className="font-medium text-foreground text-xs flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {formatKhmerDate(request.start)}
              </span>
            </div>
            <div className="space-y-0.5 pt-2 border-t border-border/60">
              <span className="text-muted-foreground block text-[11px]">
                កាលបរិច្ឆេទបញ្ចប់
              </span>
              <span className="font-medium text-foreground text-xs flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {formatKhmerDate(request.end)}
              </span>
            </div>
          </div>

          {/* Reason Section */}
          <div className="space-y-1 rounded-xl border border-border/70 p-3.5 bg-card">
            <span className="text-muted-foreground font-semibold block text-[11px]">
              មូលហេតុស្នើសុំច្បាប់
            </span>
            <p className="text-foreground text-xs leading-relaxed">
              {getReasonKhmer(request.reason, request.type)}
            </p>
          </div>

          {/* Workflow & Audit Trail */}
          <div className="space-y-2">
            <span className="text-muted-foreground font-semibold block text-[11px] uppercase tracking-wider">
              ប្រវត្តិកំណត់ត្រា & ដំណើរការអនុម័ត
            </span>
            <div className="space-y-3 border-l-2 border-teal-500/40 pl-3.5 ml-1 text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">
                  ស្នើសុំដោយ៖ {request.employee}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  កាលបរិច្ឆេទស្នើសុំ៖ {formatKhmerDate(request.appliedDate || request.start)} • តាមរយៈប្រព័ន្ធ Employee Portal
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">
                  {request.status === 'Approved'
                    ? 'បានអនុម័តដោយ៖ ផ្នែកធនធានមនុស្ស (HR / Admin)'
                    : request.status === 'Rejected'
                    ? 'បានបដិសេធដោយ៖ ផ្នែកធនធានមនុស្ស (HR / Admin)'
                    : 'កំពុងរង់ចាំការពិនិត្យ និងអនុម័តពី HR'}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  {request.status === 'Pending'
                    ? 'តម្រូវឱ្យពិនិត្យ និងសម្រេចក្នុងរយៈពេល ៤៨ ម៉ោង'
                    : 'ទិន្នន័យត្រូវបានកត់ត្រាទុកក្នុងប្រព័ន្ធកំណត់ត្រាក្រុមហ៊ុនរួចរាល់'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border bg-muted/20 flex items-center justify-between">
          {request.status === 'Pending' ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onReject(request.id);
                  onClose();
                }}
                className="h-9 px-4 rounded-xl border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                <span>បដិសេធសំណើ</span>
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
                >
                  បិទ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onApprove(request.id);
                    onClose();
                  }}
                  className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>អនុម័តសំណើ</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
              >
                បិទផ្ទាំង
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveDetailModal;
