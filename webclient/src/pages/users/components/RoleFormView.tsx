import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check, Loader2, Lock } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useLocaleStore } from '@/stores/localeStore';
import { cn } from '@/utils';
import { Permission, Role, RoleFormData } from '../types';
import { groupPermissionsByModule } from '../utils/permissionModules';

interface RoleFormViewProps {
  editingRole: Role | null;
  permissions: Permission[];
  isLoading: boolean;
  onSubmit: (data: RoleFormData) => Promise<void>;
  onCancel: () => void;
}

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

const ROLE_TITLE_KH: Record<string, string> = {
  super_admin: 'អភិបាលជាន់ខ្ពស់',
  admin: 'អភិបាលប្រព័ន្ធ',
  hr_manager: 'ប្រធានធនធានមនុស្ស',
  hr_staff: 'បុគ្គលិកធនធានមនុស្ស',
  department_manager: 'ប្រធាននាយកដ្ឋាន',
  accountant: 'គណនេយ្យករ',
  employee: 'បុគ្គលិកទូទៅ',
};

const formatPermissionTitle = (permName: string, isKhmer: boolean): string => {
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

export const RoleFormView: React.FC<RoleFormViewProps> = ({
  editingRole,
  permissions,
  isLoading,
  onSubmit,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const isKhmer = locale === 'kh' || locale === 'km';

  const [name, setName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSystemRole = Boolean(editingRole?.is_system);
  const isSuperAdmin = editingRole?.name === 'Super Admin';

  useEffect(() => {
    if (editingRole) {
      setName(editingRole.name);
      setSelectedPermissions(
        editingRole.name === 'Super Admin'
          ? permissions.map((p) => p.name)
          : (editingRole.permissions || []).map((p) => p.name)
      );
    } else {
      setName('');
      setSelectedPermissions([]);
    }
    setErrorMsg(null);

    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [editingRole, permissions]);

  const moduleGroups = useMemo(() => groupPermissionsByModule(permissions), [permissions]);

  const displayRoleName = useMemo(() => {
    if (!editingRole) return '';
    const slug = editingRole.name.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (isKhmer && ROLE_TITLE_KH[slug]) {
      return ROLE_TITLE_KH[slug];
    }
    return editingRole.name;
  }, [editingRole, isKhmer]);

  const togglePermission = (permName: string) => {
    if (isSuperAdmin) return;
    setSelectedPermissions((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
    );
  };

  const toggleModuleAll = (groupPerms: string[]) => {
    if (isSuperAdmin) return;
    const allSelected =
      groupPerms.length > 0 && groupPerms.every((n) => selectedPermissions.includes(n));
    setSelectedPermissions((prev) => {
      if (allSelected) {
        const removeSet = new Set(groupPerms);
        return prev.filter((n) => !removeSet.has(n));
      }
      return Array.from(new Set([...prev, ...groupPerms]));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg(t('users.messages.nameRequired', 'សូមបញ្ចូលឈ្មោះតួនាទី'));
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        permissions: isSuperAdmin ? permissions.map((p) => p.name) : selectedPermissions,
      });
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          t('users.messages.actionFailed', 'ប្រតិបត្តិការបរាជ័យ')
      );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* ── 1. GLOBAL BREADCRUMB ──────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          {t('nav.dashboard', 'ផ្ទាំងគ្រប់គ្រង')}
        </button>
        <span className="text-slate-400 dark:text-slate-600">›</span>
        <button
          type="button"
          onClick={onCancel}
          className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          {t('users.tabs.roles', 'តួនាទី')}
        </button>
        <span className="text-slate-400 dark:text-slate-600">›</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">
          {editingRole ? displayRoleName : t('users.dialog.createRoleTitle', 'បង្កើតតួនាទីថ្មី')}
        </span>
        <span className="text-slate-400 dark:text-slate-600">›</span>
        <span className="text-slate-900 dark:text-white font-semibold">
          {editingRole ? t('common.edit', 'កែប្រែ') : t('common.create', 'បង្កើត')}
        </span>
      </nav>

      {/* ── 2. HERO HEADER ────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {editingRole
            ? `${t('common.edit', 'កែប្រែ')} ${displayRoleName}`
            : t('users.dialog.createRoleTitle', 'បង្កើតតួនាទីថ្មី')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {editingRole
            ? t('users.dialog.editRoleDesc', 'កែប្រែឈ្មោះ និងសិទ្ធិប្រតិបត្តិការនៃតួនាទីនេះ។')
            : t('users.dialog.createRoleDesc', 'បង្កើតតួនាទីថ្មី និងកំណត់សិទ្ធិប្រតិបត្តិការតាមតម្រូវការ។')}
        </p>
      </div>

      {/* ── 3. APEX SHADCN FORM CARD ──────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card p-6 sm:p-8 shadow-xs">
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isKhmer ? 'ព័ត៌មានលម្អិតតួនាទី' : 'Role Details'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {isKhmer
              ? 'សិទ្ធិដែលបានកំណត់នៅទីនេះនឹងអនុវត្តចំពោះអ្នកប្រើប្រាស់ទាំងអស់ដែលកាន់តួនាទីនេះ។'
              : 'Permissions granted here apply to every user assigned to this role.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Role Name & Guard Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="role-name-input"
                className="block text-sm font-semibold text-slate-900 dark:text-white mb-2"
              >
                {t('users.columns.roleName', 'ឈ្មោះតួនាទី')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="role-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                disabled={isSystemRole}
                placeholder={t('users.roles.roleNamePlaceholder', 'ឧ. Inventory Manager')}
                className="w-full h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed"
                required
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                {isSystemRole
                  ? t('users.roles.systemRoleProtected', 'ឈ្មោះតួនាទីប្រព័ន្ធមិនអាចកែប្រែបានទេ។')
                  : isKhmer
                  ? 'ឈ្មោះសម្គាល់តួនាទីក្នុងប្រព័ន្ធ (ឧ. HR Assistant, Shift Lead)។'
                  : 'Unique role name in the system (e.g. HR Assistant, Shift Lead).'}
              </p>
            </div>

            <div>
              <label
                htmlFor="role-guard-input"
                className="block text-sm font-semibold text-slate-900 dark:text-white mb-2"
              >
                Guard Scope
              </label>
              <input
                id="role-guard-input"
                type="text"
                value={editingRole?.guard_name || 'web'}
                readOnly
                disabled
                className="w-full h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-sm font-mono font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                {isKhmer
                  ? 'វិសាលភាពផ្ទៀងផ្ទាត់សិទ្ធិប្រព័ន្ធ (លំនាំដើម: web)។'
                  : 'Authentication guard used to verify permissions (Default: web).'}
              </p>
            </div>
          </div>

          {/* Permissions Section (Exact PosCommerce 2-Column Clean Grid) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                  {t('users.tabs.permissions', 'សិទ្ធិអនុញ្ញាត')}
                </label>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  ({selectedPermissions.length} / {permissions.length})
                </span>
              </div>

              {!isSuperAdmin && (
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedPermissions(permissions.map((p) => p.name))}
                    className="font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer"
                  >
                    {t('users.actions.selectAll', 'ជ្រើសទាំងអស់')}
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPermissions([])}
                    className="font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline cursor-pointer"
                  >
                    {t('users.actions.deselectAll', 'ដោះទាំងអស់')}
                  </button>
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <div className="mb-5 rounded-lg border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 px-3.5 py-2.5 text-xs text-blue-800 dark:text-blue-300">
                {t(
                  'users.permissions.inheritedNotice',
                  'តួនាទី Super Admin មានសិទ្ធិពេញលេញលើគ្រប់ម៉ូឌុលទាំងអស់ក្នុងប្រព័ន្ធដោយស្វ័យប្រវត្តិ។'
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-6">
              {moduleGroups.map((group) => {
                const groupPermNames = group.permissions.map((p) => p.name);
                const isAllModSelected =
                  groupPermNames.length > 0 &&
                  groupPermNames.every((n) => selectedPermissions.includes(n));

                return (
                  <div key={group.key} className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        {t(group.titleKey, group.defaultTitle)}
                      </span>
                      {!isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => toggleModuleAll(groupPermNames)}
                          className="text-[11px] font-normal text-slate-400 hover:text-primary dark:text-slate-500 dark:hover:text-primary transition-colors cursor-pointer select-none"
                        >
                          {isAllModSelected
                            ? isKhmer
                              ? 'ដោះចេញ'
                              : 'Deselect'
                            : isKhmer
                            ? 'ជ្រើសទាំងអស់'
                            : 'Select all'}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {group.permissions.map((p) => {
                        const isChecked = isSuperAdmin || selectedPermissions.includes(p.name);

                        return (
                          <div
                            key={p.name}
                            role="checkbox"
                            aria-checked={isChecked}
                            aria-disabled={isSuperAdmin}
                            tabIndex={isSuperAdmin ? -1 : 0}
                            onClick={() => togglePermission(p.name)}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                togglePermission(p.name);
                              }
                            }}
                            className={cn(
                              'flex items-center gap-2.5 select-none group py-0.5 outline-none',
                              isSuperAdmin ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            )}
                          >
                            <div
                              className={cn(
                                'w-5 h-5 rounded-[4px] border flex items-center justify-center transition-all shrink-0',
                                isChecked
                                  ? 'bg-primary border-primary text-primary-foreground shadow-xs'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover:border-primary'
                              )}
                            >
                              {isChecked && (
                                <Check
                                  size={14}
                                  strokeWidth={3.5}
                                  className="text-primary-foreground"
                                />
                              )}
                            </div>
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                              {formatPermissionTitle(p.name, isKhmer)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions Footer */}
          <div className="flex flex-wrap items-center gap-3 pt-6 mt-8 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground active:scale-[0.98] text-sm font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading && <Loader2 className="animate-spin size-4" />}
              <span>
                {editingRole
                  ? t('common.saveChanges', 'រក្សាទុកការផ្លាស់ប្តូរ')
                  : t('users.actions.addRole', 'បង្កើតតួនាទី')}
              </span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="h-10 px-5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{t('common.cancel', 'បោះបង់')}</span>
            </button>

            {editingRole && isSystemRole && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 dark:text-slate-500 sm:ml-2">
                <Lock size={14} className="shrink-0 text-slate-400" />
                <span>
                  {isKhmer
                    ? 'តួនាទីប្រព័ន្ធ — អាចកែប្រែសិទ្ធិបាន ប៉ុន្តែមិនអាចលុបបានទេ។'
                    : 'Built-in role — it can be updated but not deleted.'}
                </span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleFormView;
