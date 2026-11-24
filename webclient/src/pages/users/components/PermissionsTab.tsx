import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Lock, RotateCcw, Save, Search } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useLocaleStore } from '@/stores/localeStore';
import { cn } from '@/utils';
import { Permission, Role } from '../types';
import { groupPermissionsByModule } from '../utils/permissionModules';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common';

interface PermissionsTabProps {
  permissions: Permission[];
  roles: Role[];
  isLoading: boolean;
  onUpdateRolePermissions?: (roleId: number, permissions: string[]) => Promise<void>;
  isSavingPermissions?: boolean;
}

const ROLE_TITLE_KH: Record<string, string> = {
  super_admin: 'អភិបាលជាន់ខ្ពស់',
  admin: 'អភិបាលប្រព័ន្ធ',
  hr_manager: 'ប្រធានធនធានមនុស្ស',
  hr_staff: 'បុគ្គលិកធនធានមនុស្ស',
  department_manager: 'ប្រធាននាយកដ្ឋាន',
  accountant: 'គណនេយ្យករ',
  employee: 'បុគ្គលិកទូទៅ',
};

const PERMISSION_LABEL_KH: Record<string, string> = {
  'view dashboard': 'មើលផ្ទាំងព័ត៌មានទូទៅ',
  'manage organization': 'គ្រប់គ្រងរចនាសម្ព័ន្ធស្ថាប័ន',
  'manage employees': 'គ្រប់គ្រងបុគ្គលិក',
  'manage assignments': 'គ្រប់គ្រងការចាត់តាំងបុគ្គលិក',
  'view attendance': 'មើលវត្តមានការងារ',
  'manage attendance': 'គ្រប់គ្រងវត្តមានការងារ',
  'approve attendance': 'អនុម័តវត្តមានការងារ',
  'view leaves': 'មើលច្បាប់ឈប់សម្រាក',
  'request leaves': 'ដាក់សំណើសុំច្បាប់ឈប់សម្រាក',
  'approve leaves supervisor': 'អនុម័តច្បាប់ (ប្រធានផ្នែក)',
  'approve leaves hr': 'អនុម័តច្បាប់ (ធនធានមនុស្ស)',
  'view payroll': 'មើលប្រាក់បៀវត្ស',
  'process payroll': 'ដំណើរការបើកប្រាក់បៀវត្ស',
  'view recruitment': 'មើលការជ្រើសរើសបុគ្គលិក',
  'manage recruitment': 'គ្រប់គ្រងការជ្រើសរើសបុគ្គលិក',
  'view performance': 'មើលការវាយតម្លៃសមិទ្ធផល',
  'manage performance': 'គ្រប់គ្រងការវាយតម្លៃសមិទ្ធផល',
  'view training': 'មើលការបណ្តុះបណ្តាល',
  'manage training': 'គ្រប់គ្រងការបណ្តុះបណ្តាល',
  'view reports': 'មើលរបាយការណ៍',
  'export reports': 'នាំចេញរបាយការណ៍',
  'manage users': 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
  'manage roles': 'គ្រប់គ្រងតួនាទី និងសិទ្ធិ',
  'view audit logs': 'មើលកំណត់ត្រាសវនកម្ម',
  'manage settings': 'គ្រប់គ្រងការកំណត់ប្រព័ន្ធ',
};

const formatRoleDisplay = (roleName: string, isKhmer: boolean): string => {
  const slug = roleName.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (isKhmer && ROLE_TITLE_KH[slug]) {
    return ROLE_TITLE_KH[slug];
  }
  return roleName;
};

