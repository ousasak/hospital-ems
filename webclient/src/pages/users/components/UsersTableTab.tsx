import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useLocaleStore } from '@/stores/localeStore';
import { User, Role } from '../types';
import { formatDate } from '@/utils';
import { getAbsoluteImageUrl } from '@/utils/image';
import { cn } from '@/utils';
import { Pagination, EmptyState } from '@/components/common';
import { UnifiedFilterToolbar } from '@/components/common/UnifiedFilterToolbar';
import {
  RowActionGroup,
  ViewRowButton,
  EditRowButton,
  DeleteRowButton,
} from '@/components/common/GlobalActionButtons';
import { Skeleton } from '@/components/ui/skeleton';

// Soft, low-noise avatar palettes
const avatarColorPalettes = [
  'bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  'bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  'bg-violet-500/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  'bg-amber-500/10 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
];

const getAvatarColorClass = (id: number): string => {
  return avatarColorPalettes[Math.abs(id) % avatarColorPalettes.length];
};

interface UsersTableTabProps {
  users: User[];
  roles: Role[];
  branches: { id: number; name: string }[];
  isLoading: boolean;
  isFetching: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  roleFilter: string;
  onRoleFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  branchFilter: string;
  onBranchFilterChange: (val: string) => void;
  onResetFilters: () => void;
  // Pagination
  currentPage: number;
  lastPage: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  // Sorting
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  // Actions
  onViewDetails: (user: User) => void;
  onEditUser: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  onResetPassword?: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onBulkDelete?: (userIds: number[]) => void;
}

