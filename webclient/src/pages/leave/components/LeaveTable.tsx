import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Check,
  X,
} from 'lucide-react';
import { LeaveRequestItem, LeaveCategoryType } from '../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { TableActionMenu, TableActionItem } from '@/components/common/TableActionMenu';
import { ColumnVisibilityState } from './DataTableViewOptions';
import { toast } from 'sonner';
import { cn } from '@/utils';

interface LeaveTableProps {
  requests: LeaveRequestItem[];
  sortKey: 'employee' | 'start' | 'duration' | null;
  sortDir: 'asc' | 'desc';
  onSort: (key: 'employee' | 'start' | 'duration') => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails: (request: LeaveRequestItem) => void;
  selectedIds?: string[];
  onToggleSelectAll?: () => void;
  onToggleSelectRow?: (id: string) => void;
  columnVisibility: ColumnVisibilityState;
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

const formatDateRange = (start: Date, end: Date): string => {
  if (start.getTime() === end.getTime()) {
    return formatKhmerDate(start);
  }
  const sDay = start.getDate();
  const eDay = end.getDate();
  const sMonth = khmerMonths[start.getMonth()];
  const eMonth = khmerMonths[end.getMonth()];
  const sYear = start.getFullYear();
  const eYear = end.getFullYear();

  if (sYear === eYear && sMonth === eMonth) {
    return `${sDay} – ${eDay} ${sMonth} ${sYear}`;
  }
  return `${formatKhmerDate(start)} – ${formatKhmerDate(end)}`;
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

export const LeaveTable: React.FC<LeaveTableProps> = ({
  requests,
  sortKey,
  sortDir,
  onSort,
  onApprove,
  onReject,
  onViewDetails,
  selectedIds = [],
  onToggleSelectAll,
  onToggleSelectRow,
  columnVisibility,
}) => {
  const renderTypeBadge = (type: LeaveCategoryType) => {
    switch (type) {
      case 'Annual Leave':
        return (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
            <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
            <span>ច្បាប់ប្រចាំឆ្នាំ</span>
          </div>
        );
      case 'Sick Leave':
        return (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <span>ច្បាប់ឈឺ</span>
          </div>
        );
      case 'Personal Leave':
        return (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
            <span>ច្បាប់ផ្ទាល់ខ្លួន</span>
          </div>
        );
      case 'Unpaid Leave':
      default:
        return (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
            <span>គ្មានប្រាក់ឈ្នួល</span>
          </div>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>បានអនុម័ត</span>
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>រង់ចាំពិនិត្យ</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 shadow-2xs whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>បានបដិសេធ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  const renderSortIcon = (field: 'employee' | 'start' | 'duration') => {
    if (sortKey !== field) {
      return <ChevronDown className="inline ml-1 h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors" />;
    }
    return sortDir === 'asc' ? (
      <ChevronUp className="inline ml-1 h-3.5 w-3.5 text-teal-600 dark:text-teal-400 font-bold" />
    ) : (
      <ChevronDown className="inline ml-1 h-3.5 w-3.5 text-teal-600 dark:text-teal-400 font-bold" />
    );
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success(`បានចម្លងលេខកូដ ${id} ដោយជោគជ័យ`);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Table>
        <TableHeader className="bg-slate-50/90 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold select-none">
          <TableRow className="hover:bg-transparent">
            {/* Employee Column Header */}
            {columnVisibility.employee && (
              <TableHead
                className="pl-5 min-w-[210px] cursor-pointer hover:text-teal-700 dark:hover:text-teal-300 transition-colors group"
                onClick={() => onSort('employee')}
              >
                <span>បុគ្គលិក</span>
                {renderSortIcon('employee')}
              </TableHead>
            )}

            {/* Location / Department Column */}
            {columnVisibility.location && (
              <TableHead className="min-w-[150px]">
                <span>ដេប៉ាតឺម៉ង់ / ទីតាំង</span>
              </TableHead>
            )}

            {/* Leave Type Column */}
            {columnVisibility.leaveType && (
              <TableHead className="min-w-[140px]">
                <span>ប្រភេទច្បាប់</span>
              </TableHead>
            )}

            {/* Date Range Column */}
            {columnVisibility.dates && (
              <TableHead
                className="min-w-[170px] cursor-pointer hover:text-teal-700 dark:hover:text-teal-300 transition-colors group"
                onClick={() => onSort('start')}
              >
                <span>កាលបរិច្ឆេទ</span>
                {renderSortIcon('start')}
              </TableHead>
            )}

            {/* Duration Column */}
            {columnVisibility.duration && (
              <TableHead
                className="min-w-[90px] cursor-pointer hover:text-teal-700 dark:hover:text-teal-300 transition-colors group"
                onClick={() => onSort('duration')}
              >
                <span>រយៈពេល</span>
                {renderSortIcon('duration')}
              </TableHead>
            )}

            {/* Status Column */}
            {columnVisibility.status && (
              <TableHead className="min-w-[120px]">
                <span>ស្ថានភាព</span>
              </TableHead>
            )}

            {/* Reason Column */}
            {columnVisibility.reason && (
              <TableHead className="min-w-[170px] hidden md:table-cell">
                <span>មូលហេតុ</span>
              </TableHead>
            )}

            {/* Actions Column */}
            {columnVisibility.actions && (
              <TableHead className="w-[130px] min-w-[130px] text-right pr-4">
                <span>សកម្មភាព</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-36 text-center text-xs text-muted-foreground"
              >
                <div className="flex flex-col items-center justify-center space-y-2 py-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">រកមិនឃើញសំណើសុំច្បាប់ឡើយ</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    សូមព្យាយាមផ្លាស់ប្ដូរពាក្យស្វែងរក ឬកំណត់តម្រងឡើងវិញដើម្បីមើលទិន្នន័យ។
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            requests.map((req) => {
              const isSelected = selectedIds.includes(req.id);
              const initials = req.employee
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('');

              const reasonText = getReasonKhmer(req.reason, req.type);

              return (
                <TableRow
                  key={req.id}
                  onClick={() => onViewDetails(req)}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors border-b border-slate-100 dark:border-slate-800/80 group cursor-pointer"
                >
                  {/* Employee (Avatar + Name + Code) */}
                  {columnVisibility.employee && (
                    <TableCell className="py-3 pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border/80">
                          {req.avatarUrl && (
                            <AvatarImage
                              src={req.avatarUrl}
                              alt={req.employee}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 font-bold text-xs border border-teal-200/80 dark:border-teal-800/60">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onViewDetails(req)}
                            className="font-semibold text-xs text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left truncate block max-w-[160px] sm:max-w-[200px]"
                          >
                            {req.employee}
                          </button>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <span className="font-mono text-[10px] text-slate-500">{req.id}</span>
                            <span className="text-border">•</span>
                            <span className="truncate">{req.office} Hub</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  )}

                  {/* Location / Department */}
                  {columnVisibility.location && (
                    <TableCell className="py-3">
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block truncate">
                        {req.office} Office
                      </span>
                      <span className="text-[11px] text-muted-foreground block truncate mt-0.5">
                        {req.country}
                      </span>
                    </TableCell>
                  )}

                  {/* Leave Type */}
                  {columnVisibility.leaveType && (
                    <TableCell className="py-3">
                      {renderTypeBadge(req.type)}
                      {req.isHalfDay && (
                        <span className="block mt-0.5 text-[10px] text-muted-foreground">
                          កន្លះថ្ងៃ ({req.halfDayType?.toLowerCase() === 'morning' ? 'ពេលព្រឹក' : 'ពេលរសៀល'})
                        </span>
                      )}
                    </TableCell>
                  )}

                  {/* Date Schedule */}
                  {columnVisibility.dates && (
                    <TableCell className="py-3">
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block whitespace-nowrap">
                        {formatDateRange(req.start, req.end)}
                      </span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5 whitespace-nowrap">
                        ស្នើ: {formatKhmerDate(req.appliedDate)}
                      </span>
                    </TableCell>
                  )}

                  {/* Duration */}
                  {columnVisibility.duration && (
                    <TableCell className="py-3">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {req.duration === 0.5 ? 'កន្លះថ្ងៃ' : `${req.duration} ថ្ងៃ`}
                      </span>
                    </TableCell>
                  )}

                  {/* Status Badge (Hero element with calm, non-pulsing pill) */}
                  {columnVisibility.status && (
                    <TableCell className="py-3">
                      {renderStatusBadge(req.status)}
                    </TableCell>
                  )}

                  {/* Reason (Clean text, no quotation marks, with hover tooltip) */}
                  {columnVisibility.reason && (
                    <TableCell className="py-3 hidden md:table-cell max-w-[190px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground truncate block cursor-default">
                            {reasonText}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          <p className="font-semibold text-foreground mb-1">
                            មូលហេតុស្នើសុំច្បាប់៖
                          </p>
                          <p>{req.reason || reasonText}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  )}

                  {/* Actions Column (Global TableActionMenu - Direct 1-Click Inline Buttons) */}
                  {columnVisibility.actions && (
                    <TableCell
                      className="py-3 text-right pr-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TableActionMenu
                        align="right"
                        variant="inline"
                        buttonSize="sm"
                        onView={() => onViewDetails(req)}
                        viewLabel="មើលព័ត៌មានលម្អិត & កំណត់ត្រា"
                        items={[
                          ...(req.status === 'Pending'
                            ? [
                                {
                                  label: 'អនុម័តសំណើ',
                                  icon: Check,
                                  onClick: () => onApprove(req.id),
                                  variant: 'success' as const,
                                },
                                {
                                  label: 'បដិសេធសំណើ',
                                  icon: X,
                                  onClick: () => onReject(req.id),
                                  variant: 'danger' as const,
                                },
                              ]
                            : []),
                          {
                            label: 'ចម្លងលេខកូដសំណើ',
                            icon: Copy,
                            onClick: () => copyId(req.id),
                            variant: 'default' as const,
                          },
                        ]}
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
};