const formatPermissionLabel = (permName: string, isKhmer: boolean): string => {
  const lower = permName.trim().toLowerCase();
  if (isKhmer && PERMISSION_LABEL_KH[lower]) {
    return PERMISSION_LABEL_KH[lower];
  }
  return permName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const getRoleDotColor = (roleName: string): string => {
  const lower = roleName.toLowerCase();
  if (lower.includes('super')) return 'bg-purple-500';
  if (lower.includes('hr') && lower.includes('manager')) return 'bg-indigo-500';
  if (lower.includes('hr')) return 'bg-teal-500';
  if (lower.includes('department') || lower.includes('manager')) return 'bg-emerald-500';
  if (lower.includes('accountant')) return 'bg-amber-500';
  if (lower.includes('employee')) return 'bg-sky-500';
  return 'bg-slate-400';
};

export const PermissionsTab: React.FC<PermissionsTabProps> = ({
  permissions,
  roles,
  isLoading,
  onUpdateRolePermissions,
  isSavingPermissions = false,
}) => {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const isKhmer = locale === 'kh' || locale === 'km';

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(() =>
    roles.length > 0 ? roles[0].id : null
  );
  const [search, setSearch] = useState('');

  const activeRole = useMemo(() => {
    if (!selectedRoleId && roles.length > 0) return roles[0];
    return roles.find((r) => r.id === selectedRoleId) || roles[0] || null;
  }, [roles, selectedRoleId]);

  const [selectedPermNames, setSelectedPermNames] = useState<string[]>([]);
  const [originalPermNames, setOriginalPermNames] = useState<string[]>([]);

  useEffect(() => {
    if (activeRole) {
      const names = (activeRole.permissions || []).map((p) => p.name);
      setSelectedPermNames(names);
      setOriginalPermNames(names);
    }
  }, [activeRole]);

  const isSuperAdmin = activeRole?.name === 'Super Admin';

  const hasChanges = useMemo(() => {
    if (isSuperAdmin) return false;
    if (selectedPermNames.length !== originalPermNames.length) return true;
    const origSet = new Set(originalPermNames);
    return selectedPermNames.some((n) => !origSet.has(n));
  }, [isSuperAdmin, selectedPermNames, originalPermNames]);

  const moduleGroups = useMemo(() => groupPermissionsByModule(permissions), [permissions]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return moduleGroups;
    const q = search.trim().toLowerCase();
    return moduleGroups
      .map((group) => {
        const titleMatch =
          t(group.titleKey, group.defaultTitle).toLowerCase().includes(q) ||
          group.key.toLowerCase().includes(q);
        const matchedPerms = group.permissions.filter((p) => {
          const localized = formatPermissionLabel(p.name, isKhmer).toLowerCase();
          return p.name.toLowerCase().includes(q) || localized.includes(q);
        });
        if (titleMatch) return group;
        if (matchedPerms.length > 0) {
          return { ...group, permissions: matchedPerms };
        }
        return null;
      })
      .filter(Boolean) as typeof moduleGroups;
  }, [moduleGroups, search, t, isKhmer]);

  const handleTogglePermission = (permName: string) => {
    if (isSuperAdmin) return;
    setSelectedPermNames((prev) =>
      prev.includes(permName) ? prev.filter((n) => n !== permName) : [...prev, permName]
    );
  };

  const handleToggleModule = (moduleGroupKey: string) => {
    if (isSuperAdmin) return;
    const group = moduleGroups.find((g) => g.key === moduleGroupKey);
    if (!group) return;

    const groupPermNames = group.permissions.map((p) => p.name);
    const allSelected = groupPermNames.every((name) => selectedPermNames.includes(name));

    setSelectedPermNames((prev) => {
      if (allSelected) {
        const removeSet = new Set(groupPermNames);
        return prev.filter((n) => !removeSet.has(n));
      }
      return Array.from(new Set([...prev, ...groupPermNames]));
    });
  };

  const handleSelectAll = () => {
    if (isSuperAdmin) return;
    setSelectedPermNames(permissions.map((p) => p.name));
  };

  const handleDeselectAll = () => {
    if (isSuperAdmin) return;
    setSelectedPermNames([]);
  };

  const handleReset = () => {
    setSelectedPermNames(originalPermNames);
  };

  const handleSave = async () => {
    if (!activeRole || !onUpdateRolePermissions || isSuperAdmin || !hasChanges) return;
    await onUpdateRolePermissions(activeRole.id, selectedPermNames);
    setOriginalPermNames(selectedPermNames);
  };

  const activeCount = isSuperAdmin ? permissions.length : selectedPermNames.length;

  return (
    <Card className="overflow-hidden rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-card shadow-md">
      {/* ── 1. Role Switcher Bar ───────────────────────────────────────────── */}
      <div className="border-b border-border/70 bg-muted/20 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {roles.map((r) => {
              const isCurrent = activeRole?.id === r.id;
              const roleCount =
                r.id === activeRole?.id
                  ? activeCount
                  : r.name === 'Super Admin'
                  ? permissions.length
                  : r.permissions?.length ?? 0;

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoleId(r.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                    isCurrent
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-background text-muted-foreground border border-border/80 hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full shrink-0',
                      isCurrent ? 'bg-primary-foreground/90' : getRoleDotColor(r.name)
                    )}
                  />
                  <span>{formatRoleDisplay(r.name, isKhmer)}</span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-mono tabular-nums',
                      isCurrent
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {roleCount}
                  </span>
                </button>
              );
            })}
          </div>

          {!isSuperAdmin && (
            <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {t('users.actions.selectAll', 'ជ្រើសទាំងអស់')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {t('users.actions.deselectAll', 'ដោះទាំងអស់')}
              </Button>
              {onUpdateRolePermissions && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges || isSavingPermissions}
                  className="h-8 px-3.5 rounded-lg text-xs font-semibold gap-1.5"
                >
                  {isSavingPermissions ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>{t('users.actions.save', 'រក្សាទុកសិទ្ធិ')}</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Search & Status Sub-bar ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('users.permissions.searchPlaceholder', 'ស្វែងរកសិទ្ធិ ឬម៉ូឌុល...')}
            className="pl-9 h-9 text-xs sm:text-sm rounded-lg"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
              <Lock className="h-3 w-3 shrink-0" />
              <span>
                {isKhmer
                  ? 'តួនាទី Super Admin មានសិទ្ធិពេញលេញដោយស្វ័យប្រវត្តិ'
                  : 'Super Admin automatically inherits all permissions'}
              </span>
            </span>
          )}

          {hasChanges && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{t('settings.common.unsavedChanges', 'មានការផ្លាស់ប្តូរមិនទាន់រក្សាទុក')}</span>
            </span>
          )}

          <Badge variant="secondary" className="rounded-full font-normal tabular-nums text-xs">
            {activeCount} / {permissions.length} {t('users.tabs.permissions', 'សិទ្ធិ')}
          </Badge>
        </div>
      </div>

      {/* ── 3. Clean Module Permission Matrix ──────────────────────────────── */}
      <CardContent className="p-0">
        {isLoading ? (
          <div className="divide-y divide-border/50">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                <Skeleton className="h-4 w-40 shrink-0" />
                <div className="flex flex-wrap gap-2 flex-1">
                  <Skeleton className="h-8 w-36 rounded-lg" />
                  <Skeleton className="h-8 w-40 rounded-lg" />
                  <Skeleton className="h-8 w-32 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="py-16 text-center">
            <EmptyState
              title={t('common.noRecordsFound', 'រកមិនឃើញទិន្នន័យឡើយ')}
              actionLabel={search ? t('common.clear', 'សម្អាត') : undefined}
              onAction={search ? () => setSearch('') : undefined}
            />
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredGroups.map((group) => {
              const groupPermNames = group.permissions.map((p) => p.name);
              const selectedInGroup = groupPermNames.filter(
                (n) => isSuperAdmin || selectedPermNames.includes(n)
              ).length;
              const allInGroupSelected =
                groupPermNames.length > 0 && selectedInGroup === groupPermNames.length;

              return (
                <div
                  key={group.key}
                  className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-muted/20 lg:grid-cols-[240px_1fr_auto] lg:items-center lg:gap-6"
                >
                  {/* Module Column */}
                  <div className="flex items-center justify-between lg:block">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {t(group.titleKey, group.defaultTitle)}
                      </h4>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {selectedInGroup} / {groupPermNames.length}{' '}
                        {t('users.tabs.permissions', 'សិទ្ធិ')}
                      </span>
                    </div>

                    {/* Mobile Module Toggle */}
                    {!isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleToggleModule(group.key)}
                        className="lg:hidden text-xs font-medium text-primary hover:underline cursor-pointer"
                      >
                        {allInGroupSelected
                          ? isKhmer
                            ? 'ដោះចេញ'
                            : 'Deselect'
                          : isKhmer
                          ? 'ជ្រើសទាំងអស់'
                          : 'Select all'}
                      </button>
                    )}
                  </div>

                  {/* Interactive Permission Items */}
                  <div className="flex flex-wrap items-center gap-2">
                    {group.permissions.map((p) => {
                      const isChecked = isSuperAdmin || selectedPermNames.includes(p.name);

                      return (
                        <button
                          key={p.name}
                          type="button"
                          role="checkbox"
                          aria-checked={isChecked}
                          disabled={isSuperAdmin}
                          onClick={() => handleTogglePermission(p.name)}
                          title={p.name}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all select-none',
                            isSuperAdmin
                              ? 'cursor-default border-primary/25 bg-primary/5 text-foreground/85'
                              : isChecked
                              ? 'cursor-pointer border-primary/40 bg-primary/5 text-foreground hover:bg-primary/10'
                              : 'cursor-pointer border-border/80 bg-background text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/40'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-[4px] border transition-colors shrink-0',
                              isChecked
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-slate-300 dark:border-slate-600 bg-background'
                            )}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </span>
                          <span>{formatPermissionLabel(p.name, isKhmer)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Desktop Module Select-All Toggle */}
                  <div className="hidden lg:flex justify-end">
                    {!isSuperAdmin ? (
                      <button
                        type="button"
                        onClick={() => handleToggleModule(group.key)}
                        className={cn(
                          'text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                          allInGroupSelected
                            ? 'text-primary hover:text-primary/80'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {allInGroupSelected
                          ? isKhmer
                            ? 'ដោះចេញ'
                            : 'Deselect'
                          : isKhmer
                          ? 'ជ្រើសទាំងអស់'
                          : 'Select all'}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                        {t('common.selected', 'បានជ្រើស')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* ── 4. Unsaved Changes Footer Bar ──────────────────────────────────── */}
      {hasChanges && onUpdateRolePermissions && (
        <div className="flex flex-col gap-3 border-t border-border/70 bg-muted/20 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{t('settings.common.unsavedChanges', 'មានការផ្លាស់ប្តូរមិនទាន់រក្សាទុក')}</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSavingPermissions}
              className="h-8 px-3 text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t('common.reset', 'កំណត់ឡើងវិញ')}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSavingPermissions}
              className="h-8 px-4 text-xs font-semibold gap-1.5"
            >
              {isSavingPermissions ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>{t('users.actions.save', 'រក្សាទុកសិទ្ធិ')}</span>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
