import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/utils';
import { useTranslation } from '../../i18n';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode | React.ComponentType<{ size?: number; className?: string }>;
}

export interface EmptyStateProps {
  cols?: number;
  title?: React.ReactNode;
  message?: React.ReactNode;
  description?: React.ReactNode;
  actionText?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: EmptyStateAction | React.ReactNode;
  actionIcon?: React.ReactNode | React.ComponentType<{ size?: number; className?: string }>;
  icon?: React.ReactNode | React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
  py?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  cols,
  title,
  message,
  description,
  actionText,
  actionLabel,
  onAction,
  action,
  actionIcon,
  icon,
  className,
  py = 'py-10',
  children,
}) => {
  const { t } = useTranslation();
  const resolvedTitle = title ?? message ?? t('common.noData', 'No records found');
  const resolvedDesc = description ?? t('common.noDataDesc', 'There are no items to display at this time.');

  let renderedIcon: React.ReactNode = null;
  if (React.isValidElement(icon)) {
    renderedIcon = icon;
  } else if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
    const IconComp = icon as React.ComponentType<{ size?: number; className?: string }>;
    renderedIcon = <IconComp size={24} className="stroke-1.5" />;
  } else {
    renderedIcon = <Inbox className="h-6 w-6 stroke-1.5" />;
  }

  const effectiveActionLabel = actionLabel || actionText;
  const resolvedAction = action ?? (
    effectiveActionLabel && onAction
      ? {
          label: effectiveActionLabel,
          onClick: onAction,
          icon: actionIcon,
        }
      : undefined
  );

  const content = (
    <div className={cn('flex flex-col items-center justify-center text-center animate-in fade-in-50', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
        {renderedIcon}
      </div>
      {resolvedTitle && <h4 className="text-base font-semibold text-foreground">{resolvedTitle}</h4>}
      {resolvedDesc && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{resolvedDesc}</p>}

      {(resolvedAction || children) && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {resolvedAction && (
            React.isValidElement(resolvedAction) ? (
              resolvedAction
            ) : typeof resolvedAction === 'object' && 'label' in resolvedAction && 'onClick' in resolvedAction ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(resolvedAction as EmptyStateAction).onClick}
                className="gap-1.5 font-medium shadow-2xs hover:bg-muted"
              >
                <Plus size={14} />
                <span>{(resolvedAction as EmptyStateAction).label}</span>
              </Button>
            ) : null
          )}
          {children}
        </div>
      )}
    </div>
  );

  if (cols !== undefined) {
    return (
      <tr>
        <td
          colSpan={cols}
          className={cn(py, 'px-4 text-center text-muted-foreground w-full', className)}
        >
          {content}
        </td>
      </tr>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-border p-10 text-center',
        py,
        className
      )}
    >
      {content}
    </div>
  );
};

export const TableEmptyState = EmptyState;
export default EmptyState;
