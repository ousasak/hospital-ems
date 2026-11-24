import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  ShieldCheck,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import { userService } from '@/services/userService';
import { organizationService } from '@/services/organizationService';
import { employeeService } from '@/services/employeeService';
import { confirmDelete } from '@/stores/confirmStore';
import { PageHeader } from '@/components/common/PageHeader';
import { AddButton } from '@/components/common/GlobalActionButtons';
import { GlobalSubmenu } from '@/components/common/GlobalSubmenu';

// Subcomponents
import { UserStatsCards } from './components/UserStatsCards';
import { UsersTableTab } from './components/UsersTableTab';
import { RolesTab } from './components/RolesTab';
import { PermissionsTab } from './components/PermissionsTab';
import { UserFormDialog } from './components/UserFormDialog';
import { RoleFormView } from './components/RoleFormView';
import { UserDetailsDialog } from './components/UserDetailsDialog';
import { RoleDetailsDialog } from './components/RoleDetailsDialog';
import { ResetPasswordDialog } from './components/ResetPasswordDialog';
import { User, Role, UserFormData, RoleFormData } from './types';

export const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');

  // Filters & Search state for Users table
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const [isRoleDetailsOpen, setIsRoleDetailsOpen] = useState(false);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);

  // 1. Fetch Users List
  const {
    data: usersData,
    isLoading: isUsersLoading,
    isFetching: isUsersFetching,
  } = useQuery({
    queryKey: [
      'users-list',
      currentPage,
      perPage,
      search,
      roleFilter,
      statusFilter,
      branchFilter,
      sortBy,
      sortDir,
    ],
    queryFn: () =>
      userService.getUsers({
        page: currentPage,
        per_page: perPage,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        branch: branchFilter || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      }),
  });

  // 2. Fetch Roles List
  const {
    data: roles = [],
    isLoading: isRolesLoading,
  } = useQuery<Role[]>({
    queryKey: ['roles-all'],
    queryFn: () => userService.getRoles(),
  });

  // 3. Fetch Permissions List
  const {
    data: permissions = [],
    isLoading: isPermissionsLoading,
  } = useQuery({
    queryKey: ['permissions-all'],
    queryFn: () => userService.getPermissions(),
  });

  // 4. Fetch Work Locations (Branches)
  const { data: rawBranches = [] } = useQuery({
    queryKey: ['work-locations-all'],
    queryFn: () => organizationService.getWorkLocations(),
  });

  const branches = useMemo(() => {
    const list = Array.isArray(rawBranches) ? rawBranches : rawBranches?.data || [];
    return list.map((b: any) => ({
      id: b.id,
      name: b.name || b.location_name,
    }));
  }, [rawBranches]);

  // 5. Fetch Organization Profile for Company Name
  const { data: orgProfile } = useQuery({
    queryKey: ['org-profile'],
    queryFn: () => organizationService.getProfile(),
  });

  const companyName = orgProfile?.company_name || orgProfile?.name || 'StaffStream EMS';

  // 6. Fetch Employees for Profile Linking
  const { data: employeesData } = useQuery({
    queryKey: ['employees-linking'],
    queryFn: () => employeeService.getEmployees({ per_page: 100 }),
  });

  const employees = useMemo(() => {
    return employeesData?.data || [];
  }, [employeesData]);

  // Extract Users & Stats from Response
  const users: User[] = useMemo(() => {
    if (!usersData) return [];
    if (Array.isArray(usersData)) return usersData;
    return usersData.data || [];
  }, [usersData]);

  const lastPage = usersData?.last_page || 1;
  const totalItems = usersData?.total ?? users.length;

  // Global KPI Summary Stats
  const stats = useMemo(() => {
    if (usersData?.stats) {
      return {
        totalUsers: usersData.stats.total_users ?? totalItems,
        activeUsers: usersData.stats.active_users ?? 0,
        inactiveUsers: usersData.stats.inactive_users ?? 0,
        totalRoles: usersData.stats.total_roles ?? roles.length,
      };
    }
    // Fallback if computed from loaded users
    const active = users.filter((u) => (u.status || '').toLowerCase() === 'active').length;
    const inactive = users.filter((u) => (u.status || '').toLowerCase() === 'inactive').length;
    return {
      totalUsers: totalItems,
      activeUsers: active,
      inactiveUsers: inactive,
      totalRoles: roles.length,
    };
  }, [usersData, totalItems, users, roles.length]);

  // ─────────────────────────────────────────────────────────────────────────────
  // MUTATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  // Save User (Create or Update)
  const saveUserMutation = useMutation({
    mutationFn: async (formData: UserFormData) => {
      if (editingUser) {
        return await userService.updateUser(editingUser.id, formData);
      }
      return await userService.createUser(formData);
    },
    onSuccess: (data: any) => {
      toast.success(
        data?.message ||
          (editingUser
            ? t('users.messages.userUpdated', 'បានធ្វើបច្ចុប្បន្នភាពគណនីដោយជោគជ័យ')
            : t('users.messages.userCreated', 'បានបង្កើតគណនីអ្នកប្រើប្រាស់ដោយជោគជ័យ'))
      );
      setIsUserFormOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          t('users.messages.actionFailed', 'ប្រតិបត្តិការមិនបានសម្រេច')
      );
    },
  });

  // Toggle User Status (Activate / Deactivate)
  const toggleStatusMutation = useMutation({
    mutationFn: async (user: User) => {
      const isCurrentlyActive = (user.status || '').toLowerCase() === 'active';
      const newStatus = isCurrentlyActive ? 'inactive' : 'active';
      return await userService.toggleUserStatus(user.id, newStatus);
    },
    onSuccess: (data: any) => {
      toast.success(
        data?.message ||
          (data?.status === 'active'
            ? t('users.messages.userActivated', 'បានបើកដំណើរការគណនីដោយជោគជ័យ')
            : t('users.messages.userDeactivated', 'បានផ្អាកដំណើរការគណនីដោយជោគជ័យ'))
      );
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          t('users.messages.actionFailed', 'ប្រតិបត្តិការមិនបានសម្រេច')
      );
    },
  });

  // Reset User Password
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: number; password: string }) => {
      return await userService.resetPassword(userId, password);
    },
    onSuccess: (data: any) => {
      toast.success(
        data?.message ||
          t('users.messages.passwordReset', 'បានកំណត់ពាក្យសម្ងាត់ថ្មីដោយជោគជ័យ')
      );
      setIsResetPasswordOpen(false);
      setPasswordResetUser(null);
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          t('users.messages.actionFailed', 'ប្រតិបត្តិការមិនបានសម្រេច')
      );
    },
  });

  // Delete User
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => await userService.deleteUser(id),
    onSuccess: (data: any) => {
      toast.success(
        data?.message ||
          t('users.messages.userDeleted', 'បានលុបគណនីអ្នកប្រើប្រាស់ដោយជោគជ័យ')
      );
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          t('users.messages.actionFailed', 'ប្រតិបត្តិការមិនបានសម្រេច')
      );
    },
  });

  // Bulk Delete Users
  const bulkDeleteUsersMutation = useMutation({
    mutationFn: async (userIds: number[]) => {
      const promises = userIds.map((id) => userService.deleteUser(id));
      return await Promise.allSettled(promises);
    },
    onSuccess: () => {
      toast.success(t('users.messages.userDeleted', 'បានលុបគណនីអ្នកប្រើប្រាស់ដោយជោគជ័យ'));
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('users.messages.actionFailed', 'ប្រតិបត្តិការមិនបានសម្រេច'));
    },
  });

  // Save Role (Create or Update)
  const saveRoleMutation = useMutation({
    mutationFn: async (formData: RoleFormData) => {
      if (editingRole) {
        return await userService.updateRole(editingRole.id, formData);
      }
      return await userService.createRole(formData);
    },
    onSuccess: (data: any) => {
      toast.success(
        data?.message ||
          (editingRole
            ? t('users.messages.roleUpdated', 'បានធ្វើបច្ចុប្បន្នភាពតួនាទីដោយជោគជ័យ')
            : t('users.messages.roleCreated', 'បានបង្កើតតួនាទីថ្មីដោយជោគជ័យ'))
      );
      setIsRoleFormOpen(false);
      setEditingRole(null);
      queryClient.invalidateQueries({ queryKey: ['roles-all'] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          t('users.messages.actionFailed', 'ប្រតិបត្តិការមិនបានសម្រេច')
      );
    },
  });

  // Update Role Permissions from Permissions Matrix
  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: number; permissions: string[] }) => {
      return await userService.updateRole(roleId, { permissions });
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || t('users.messages.roleUpdated', 'បានរក្សាទុកសិទ្ធិតួនាទីដោយជោគជ័យ'));
      queryClient.invalidateQueries({ queryKey: ['roles-all'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('users.messages.actionFailed', 'ប្រតិបត្តិការមិនបានសម្រេច'));
    },
  });

  // Duplicate Role
  const duplicateRoleMutation = useMutation({
    mutationFn: async (role: Role) => {
      return await userService.duplicateRole(role.id);
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || t('users.messages.roleDuplicated', 'បានចម្លងតួនាទីដោយជោគជ័យ'));
      queryClient.invalidateQueries({ queryKey: ['roles-all'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('users.messages.actionFailed', 'ប្រតិបត្តិការមិនបានសម្រេច'));
    },
  });

  // Delete Role
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => await userService.deleteRole(id),
    onSuccess: (data: any) => {
      toast.success(data?.message || t('users.messages.roleDeleted', 'បានលុបតួនាទីដោយជោគជ័យ'));
      queryClient.invalidateQueries({ queryKey: ['roles-all'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('users.messages.actionFailed', 'ប្រតិបត្តិការមិនបានសម្រេច'));
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setIsUserFormOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const handleOpenViewUser = (user: User) => {
    setViewingUser(user);
    setIsUserDetailsOpen(true);
  };

  const handleOpenResetPassword = (user: User) => {
    setPasswordResetUser(user);
    setIsResetPasswordOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    confirmDelete({
      title: t('users.dialog.deleteUserTitle', 'លុបគណនីអ្នកប្រើប្រាស់?'),
      itemName: user.name,
      confirmText: t('common.delete', 'លុប'),
      cancelText: t('common.cancel', 'បោះបង់'),
      onConfirm: () => deleteUserMutation.mutate(user.id),
    });
  };

  const handleBulkDeleteUsers = (userIds: number[]) => {
    confirmDelete({
      title: t('users.dialog.deleteUserTitle', 'លុបគណនីអ្នកប្រើប្រាស់?'),
      itemName: `${userIds.length} accounts`,
      confirmText: t('common.delete', 'លុប'),
      cancelText: t('common.cancel', 'បោះបង់'),
      onConfirm: () => bulkDeleteUsersMutation.mutate(userIds),
    });
  };

  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setIsRoleFormOpen(true);
  };

  const handleOpenEditRole = (role: Role) => {
    setEditingRole(role);
    setIsRoleFormOpen(true);
  };

  const handleOpenViewRole = (role: Role) => {
    setViewingRole(role);
    setIsRoleDetailsOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (role.is_system) {
      toast.error(t('users.roles.systemRoleProtected', 'តួនាទីប្រព័ន្ធមិនអាចលុបបានទេ'));
      return;
    }
    if ((role.users_count ?? 0) > 0) {
      toast.error(
        `មិនអាចលុបតួនាទីនេះបានទេ ព្រោះកំពុងត្រូវបានកំណត់ទៅកាន់ ${role.users_count} អ្នកប្រើប្រាស់។`
      );
      return;
    }

    confirmDelete({
      title: t('users.dialog.deleteRoleTitle', 'លុបតួនាទី?'),
      itemName: role.name,
      confirmText: t('common.delete', 'លុប'),
      cancelText: t('common.cancel', 'បោះបង់'),
      onConfirm: () => deleteRoleMutation.mutate(role.id),
    });
  };

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setBranchFilter('');
    setCurrentPage(1);
  };

  if (isRoleFormOpen) {
    return (
      <RoleFormView
        editingRole={editingRole}
        permissions={permissions}
        isLoading={saveRoleMutation.isPending}
        onSubmit={async (formData) => {
          await saveRoleMutation.mutateAsync(formData);
        }}
        onCancel={() => {
          setIsRoleFormOpen(false);
          setEditingRole(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 4.A Page Header */}
      <PageHeader
        title={t('users.title', 'អ្នកប្រើប្រាស់ & សិទ្ធិ')}
        subtitle={t('users.subtitle', 'គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ តួនាទី និងសិទ្ធិចូលប្រើប្រព័ន្ធ។')}
        breadcrumbs={[{ label: t('nav.usersRoles', 'អ្នកប្រើប្រាស់ & សិទ្ធិ') }]}
        action={
          activeTab === 'roles' ? (
            <AddButton
              onClick={handleOpenCreateRole}
              label={t('users.actions.addRole', 'បន្ថែមតួនាទី')}
              size="md"
            />
          ) : (
            <AddButton
              onClick={handleOpenCreateUser}
              label={t('users.actions.addUser', 'បន្ថែមអ្នកប្រើប្រាស់')}
              size="md"
            />
          )
        }
      />

      {/* 4.B Summary Statistics Cards */}
      <UserStatsCards
        totalUsers={stats.totalUsers}
        activeUsers={stats.activeUsers}
        inactiveUsers={stats.inactiveUsers}
        totalRoles={stats.totalRoles || roles.length}
      />

      {/* 4.C Global Submenu Navigation */}
      <div className="space-y-4">
        <GlobalSubmenu
          value={activeTab}
          onChange={setActiveTab}
          items={[
            {
              value: 'users',
              label: t('users.tabs.users', 'អ្នកប្រើប្រាស់'),
              icon: Users,
            },
            {
              value: 'roles',
              label: t('users.tabs.roles', 'តួនាទី'),
              icon: ShieldCheck,
            },
            {
              value: 'permissions',
              label: t('users.tabs.permissions', 'សិទ្ធិ'),
              icon: Key,
            },
          ]}
        />

        {/* Tab 1: Users Table */}
        {activeTab === 'users' && (
          <div className="space-y-4 pt-1">
            <UsersTableTab
              users={users}
              roles={roles}
              branches={branches}
              isLoading={isUsersLoading}
              isFetching={isUsersFetching}
              search={search}
              onSearchChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              roleFilter={roleFilter}
              onRoleFilterChange={(val) => {
                setRoleFilter(val);
                setCurrentPage(1);
              }}
              statusFilter={statusFilter}
              onStatusFilterChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              branchFilter={branchFilter}
              onBranchFilterChange={(val) => {
                setBranchFilter(val);
                setCurrentPage(1);
              }}
              onResetFilters={handleResetFilters}
              currentPage={currentPage}
              lastPage={lastPage}
              totalItems={totalItems}
              perPage={perPage}
              onPageChange={setCurrentPage}
              onPerPageChange={(newPerPage) => {
                setPerPage(newPerPage);
                setCurrentPage(1);
              }}
              sortBy={sortBy}
              sortDir={sortDir}
              onSortChange={handleSortChange}
              onViewDetails={handleOpenViewUser}
              onEditUser={handleOpenEditUser}
              onToggleStatus={(u) => toggleStatusMutation.mutate(u)}
              onResetPassword={handleOpenResetPassword}
              onDeleteUser={handleDeleteUser}
              onBulkDelete={handleBulkDeleteUsers}
            />
          </div>
        )}

        {/* Tab 2: Role Management */}
        {activeTab === 'roles' && (
          <div className="space-y-4 pt-1">
            <RolesTab
              roles={roles}
              isLoading={isRolesLoading}
              onAddRole={handleOpenCreateRole}
              onViewRole={handleOpenViewRole}
              onEditRole={handleOpenEditRole}
              onDuplicateRole={(r) => duplicateRoleMutation.mutate(r)}
              onDeleteRole={handleDeleteRole}
            />
          </div>
        )}

        {/* Tab 3: Permission Management Matrix */}
        {activeTab === 'permissions' && (
          <div className="space-y-4 pt-1">
            <PermissionsTab
              permissions={permissions}
              roles={roles}
              isLoading={isPermissionsLoading}
              onUpdateRolePermissions={async (roleId, perms) => {
                await updateRolePermissionsMutation.mutateAsync({
                  roleId,
                  permissions: perms,
                });
              }}
              isSavingPermissions={updateRolePermissionsMutation.isPending}
            />
          </div>
        )}
      </div>

      {/* Create / Edit User Dialog */}
      <UserFormDialog
        isOpen={isUserFormOpen}
        onClose={() => {
          setIsUserFormOpen(false);
          setEditingUser(null);
        }}
        onSubmit={async (formData) => {
          await saveUserMutation.mutateAsync(formData);
        }}
        editingUser={editingUser}
        roles={roles}
        branches={branches}
        employees={employees}
        isLoading={saveUserMutation.isPending}
        companyName={companyName}
      />

      {/* User Details Modal */}
      <UserDetailsDialog
        isOpen={isUserDetailsOpen}
        onClose={() => {
          setIsUserDetailsOpen(false);
          setViewingUser(null);
        }}
        user={viewingUser}
        onEdit={handleOpenEditUser}
        onResetPassword={handleOpenResetPassword}
      />

      {/* Role Details Modal */}
      <RoleDetailsDialog
        isOpen={isRoleDetailsOpen}
        onClose={() => {
          setIsRoleDetailsOpen(false);
          setViewingRole(null);
        }}
        role={viewingRole}
        onEdit={handleOpenEditRole}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        isOpen={isResetPasswordOpen}
        onClose={() => {
          setIsResetPasswordOpen(false);
          setPasswordResetUser(null);
        }}
        user={passwordResetUser}
        onSubmit={async (userId, newPassword) => {
          await resetPasswordMutation.mutateAsync({ userId, password: newPassword });
        }}
        isLoading={resetPasswordMutation.isPending}
      />
    </div>
  );
};

export default UsersPage;
