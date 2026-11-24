import React from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import { cn } from '@/utils';
import type { SettingsSectionId } from '../types';

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  visible?: boolean;
}

export interface SettingsNavGroup {
  id: string;
  label: string;
  items: SettingsNavItem[];
}

interface SettingsSidebarNavProps {
  groups: SettingsNavGroup[];
  activeSection: SettingsSectionId;
  dirtySections?: Partial<Record<SettingsSectionId, boolean>>;
  onSelect: (id: SettingsSectionId) => void;
}

export const SettingsSidebarNav: React.FC<SettingsSidebarNavProps> = ({
  groups,
  activeSection,
  dirtySections = {},
  onSelect,
}) => {
  const { t } = useLocaleStore();
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.visible !== false),
    }))
    .filter((group) => group.items.length > 0);

  const allItems = visibleGroups.flatMap((g) => g.items);

  return (
    <>
      {/* Mobile / Tablet horizontal category bar */}
      <nav
        aria-label={t('settings.title')}
        className="lg:hidden -mx-1 px-1 overflow-x-auto pb-1"
      >
        <div className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-card p-1 min-w-full sm:min-w-0">
          {allItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const isDirty = Boolean(dirtySections[item.id]);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  'relative inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={cn(
                      'inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {isDirty && (
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      isActive ? 'bg-amber-300' : 'bg-amber-500'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop sticky vertical sidebar */}
      <aside
        aria-label={t('settings.title')}
        className="hidden lg:block w-60 shrink-0 sticky top-20 space-y-6"
      >
        {visibleGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const isDirty = Boolean(dirtySections[item.id]);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group relative flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer text-left',
                      isActive
                        ? 'bg-card text-foreground font-medium shadow-xs ring-1 ring-border/80'
                        : 'text-muted-foreground font-normal hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary"
                      />
                    )}
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>

                    <span className="flex items-center gap-1.5 shrink-0">
                      {isDirty && (
                        <span
                          className="h-2 w-2 rounded-full bg-amber-500"
                          title={t('settings.common.unsavedChanges')}
                        />
                      )}
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span
                          className={cn(
                            'inline-flex h-5 min-w-[20px] items-center justify-center rounded-md px-1.5 text-[11px] font-medium tabular-nums',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </aside>
    </>
  );
};

export default SettingsSidebarNav;
