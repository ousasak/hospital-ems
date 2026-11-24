import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CloseButton } from './CloseButton';
import { cn } from '@/utils';

export type GlobalModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type GlobalModalIconVariant = 'teal' | 'primary' | 'blue' | 'amber' | 'rose' | 'slate';

export interface GlobalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  iconVariant?: GlobalModalIconVariant;
  size?: GlobalModalSize;
  footer?: React.ReactNode;
  preventClose?: boolean;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

const SIZE_CLASSES: Record<GlobalModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-3xl',
  '3xl': 'sm:max-w-4xl',
};

const ICON_VARIANT_CLASSES: Record<GlobalModalIconVariant, string> = {
  teal: 'bg-teal-600 text-white',
  primary: 'bg-primary text-primary-foreground',
  blue: 'bg-blue-600 text-white',
  amber: 'bg-amber-600 text-white',
  rose: 'bg-rose-600 text-white',
  slate: 'bg-slate-700 text-white dark:bg-slate-600',
};

export const GlobalModal: React.FC<GlobalModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  icon,
  iconVariant = 'teal',
  size = 'md',
  footer,
  preventClose = false,
  children,
  className,
  bodyClassName,
}) => {
  const handleClose = () => {
    if (!preventClose) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && preventClose) return;
        onOpenChange(val);
      }}
    >
      <DialogContent
        className={cn(
          'p-0 gap-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl [&>button:last-child]:hidden font-sans flex flex-col max-h-[92vh]',
          SIZE_CLASSES[size],
          className
        )}
      >
        {/* 1. Global Standard Modal Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20 shrink-0 text-left space-y-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs',
                    ICON_VARIANT_CLASSES[iconVariant]
                  )}
                >
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold text-foreground leading-snug truncate">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>

            <CloseButton
              onClose={handleClose}
              disabled={preventClose}
              size="md"
              variant="default"
            />
          </div>
        </DialogHeader>

        {/* 2. Scrollable Modal Body */}
        <div
          className={cn(
            'flex-1 overflow-y-auto p-5 sm:p-6',
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* 3. Global Standard Modal Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-border bg-muted/15 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GlobalModal;
