import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

export interface EnterpriseDatePickerProps {
  value?: string | null;
  onChange?: (val: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string | boolean;
}

export const EnterpriseDatePicker: React.FC<EnterpriseDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'YYYY-MM-DD',
  required = false,
  disabled = false,
  className = '',
  error,
}) => {
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = () => {
    if (disabled) return;
    try {
      hiddenDateRef.current?.showPicker();
    } catch {
      hiddenDateRef.current?.focus();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-foreground/90 dark:text-slate-200 mb-1.5">
          {label} {required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
        </label>
      )}
      <div
        onClick={handleOpenPicker}
        className={`relative flex items-center justify-between w-full h-10 min-h-[40px] px-3.5 py-2 text-xs sm:text-[13px] rounded-xl border border-border/80 dark:border-slate-700/80 bg-background dark:bg-slate-900 text-foreground font-mono transition-all cursor-pointer group hover:border-slate-400 dark:hover:border-slate-600 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${error ? 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20' : ''}`}
      >
        <span className={`select-none truncate ${value ? 'text-foreground font-medium' : 'text-muted-foreground/45'}`}>
          {value || placeholder}
        </span>
        <Calendar size={15} className="text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 ml-2" />
        <input
          ref={hiddenDateRef}
          type="date"
          disabled={disabled}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
          tabIndex={-1}
        />
      </div>
    </div>
  );
};

export default EnterpriseDatePicker;
