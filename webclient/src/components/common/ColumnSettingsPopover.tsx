import React, { useState, useMemo } from 'react';
import { Settings2, RotateCcw, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import { sound } from '@/utils/sound';
import { cn } from '@/utils';

export interface ColumnOption {
  key?: string;
  id?: string;
  label: string;
  required?: boolean;
}

export interface ColumnSettingsPopoverProps {
  columns: ColumnOption[];
  visibleColumns?: Record<string, boolean>;
  defaultVisibleColumns?: Record<string, boolean>;
  onChange?: (updated: Record<string, boolean>) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  title?: string;
  variant?: 'button' | 'icon';
  className?: string;
  buttonClassName?: string;
}

export const ColumnSettingsPopover: React.FC<ColumnSettingsPopoverProps> = ({
  columns = [],
  visibleColumns = {},
  defaultVisibleColumns,
  onChange,
  size = 'md',
  label,
  title,
  variant = 'button',
  className = '',
  buttonClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation(['common', 'tables']);

  const buttonText = label || title || t('tables.manageColumns', 'Manage Columns');
  const headerTitle = title || t('tables.manageColumns', 'Manage Columns');

  const getColKey = (col: ColumnOption) => col.key || col.id || '';

  const visibleCount = useMemo(
    () => columns.filter((col) => visibleColumns[getColKey(col)] !== false).length,
    [columns, visibleColumns]
  );
  const hiddenCount = columns.length - visibleCount;

  const handleToggleColumn = (colKey: string, required?: boolean) => {
    if (required) return;
    sound.playClick();
    const updated = {
      ...visibleColumns,
      [colKey]: visibleColumns[colKey] === false ? true : false,
    };
    onChange?.(updated);
  };

  const handleReset = () => {
    sound.playClick();
    if (defaultVisibleColumns) {
      onChange?.({ ...defaultVisibleColumns });
    } else {
      const allVisible: Record<string, boolean> = {};
      columns.forEach((c) => {
        allVisible[getColKey(c)] = true;
      });
      onChange?.(allVisible);
    }
  };

  const handleSelectAll = () => {
    sound.playClick();
    const allVisible: Record<string, boolean> = {};
    columns.forEach((c) => {
      allVisible[getColKey(c)] = true;
    });
    onChange?.(allVisible);
  };

  const sizeClasses = {
    sm: variant === 'button' ? 'h-8 min-h-[32px] max-h-[32px] px-2.5 text-xs font-medium rounded-md gap-1.5' : 'h-8 w-8 min-h-[32px] max-h-[32px] rounded-md',
    md: variant === 'button' ? 'h-10 min-h-[40px] max-h-[40px] px-3.5 sm:px-4 text-sm font-medium rounded-lg gap-2' : 'h-10 w-10 min-h-[40px] max-h-[40px] rounded-lg',
    lg: variant === 'button' ? 'h-12 min-h-[48px] max-h-[48px] px-4.5 text-base font-medium rounded-xl gap-2.5' : 'h-12 w-12 min-h-[48px] max-h-[48px] rounded-xl',
  };

  const iconSizes = {
    sm: 13,
    md: 15,
    lg: 17,
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const currentIconSize = iconSizes[size] || iconSizes.md;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => sound.playClick()}
          className={cn(
            'inline-flex items-center justify-center font-medium border border-slate-300 dark:border-slate-700 bg-card dark:bg-slate-900 hover:bg-muted/80 dark:hover:bg-slate-800 text-foreground dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer select-none shrink-0 box-border leading-normal',
            currentSizeClass,
            open && 'bg-accent dark:bg-slate-700 text-accent-foreground dark:text-white ring-1 ring-ring/30',
            buttonClassName,
            className
          )}
          title={buttonText}
          aria-expanded={open}
        >
          <Settings2
            size={currentIconSize}
            className={cn('shrink-0 transition-transform duration-200', open && 'rotate-45')}
          />
          {variant === 'button' && (
            <span className="whitespace-nowrap">{buttonText}</span>
          )}
          {hiddenCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-xs">
              {hiddenCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-60 p-2 shadow-2xl rounded-xl border border-border/90 bg-card select-none">
        <div className="flex items-center justify-between pb-2 mb-1 px-1 border-b border-border/60">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            {headerTitle}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{t('common.reset', 'Reset')}</span>
          </Button>
        </div>

        <div className="flex flex-col py-0.5 space-y-0.5 max-h-72 overflow-y-auto">
          {columns.map((col) => {
            const key = getColKey(col);
            const isChecked = visibleColumns[key] !== false;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleToggleColumn(key, col.required)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-left',
                  col.required && 'opacity-60 cursor-not-allowed'
                )}
                disabled={col.required}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                      isChecked
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-slate-300 dark:border-slate-600'
                    )}
                  >
                    {isChecked && <Check size={11} strokeWidth={3} />}
                  </div>
                  <span className="truncate">{col.label}</span>
                </div>
                {col.required && (
                  <span className="text-[10px] text-muted-foreground font-normal">
                    (Locked)
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-1.5 mt-1 border-t border-border/60 flex items-center justify-between px-1">
          <span className="text-[11px] text-muted-foreground">
            {visibleCount} / {columns.length} shown
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
          >
            Select All
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnSettingsPopover;
