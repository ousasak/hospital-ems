export interface Permission {
  id: number;
  name: string;
  guard_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name?: string;
  is_system?: boolean;
  permissions?: Permission[];
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserEmployee {
  id: number;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  employment_status?: string;
  city?: string;
  phone?: string;
  primary_assignment?: {
    id?: number;
    department?: { id: number; name: string };
    position?: { id: number; title: string };
    work_location?: { id: number; name: string };
    work_location_id?: number;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  status?: 'active' | 'inactive' | string;
  avatar_url?: string | null;
  roles?: Role[];
  employee?: UserEmployee | null;
  created_at?: string;
  updated_at?: string;
  email_verified_at?: string | null;
}

export interface UserFilters {
  search: string;
  role: string;
  status: string;
  branch: string;
}

export interface UserFormData {
  name: string;
  email: string;
  username?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  role: string;
  company?: string;
  branch?: string;
  employee_id?: number | null;
  status: 'active' | 'inactive';
}

export interface RoleFormData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface PermissionModuleGroup {
  key: string;
  titleKey: string;
  defaultTitle: string;
  permissions: {
    id?: number;
    name: string;
    actionType: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'other';
    label: string;
  }[];
}
