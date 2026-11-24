import React from 'react';
import {
  Lock,
  Unlock,
  Edit2,
  Trash2,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useLocaleStore } from '@/stores/localeStore';
import { Role } from '../types';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common';

interface RolesTabProps {
  roles: Role[];
  isLoading: boolean;
  onAddRole: () => void;
  onViewRole: (role: Role) => void;
  onEditRole: (role: Role) => void;
  onDuplicateRole: (role: Role) => void;
  onDeleteRole: (role: Role) => void;
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

const ROLE_DESCRIPTION_KH: Record<string, string> = {
  super_admin:
    'មានសិទ្ធិចូលប្រើប្រាស់ និងគ្រប់គ្រងគ្រប់ផ្នែកទាំងអស់ក្នុងប្រព័ន្ធ រួមទាំងអ្នកប្រើប្រាស់ តួនាទី និងការកំណត់ប្រព័ន្ធ។',
  admin:
    'មានសិទ្ធិគ្រប់គ្រងលើប្រតិបត្តិការស្ថាប័ន បុគ្គលិក វត្តមាន និងរបាយការណ៍ទូទាំងប្រព័ន្ធ។',
  hr_manager:
    'គ្រប់គ្រងរចនាសម្ព័ន្ធស្ថាប័ន បុគ្គលិក វត្តមាន ច្បាប់ឈប់សម្រាក ការជ្រើសរើស និងការវាយតម្លៃការងារ។',
  hr_staff:
    'គ្រប់គ្រងទិន្នន័យបុគ្គលិក ការចាត់តាំង ការតាមដានវត្តមាន ច្បាប់ឈប់សម្រាក និងការជ្រើសរើសបុគ្គលិក។',
  department_manager:
    'ត្រួតពិនិត្យ និងអនុម័តវត្តមាន ច្បាប់ឈប់សម្រាក និងវាយតម្លៃសមិទ្ធផលការងាររបស់បុគ្គលិកក្នុងនាយកដ្ឋាន។',
  accountant:
    'គ្រប់គ្រង និងដំណើរការប្រាក់បៀវត្ស ពិនិត្យ និងនាំចេញរបាយការណ៍ហិរញ្ញវត្ថុប្រចាំខែ។',
  employee:
    'ចូលប្រើប្រាស់ព័ត៌មានផ្ទាល់ខ្លួន តាមដានវត្តមានការងារ និងដាក់សំណើសុំច្បាប់ឈប់សម្រាក។',
};

const ROLE_DESCRIPTION_EN: Record<string, string> = {
  super_admin:
    'Full unrestricted access to all system modules, user management, roles, audit logs, and system settings.',
  admin:
    'Administrative access across organization structure, workforce operations, attendance, and reporting.',
  hr_manager:
    'Manages organization units, employee records, attendance, leave approvals, recruitment, and performance.',
  hr_staff:
    'Handles employee profiles, assignments, daily attendance tracking, leave records, and recruitment workflows.',
  department_manager:
    'Reviews and approves team attendance, leave requests, and performance evaluations within the department.',
  accountant:
    'Processes monthly payroll batches, reviews salary structures, and exports financial reports.',
  employee:
    'Self-service access to personal dashboard, attendance records, and leave request submissions.',
};

const toRoleSlug = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const getRoleSlugColor = (name: string): string => {
  const lower = name.toLowerCase();
  const base =
    'font-mono text-xs font-bold px-2.5 h-6 inline-flex items-center rounded-md shadow-xs text-white';

  if (lower.includes('super')) return `bg-purple-600 ${base}`;
  if (lower.includes('hr') && lower.includes('manager')) return `bg-indigo-600 ${base}`;
  if (lower.includes('hr')) return `bg-teal-600 ${base}`;
  if (lower.includes('admin')) return `bg-emerald-600 ${base}`;
  if (lower.includes('department') || lower.includes('manager')) return `bg-emerald-600 ${base}`;
  if (lower.includes('accountant')) return `bg-amber-600 ${base}`;
  if (lower.includes('employee') || lower.includes('staff')) return `bg-sky-600 ${base}`;
  return `bg-slate-700 ${base}`;
};

export const RolesTab: React.FC<RolesTabProps> = ({
  roles,
  isLoading,
  onAddRole,
  onViewRole,
  onEditRole,
  onDeleteRole,
}) => {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const isKhmer = locale === 'kh' || locale === 'km';

  const getRoleDisplayTitle = (role: Role) => {
    const slug = toRoleSlug(role.name);
    if (isKhmer && ROLE_TITLE_KH[slug]) {
      return ROLE_TITLE_KH[slug];
    }
    return role.name;
  };

  const getRoleDescriptionText = (role: Role) => {
    const slug = toRoleSlug(role.name);
    if (isKhmer && ROLE_DESCRIPTION_KH[slug]) {
      return ROLE_DESCRIPTION_KH[slug];
    }
    if (!isKhmer && ROLE_DESCRIPTION_EN[slug]) {
      return ROLE_DESCRIPTION_EN[slug];
    }
    const permsCount = role.permissions?.length ?? 0;
    const guard = role.guard_name || 'web';
    return isKhmer
      ? `តួនាទី ${role.name} កំណត់សម្រាប់ ${guard} ជាមួយសិទ្ធិប្រតិបត្តិការចំនួន ${permsCount}។`
      : `${role.name} role configured for ${guard} scope with ${permsCount} assigned permissions.`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-card p-6 shadow-md space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="py-16 text-center rounded-xl border border-dashed border-border p-8 bg-card/50">
        <EmptyState
          title={t('users.roles.noRoles', 'រកមិនឃើញតួនាទីណាមួយឡើយ')}
          actionLabel={t('users.actions.addRole', 'បន្ថែមតួនាទី')}
          onAction={onAddRole}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {roles.map((role) => {
        const isSys = Boolean(role.is_system);
        const permsCount = role.permissions?.length ?? 0;
        const usersCount = role.users_count ?? 0;
        const slug = toRoleSlug(role.name);
        const slugColor = getRoleSlugColor(role.name);

        return (
          <div
            key={role.id}
            className="rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-card p-6 shadow-md hover:shadow-lg dark:shadow-neutral-950/40 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              {/* Top Header: Title, slug badge, Built-in/Custom badge, quick actions */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {getRoleDisplayTitle(role)}
                  </h3>
                  <span className={slugColor}>{slug}</span>
                  {isSys ? (
                    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-bold bg-blue-600 text-white shadow-xs">
                      <Lock size={12} className="stroke-[2.5]" />
                      <span>{t('users.roles.systemRoleBadge', 'ប្រព័ន្ធ')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-bold bg-amber-600 text-white shadow-xs">
                      <Unlock size={12} className="stroke-[2.5]" />
                      <span>{t('users.roles.customRoleBadge', 'ផ្ទាល់ខ្លួន')}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onEditRole(role)}
                    title={t('users.actions.editRole', 'កែប្រែតួនាទី')}
                    aria-label={t('users.actions.editRole', 'កែប្រែតួនាទី')}
                    className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors cursor-pointer"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRole(role)}
                    title={
                      isSys
                        ? t('users.roles.systemRoleProtected', 'តួនាទីប្រព័ន្ធមិនអាចលុបបានទេ')
                        : t('users.actions.deleteRole', 'លុបតួនាទី')
                    }
                    aria-label={t('users.actions.deleteRole', 'លុបតួនាទី')}
                    className={
                      isSys
                        ? 'text-neutral-300 hover:text-rose-500 dark:text-neutral-600 dark:hover:text-rose-400 transition-colors cursor-pointer'
                        : 'text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 transition-colors cursor-pointer'
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 mb-6 leading-relaxed">
                {getRoleDescriptionText(role)}
              </p>
            </div>

            {/* Bottom stats & View link */}
            <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mt-auto">
              <div className="flex items-center gap-6">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className="text-neutral-400 dark:text-neutral-500 stroke-[2]"
                  />
                  <span className="tabular-nums">
                    {permsCount} {t('users.tabs.permissions', 'សិទ្ធិ')}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users
                    size={16}
                    className="text-neutral-400 dark:text-neutral-500 stroke-[2]"
                  />
                  <span className="tabular-nums">
                    {t('users.roles.usersCount', { count: usersCount }, `${usersCount} នាក់`)}
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => onViewRole(role)}
                className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline cursor-pointer"
              >
                {t('common.view', 'មើល')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
