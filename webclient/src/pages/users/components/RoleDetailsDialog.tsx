import React, { useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  Check,
  Edit2,
  Lock,
  Unlock,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useLocaleStore } from '@/stores/localeStore';
import { Role } from '../types';
import { groupPermissionsByModule } from '../utils/permissionModules';
import { formatDate } from '@/utils';
import { GlobalModal } from '@/components/common/GlobalModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface RoleDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  onEdit: (role: Role) => void;
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

const toRoleSlug = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const getRoleSlugColor = (name: string): string => {
  const lower = name.toLowerCase();
  const base =
    'font-mono text-xs font-semibold px-2.5 h-6 inline-flex items-center rounded-md text-white';

  if (lower.includes('super')) return `bg-purple-600 ${base}`;
  if (lower.includes('hr') && lower.includes('manager')) return `bg-indigo-600 ${base}`;
  if (lower.includes('hr')) return `bg-teal-600 ${base}`;
  if (lower.includes('admin')) return `bg-emerald-600 ${base}`;
  if (lower.includes('department') || lower.includes('manager')) return `bg-emerald-600 ${base}`;
  if (lower.includes('accountant')) return `bg-amber-600 ${base}`;
  if (lower.includes('employee') || lower.includes('staff')) return `bg-sky-600 ${base}`;
  return `bg-slate-700 ${base}`;
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

export const RoleDetailsDialog: React.FC<RoleDetailsDialogProps> = ({
  isOpen,
  onClose,
  role,
  onEdit,
}) => {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const isKhmer = locale === 'kh' || locale === 'km';

  const moduleGroups = useMemo(() => {
    if (!role?.permissions) return [];
    return groupPermissionsByModule(role.permissions);
  }, [role?.permissions]);

  if (!role) return null;

  const isSystem = Boolean(role.is_system);
  const usersCount = role.users_count ?? 0;
  const permsCount = role.permissions?.length ?? 0;
  const slug = toRoleSlug(role.name);
  const displayTitle = isKhmer && ROLE_TITLE_KH[slug] ? ROLE_TITLE_KH[slug] : role.name;

  return (
    <GlobalModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      size="xl"
      icon={isSystem ? <ShieldCheck size={20} /> : <Shield size={20} />}
      title={t('users.dialog.viewRoleTitle', 'ព័ត៌មានលម្អិតនៃតួនាទី')}
      description={t(
        'users.dialog.viewRoleDesc',
        'ពិនិត្យមើលសិទ្ធិ និងចំនួនអ្នកប្រើប្រាស់ដែលត្រូវបានកំណត់តួនាទីនេះ។'
      )}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
          >
            {t('common.close', 'បិទ')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(role);
            }}
            className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
          >
            <Edit2 className="h-3.5 w-3.5" />
            {t('users.actions.editRole', 'កែប្រែតួនាទី')}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 1. Clean Role Identity Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-bold text-foreground">{displayTitle}</h3>
            <span className={getRoleSlugColor(role.name)}>{slug}</span>
            {isSystem ? (
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-semibold bg-blue-600 text-white">
                <Lock size={11} className="stroke-[2.5]" />
                <span>{t('users.roles.systemRoleBadge', 'ប្រព័ន្ធ')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-semibold bg-amber-600 text-white">
                <Unlock size={11} className="stroke-[2.5]" />
                <span>{t('users.roles.customRoleBadge', 'ផ្ទាល់ខ្លួន')}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            guard: {role.guard_name || 'web'}
          </p>
        </div>

        {/* 2. Clean 3-Column Metrics Strip */}
        <div className="grid grid-cols-3 divide-x divide-border/70 rounded-xl border border-border/80 bg-muted/25">
          <div className="px-4 py-3">
            <span className="text-xs text-muted-foreground block">
              {t('users.columns.assignedUsers', 'អ្នកប្រើប្រាស់')}
            </span>
            <span className="mt-1 block text-base font-semibold text-foreground tabular-nums">
              {t('users.roles.usersCount', { count: usersCount }, `${usersCount} នាក់`)}
            </span>
          </div>
          <div className="px-4 py-3">
            <span className="text-xs text-muted-foreground block">
              {t('users.columns.permissionsCount', 'ចំនួនសិទ្ធិ')}
            </span>
            <span className="mt-1 block text-base font-semibold text-primary tabular-nums">
              {permsCount} {t('users.tabs.permissions', 'សិទ្ធិ')}
            </span>
          </div>
          <div className="px-4 py-3">
            <span className="text-xs text-muted-foreground block">
              {t('users.columns.createdAt', 'កាលបរិច្ឆេទបង្កើត')}
            </span>
            <span className="mt-1 block text-sm font-medium text-foreground tabular-nums">
              {formatDate(role.created_at, locale)}
            </span>
          </div>
        </div>

        <Separator />

        {/* 3. Clean 2-Column Permissions List (No Nested Boxes / No Double Scrollbar) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              {t('users.form.rolePermissions', 'សិទ្ធិចូលប្រើប្រាស់តាមម៉ូឌុល')}
            </h4>
            <Badge variant="secondary" className="rounded-full font-normal tabular-nums">
              {permsCount} {t('users.tabs.permissions', 'សិទ្ធិ')}
            </Badge>
          </div>

          {moduleGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-xs text-muted-foreground">
              {t('users.roles.noRoles', 'គ្មានសិទ្ធិត្រូវបានកំណត់សម្រាប់តួនាទីនេះទេ')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
              {moduleGroups.map((group) => (
                <div key={group.key} className="space-y-2">
                  <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {t(group.titleKey, group.defaultTitle)}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground/70">
                      {group.permissions.length}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {group.permissions.map((p) => (
                      <li
                        key={p.name}
                        className="flex items-center gap-2 text-xs sm:text-sm text-foreground/90"
                      >
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 stroke-[2.5]" />
                        <span>{formatPermissionTitle(p.name, isKhmer)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlobalModal>
  );
};
