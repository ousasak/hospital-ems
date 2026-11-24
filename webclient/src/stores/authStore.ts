import { create } from 'zustand';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  avatar?: string;
  role?: string;
  roles: string[];
  permissions: string[];
  employee?: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    gender?: string;
    date_of_birth?: string | null;
    city?: string;
    address?: string;
    phone?: string;
    avatar_url?: string;
    employment_status: string;
    primary_assignment?: {
      id: number;
      department?: { id: number; name: string };
      position?: { id: number; title: string };
      work_location?: { id: number; name: string };
      supervisor?: { id: number; first_name: string; last_name: string };
    };
    primaryAssignment?: {
      id: number;
      department?: { id: number; name: string };
      position?: { id: number; title: string };
      work_location?: { id: number; name: string };
      supervisor?: { id: number; first_name: string; last_name: string };
    };
    emergency_contacts?: Array<{ id?: number; name?: string; phone?: string; relationship?: string; is_primary?: boolean }>;
    emergencyContacts?: Array<{ id?: number; name?: string; phone?: string; relationship?: string; is_primary?: boolean }>;
    [key: string]: any;
  };
  [key: string]: any;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  updateUser: (updatedData: Partial<UserProfile> | any) => void;
  logout: () => void;
  hasRole: (roleName: string | string[]) => boolean;
  hasPermission: (permissionName: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const savedToken = localStorage.getItem('staffstream_token');
  const savedUser = localStorage.getItem('staffstream_user');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken,
    isAuthenticated: !!savedToken,

    setAuth: (user, token) => {
      localStorage.setItem('staffstream_token', token);
      localStorage.setItem('staffstream_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },

    updateUser: (updatedData) => {
      const currentUser = get().user;
      if (!currentUser) return;
      const merged = { ...currentUser, ...updatedData };
      localStorage.setItem('staffstream_user', JSON.stringify(merged));
      set({ user: merged });
    },

    logout: () => {
      localStorage.removeItem('staffstream_token');
      localStorage.removeItem('staffstream_user');
      set({ user: null, token: null, isAuthenticated: false });
    },

    hasRole: (roleName) => {
      const user = get().user;
      if (!user) return false;
      if (user.roles.includes('Super Admin')) return true; // Super admin has all roles
      if (Array.isArray(roleName)) {
        return roleName.some((r) => user.roles.includes(r));
      }
      return user.roles.includes(roleName);
    },

    hasPermission: (perm) => {
      const user = get().user;
      if (!user) return false;
      if (user.roles.includes('Super Admin')) return true;
      return user.permissions.includes(perm);
    },
  };
});

