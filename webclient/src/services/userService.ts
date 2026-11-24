import { api } from '@/api/client';

export interface UserQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: string;
  status?: string;
  branch?: string | number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: string;
  status?: 'active' | 'inactive';
  employee_id?: number | null;
  phone?: string;
  branch?: string;
  company?: string;
}

export interface RoleFormData {
  name: string;
  permissions?: string[];
}

export const userService = {
  getUsers: async (params?: UserQueryParams) => (await api.get('/users', { params })).data,
  getUser: async (id: number | string) => (await api.get(`/users/${id}`)).data,
  createUser: async (data: UserFormData) => (await api.post('/users', data)).data,
  updateUser: async (id: number | string, data: Partial<UserFormData>) =>
    (await api.put(`/users/${id}`, data)).data,
  deleteUser: async (id: number | string) => (await api.delete(`/users/${id}`)).data,
  toggleUserStatus: async (id: number | string, status?: 'active' | 'inactive') =>
    (await api.patch(`/users/${id}/status`, { status })).data,
  resetPassword: async (id: number | string, password: string) =>
    (await api.post(`/users/${id}/reset-password`, { password })).data,

  getRoles: async () => (await api.get('/users/roles')).data,
  createRole: async (data: RoleFormData) => (await api.post('/users/roles', data)).data,
  updateRole: async (id: number | string, data: Partial<RoleFormData>) =>
    (await api.put(`/users/roles/${id}`, data)).data,
  deleteRole: async (id: number | string) => (await api.delete(`/users/roles/${id}`)).data,
  duplicateRole: async (id: number | string, name?: string) =>
    (await api.post(`/users/roles/${id}/duplicate`, { name })).data,

  getPermissions: async () => (await api.get('/users/permissions')).data,
  syncUserRoles: async (id: number | string, roles: string[]) =>
    (await api.put(`/users/${id}/roles`, { roles })).data,
};

export default userService;
