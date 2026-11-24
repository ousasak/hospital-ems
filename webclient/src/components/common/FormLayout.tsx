import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader2 } from 'lucide-react';
import FormHeader, { type FormHeaderProps } from './FormHeader';
import FormFooter, { type FormFooterProps } from './FormFooter';
import LoadingSpinner from './LoadingSpinner';

export type FormCardIconVariant =
  | 'primary'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'purple'
  | 'rose'
  | 'indigo'
  | 'slate';

const ICON_VARIANT_STYLES: Record<FormCardIconVariant, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

export type FormMaxWidth =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | 'full'
  | string;

const MAX_WIDTH_MAP: Record<string, string> = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  '3xl': 'w-full',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'w-full max-w-none',
};

const resolveMaxWidth = (width?: FormMaxWidth): string => {
  if (!width) return 'w-full';
  return MAX_WIDTH_MAP[width] || (width.startsWith('max-w-') ? width : `max-w-[${width}]`);
};

export interface FormCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconVariant?: FormCardIconVariant;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  divider?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const FormCard: React.FC<FormCardProps> = ({
  title,
  subtitle,
  icon,
  iconVariant = 'primary',
  badge,
  action,
  collapsible = false,
  defaultOpen = true,
  isOpen: controlledOpen,
  onToggle,
  divider = false,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isExpanded = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const handleToggle = () => {
    if (!collapsible) return;
    const nextState = !isExpanded;
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextState);
    }
    onToggle?.(nextState);
  };

  const iconStyle = ICON_VARIANT_STYLES[iconVariant] || ICON_VARIANT_STYLES.primary;

  return (
    <div
      className={`bg-card dark:bg-slate-900 border border-border/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xs transition-all duration-200 ${className}`}
    >
      {/* Card Header */}
      <div
        onClick={collapsible ? handleToggle : undefined}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          collapsible ? 'cursor-pointer select-none group' : ''
        } ${divider ? 'pb-4 border-b border-border/70 dark:border-slate-800' : ''} ${headerClassName}`}
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          {icon && (
            <div
              className={`p-2 rounded-xl border flex items-center justify-center shrink-0 ${iconStyle}`}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {typeof title === 'string' ? (
                <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight">
                  {title}
                </h3>
              ) : (
                <div className="text-sm sm:text-base font-black text-foreground tracking-tight">
                  {title}
                </div>
              )}
              {badge && <div>{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-normal">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side Actions & Accordion Arrow */}
        {(action || collapsible) && (
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {action}
            {collapsible && (
              <motion.div
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{ duration: 0.15 }}
                className="p-1 rounded-lg text-muted-foreground group-hover:text-foreground"
              >
                <ChevronDown size={16} />
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Card Body */}
      {collapsible ? (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`pt-5 ${contentClassName}`}>{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div className={`pt-5 ${contentClassName}`}>{children}</div>
      )}
    </div>
  );
};

export interface FormSectionProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || subtitle) && (
        <div className="border-b border-border/70 dark:border-slate-800 pb-2">
          {title && <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-slate-200">{title}</h4>}
          {subtitle && <p className="text-[11px] text-muted-foreground dark:text-slate-400">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export interface FormContentProps {
  maxWidth?: FormMaxWidth;
  layout?: 'stack' | 'grid-2' | 'two-column' | 'custom';
  children: React.ReactNode;
  className?: string;
}

export const FormContent: React.FC<FormContentProps> = ({
  maxWidth = '3xl',
  layout = 'stack',
  children,
  className = '',
}) => {
  const maxWidthCls = resolveMaxWidth(maxWidth);

  let layoutCls = 'space-y-6';
  if (layout === 'grid-2') {
    layoutCls = 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start';
  } else if (layout === 'two-column') {
    layoutCls = 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start';
  } else if (layout === 'custom') {
    layoutCls = '';
  }

  return (
    <div className={`w-full ${maxWidthCls} ${layoutCls} ${className}`}>
      {children}
    </div>
  );
};

export interface FormLayoutProps {
  onSubmit?: (e: React.FormEvent) => void;
  noValidate?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  isSubmitting?: boolean;
  header?: React.ReactNode;
  headerProps?: FormHeaderProps;
  footer?: React.ReactNode;
  footerProps?: FormFooterProps;
  stickyFooter?: boolean;
  maxWidth?: FormMaxWidth;
  children: React.ReactNode;
  className?: string;
  formClassName?: string;
}

export const FormLayoutComponent: React.FC<FormLayoutProps> = ({
  onSubmit,
  noValidate = true,
  isLoading = false,
  loadingText,
  isSubmitting = false,
  header,
  headerProps,
  footer,
  footerProps,
  stickyFooter = false,
  children,
  className = '',
  formClassName = '',
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col h-96 items-center justify-center gap-3">
        <LoadingSpinner />
        {loadingText && (
          <p className="text-xs text-muted-foreground font-medium animate-pulse">{loadingText}</p>
        )}
      </div>
    );
  }

  const resolvedHeader = header || (headerProps ? <FormHeader {...headerProps} /> : null);
  const resolvedFooter =
    footer ||
    (footerProps ? (
      <FormFooter
        sticky={stickyFooter}
        isSubmitting={isSubmitting || footerProps.isSubmitting}
        {...footerProps}
      />
    ) : null);

  const contentBlock = (
    <div className="space-y-8">
      {/* Form Content / Cards */}
      {children}

      {/* Form Footer */}
      {resolvedFooter}
    </div>
  );

  return (
    <div className={`space-y-6 pb-12 w-full transition-all ${className}`}>
      {/* 1. Global Form Header */}
      {resolvedHeader}

      {/* 2. Form Tag or Div Container */}
      {onSubmit ? (
        <form onSubmit={onSubmit} noValidate={noValidate} className={`space-y-8 ${formClassName}`}>
          {contentBlock}
        </form>
      ) : (
        <div className={`space-y-8 ${formClassName}`}>{contentBlock}</div>
      )}
    </div>
  );
};

export type FormLayoutType = typeof FormLayoutComponent & {
  Header: typeof FormHeader;
  Content: typeof FormContent;
  Body: typeof FormContent;
  Card: typeof FormCard;
  Section: typeof FormSection;
  Footer: typeof FormFooter;
};

export const FormLayout = FormLayoutComponent as FormLayoutType;
FormLayout.Header = FormHeader;
FormLayout.Content = FormContent;
FormLayout.Body = FormContent;
FormLayout.Card = FormCard;
FormLayout.Section = FormSection;
FormLayout.Footer = FormFooter;

export default FormLayout;
