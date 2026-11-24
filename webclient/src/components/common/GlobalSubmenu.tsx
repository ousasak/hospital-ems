import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';

export type SubmenuBadgeVariant = 'default' | 'teal' | 'amber' | 'rose' | 'blue';

export interface SubmenuItem<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  count?: number | string;
  badgeVariant?: SubmenuBadgeVariant;
  disabled?: boolean;
}

export interface GlobalSubmenuProps<T extends string = string> {
  items: SubmenuItem<T>[];
  value: T;
  onChange: (value: T) => void;
  rightContent?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

const getBadgeClasses = (variant: SubmenuBadgeVariant, isActive: boolean): string => {
  switch (variant) {
    case 'amber':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60';
    case 'teal':
      return 'bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60';
    case 'rose':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60';
    case 'blue':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60';
    case 'default':
    default:
      return isActive
        ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/70 dark:border-slate-700/70';
  }
};

/**
 * Global Enterprise SaaS Submenu Bar (Modern Underline Tabs — Stripe / Linear / GitHub style).
 * Matches the standard underline submenu pattern across StaffStream EMS / Admin KHPosCommerce.
 */
export function GlobalSubmenu<T extends string = string>({
  items,
  value,
  onChange,
  rightContent,
  className,
  ariaLabel = 'Submenu navigation',
}: GlobalSubmenuProps<T>) {
  return (
    <div
      className={cn(
        'border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-4',
        className
      )}
    >
      <nav
        role="tablist"
        aria-label={ariaLabel}
        className="flex items-center gap-5 sm:gap-8 flex-nowrap overflow-x-auto scrollbar-none -mb-px w-full"
      >
        {items.map((item) => {
          const isActive = value === item.value;
          const IconComp = item.icon;
          const showCount = item.count !== undefined && item.count !== null;

          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={item.disabled}
              onClick={() => !item.disabled && onChange(item.value)}
              className={cn(
                'relative inline-flex items-center gap-2 pb-3 pt-1 px-0.5 border-b-2 text-xs sm:text-sm transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer select-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 rounded-t-sm',
                isActive
                  ? 'border-teal-600 dark:border-teal-400 text-teal-700 dark:text-teal-300 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 font-medium',
                item.disabled && 'opacity-50 pointer-events-none cursor-not-allowed'
              )}
            >
              {IconComp && (
                React.isValidElement(IconComp) ? (
                  IconComp
                ) : typeof IconComp === 'function' || typeof IconComp === 'object' ? (
                  // @ts-expect-error dynamic Lucide/React icon component render
                  <IconComp
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                  />
                ) : null
              )}

              <span>{item.label}</span>

              {showCount && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-mono font-semibold border transition-colors',
                    getBadgeClasses(item.badgeVariant || 'default', isActive)
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {rightContent && <div className="shrink-0 pb-2">{rightContent}</div>}
    </div>
  );
}

export default GlobalSubmenu;