export const UsersTableTab: React.FC<UsersTableTabProps> = ({
  users,
  roles,
  branches,
  isLoading,
  isFetching,
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  branchFilter,
  onBranchFilterChange,
  onResetFilters,
  currentPage,
  lastPage,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
  sortBy,
  sortDir,
  onSortChange,
  onViewDetails,
  onEditUser,
  onDeleteUser,
}) => {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();

  const getInitials = (name?: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary" />
    );
  };

  const renderRolePill = (roleName: string) => {
    let pillClasses =
      'bg-muted/70 text-foreground/80';
    let dotClass = 'bg-slate-400';

    if (roleName === 'Super Admin') {
      pillClasses =
        'bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
      dotClass = 'bg-blue-500';
    } else if (roleName.includes('Manager') || roleName.includes('Admin')) {
      pillClasses =
        'bg-violet-500/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300';
      dotClass = 'bg-violet-500';
    } else if (roleName === 'Accountant') {
      pillClasses =
        'bg-amber-500/10 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300';
      dotClass = 'bg-amber-500';
    } else if (roleName === 'HR Staff') {
      pillClasses =
        'bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300';
      dotClass = 'bg-teal-500';
    }

    return (
      <span
        key={roleName}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
          pillClasses
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotClass)} />
        <span>{roleName}</span>
      </span>
    );
  };

  const hasFilters = Boolean(search || roleFilter || statusFilter || branchFilter);

  return (
    <div className="space-y-4">
      {/* Search & Filters Toolbar */}
      <UnifiedFilterToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={t(
          'users.filters.searchPlaceholder',
          'ស្វែងរកឈ្មោះ អ៊ីមែល ឬកូដបុគ្គលិក...'
        )}
        filters={[
          {
            id: 'role',
            value: roleFilter,
            onChange: onRoleFilterChange,
            options: [
              { value: '', label: t('users.filters.allRoles', 'គ្រប់តួនាទី') },
              ...roles.map((r) => ({ value: r.name, label: r.name })),
            ],
            minWidth: 'min-w-[150px]',
          },
          {
            id: 'status',
            value: statusFilter,
            onChange: onStatusFilterChange,
            options: [
              { value: '', label: t('users.filters.allStatuses', 'គ្រប់ស្ថានភាព') },
              { value: 'active', label: t('users.filters.active', 'សកម្ម') },
              { value: 'inactive', label: t('users.filters.inactive', 'អសកម្ម') },
            ],
            minWidth: 'min-w-[130px]',
          },
          {
            id: 'branch',
            value: branchFilter,
            onChange: onBranchFilterChange,
            options: [
              { value: '', label: t('users.filters.allBranches', 'គ្រប់សាខា') },
              ...branches.map((b) => ({ value: String(b.id), label: b.name })),
            ],
            minWidth: 'min-w-[160px]',
          },
        ]}
        onReset={onResetFilters}
      />

      {/* Unified Clean Enterprise Table Card */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-panel">
        {/* Subtle top progress indicator on refetch */}
        {isFetching && !isLoading && (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/15">
            <div className="h-full w-1/3 bg-primary animate-pulse" />
          </div>
        )}

        <div
          className={cn(
            'overflow-x-auto transition-opacity duration-150',
            isFetching && !isLoading && 'opacity-65'
          )}
        >
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border/70 bg-muted/35 text-xs font-medium text-muted-foreground">
                <th className="py-3 pl-5 pr-4 min-w-[260px]">
                  <button
                    type="button"
                    onClick={() => onSortChange('name')}
                    className="inline-flex items-center gap-1.5 font-medium hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>{t('users.columns.user', 'អ្នកប្រើប្រាស់')}</span>
                    {renderSortIcon('name')}
                  </button>
                </th>
                <th className="px-4 py-3 min-w-[140px] font-medium">
                  {t('users.columns.role', 'តួនាទី')}
                </th>
                <th className="px-4 py-3 min-w-[220px] font-medium">
                  {t('users.columns.branch', 'សាខា')}
                </th>
                <th className="px-4 py-3 min-w-[110px] font-medium">
                  {t('users.columns.status', 'ស្ថានភាព')}
                </th>
                <th className="px-4 py-3 min-w-[140px]">
                  <button
                    type="button"
                    onClick={() => onSortChange('created_at')}
                    className="inline-flex items-center gap-1.5 font-medium hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>{t('users.columns.createdAt', 'កាលបរិច្ឆេទបង្កើត')}</span>
                    {renderSortIcon('created_at')}
                  </button>
                </th>
                <th className="py-3 pl-4 pr-5 w-[124px] text-right font-medium">
                  {t('users.columns.actions', 'សកម្មភាព')}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/50 text-sm">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 pl-5 pr-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-3.5 w-36" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-3.5 w-24" />
                    </td>
                    <td className="py-3.5 pl-4 pr-5">
                      <div className="flex justify-end gap-1">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <EmptyState
                      title={t('users.messages.noUsersFound', 'រកមិនឃើញគណនីអ្នកប្រើប្រាស់')}
                      description={
                        hasFilters
                          ? t(
                              'users.messages.noUsersMatchFilter',
                              'គ្មានអ្នកប្រើប្រាស់ត្រូវនឹងលក្ខខណ្ឌស្វែងរក ឬតម្រងនេះទេ'
                            )
                          : undefined
                      }
                      actionLabel={
                        hasFilters
                          ? t('users.filters.reset', 'កំណត់ឡើងវិញ')
                          : undefined
                      }
                      onAction={hasFilters ? onResetFilters : undefined}
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isActive = (user.status || '').toLowerCase() === 'active';
                  const branchName =
                    user.employee?.primary_assignment?.work_location?.name ||
                    user.employee?.city ||
                    '—';
                  const employeeCode = user.employee?.employee_code;
                  const deptName = user.employee?.primary_assignment?.department?.name;
                  const avatarSrc = user.avatar_url
                    ? getAbsoluteImageUrl(user.avatar_url)
                    : null;

                  return (
                    <tr
                      key={user.id}
                      className="group transition-colors hover:bg-muted/35"
                    >
                      {/* User Identity */}
                      <td className="py-3.5 pl-5 pr-4 align-middle">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'h-9 w-9 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold shrink-0 select-none',
                              getAvatarColorClass(user.id)
                            )}
                          >
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={user.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span>{getInitials(user.name)}</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={() => onViewDetails(user)}
                                className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors cursor-pointer truncate text-left"
                                title={user.name}
                              >
                                {user.name}
                              </button>
                              {employeeCode && (
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground shrink-0">
                                  {employeeCode}
                                </span>
                              )}
                            </div>
                            <p
                              className="text-xs text-muted-foreground truncate mt-0.5"
                              title={user.email}
                            >
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Roles */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((r) => renderRolePill(r.name))
                          ) : (
                            <span className="text-xs text-muted-foreground/70">
                              {t('users.form.selectRole', 'គ្មានតួនាទី')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Branch & Department */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="min-w-0 max-w-[260px]">
                          <p
                            className="text-[13px] font-medium text-foreground truncate"
                            title={branchName}
                          >
                            {branchName}
                          </p>
                          {deptName && (
                            <p
                              className="text-xs text-muted-foreground truncate mt-0.5"
                              title={deptName}
                            >
                              {deptName}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              isActive ? 'bg-emerald-500' : 'bg-muted-foreground/60'
                            )}
                          />
                          <span>
                            {isActive
                              ? t('status.active', 'សកម្ម')
                              : t('status.inactive', 'អសកម្ម')}
                          </span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatDate(user.created_at, locale)}
                        </span>
                      </td>

                      {/* Global Row Actions */}
                      <td className="py-3.5 pl-4 pr-5 align-middle text-right whitespace-nowrap">
                        <RowActionGroup align="right">
                          <ViewRowButton
                            onClick={() => onViewDetails(user)}
                            title={t('users.actions.viewDetails', 'មើលព័ត៌មានលម្អិត')}
                          />
                          <EditRowButton
                            onClick={() => onEditUser(user)}
                            title={t('users.actions.editUser', 'កែប្រែអ្នកប្រើប្រាស់')}
                          />
                          <DeleteRowButton
                            onClick={() => onDeleteUser(user)}
                            title={t('users.actions.deleteUser', 'លុបអ្នកប្រើប្រាស់')}
                          />
                        </RowActionGroup>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Integrated Pagination Footer */}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            lastPage={lastPage}
            total={totalItems}
            perPage={perPage}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
            isLoading={isFetching}
          />
        )}
      </div>
    </div>
  );
};
