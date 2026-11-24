import React, { useState } from 'react';
import { Download, ChevronDown, Calendar, CalendarDays, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils';
import { sound } from '@/utils/sound';

export type ExportDateRange = 'today' | '7days' | '30days' | 'month' | 'all' | string;

export interface ExportDropdownOption {
  value: ExportDateRange;
  label: string;
  icon?: React.ReactNode;
}

export type ExportDropdownVariant = 'outline' | 'secondary' | 'emerald' | 'soft' | 'primary';
export type ExportDropdownSize = 'sm' | 'md' | 'lg';

export interface ExportDropdownProps {
  onExport: (range: ExportDateRange) => void | Promise<void>;
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  align?: 'left' | 'right';
  options?: ExportDropdownOption[];
  title?: string;
  variant?: ExportDropdownVariant;
  size?: ExportDropdownSize;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExport,
  label,
  loading = false,
  disabled = false,
  className = '',
  align = 'right',
  options,
  title,
  variant = 'outline',
  size = 'md',
}) => {
  const { t } = useTranslation(['common']);
  const [isOpen, setIsOpen] = useState(false);
  const displayLabel = label || t('common.exportCsv', 'Export CSV');

  const defaultOptions: ExportDropdownOption[] = [
    { value: 'today', label: t('common.today', 'Today'), icon: <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> },
    { value: '7days', label: t('common.last7Days', 'Last 7 Days'), icon: <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> },
    { value: '30days', label: t('common.last30Days', 'Last 30 Days'), icon: <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> },
    { value: 'month', label: t('common.thisMonth', 'This Month'), icon: <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> },
    { value: 'all', label: t('common.allRecords', 'All Records'), icon: <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> },
  ];

  const exportOptions = options || defaultOptions;

  const handleSelect = (val: ExportDateRange) => {
    sound.playClick();
    onExport(val);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant === 'emerald' ? 'soft' : variant === 'secondary' ? 'secondary' : 'outline'}
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
          disabled={disabled || loading}
          className={cn(
            'font-semibold transition-all active:scale-[0.98] shrink-0 select-none shadow-2xs hover:shadow-xs gap-1.5',
            'border border-border/80 dark:border-slate-700 bg-card dark:bg-slate-800/90 text-foreground dark:text-slate-100 hover:bg-muted/80 dark:hover:bg-slate-700',
            className
          )}
        >
          {loading ? (
            <Loader2 className={cn('animate-spin', size === 'sm' ? 'size-3.5' : 'size-4')} />
          ) : (
            <Download className={cn(size === 'sm' ? 'size-3.5' : 'size-4', 'text-emerald-600 dark:text-emerald-400')} />
          )}
          <span>{displayLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align === 'left' ? 'start' : align === 'right' ? 'end' : undefined}
        className="w-52 p-1.5 shadow-lg"
      >
        {title && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
              {title}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {exportOptions.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className="flex items-center gap-2 text-xs py-2 px-2.5 cursor-pointer font-medium"
          >
            {opt.icon}
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportDropdown;
