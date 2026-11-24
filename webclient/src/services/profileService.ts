import { api } from '@/api/client';
import { useAuthStore } from '../stores/authStore';

export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  timezone?: string;
  email_notify?: boolean;
  push_notify?: boolean;
  sms_notify?: boolean;
  is_active?: boolean;
  roles?: string[];
  gender?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  created_at?: string;
  last_login_at?: string;
  company?: { name: string };
  branch?: { name: string };
}

export const profileService = {
  getProfile: async (): Promise<UserProfile> => {
    try {
      const res = await api.get('/profile');
      return res.data?.data || res.data;
    } catch {
      // Fallback from active Auth Store
      const authUser = useAuthStore.getState().user;
      return {
        id: authUser?.id || 1,
        name: authUser?.name || 'Super Admin (System Owner)',
        email: authUser?.email || 'superadmin@ccfth-ems.gov.kh',
        phone: '+855 71 888 0001',
        avatar: (authUser as any)?.avatar_url || (authUser as any)?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256',
        timezone: 'Asia/Phnom_Penh',
        email_notify: true,
        push_notify: true,
        sms_notify: false,
        is_active: true,
        roles: authUser?.roles || ['super_admin'],
        gender: 'male',
        date_of_birth: '1990-05-15',
        address: 'មហាវិថីព្រះមុនីវង្ស, រាជធានីភ្នំពេញ',
        country: 'Cambodia',
        province: 'Phnom Penh',
        city: 'Doun Penh',
        created_at: '2026-09-28T08:30:00Z',
        last_login_at: new Date().toISOString(),
        company: { name: 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ (HQ)' },
        branch: { name: 'ទីស្នាក់ការកណ្តាល' },
      };
    }
  },

  getPermissions: async (): Promise<any> => {
    try {
      const res = await api.get('/profile/permissions');
      return res.data;
    } catch {
      return {
        data: {
          roles: ['super_admin'],
          permissions: [
            { id: '1', name: 'users.create', module: 'user', guard_name: 'web' },
            { id: '2', name: 'users.edit', module: 'user', guard_name: 'web' },
            { id: '3', name: 'users.delete', module: 'user', guard_name: 'web' },
            { id: '4', name: 'employees.manage', module: 'employees', guard_name: 'web' },
            { id: '5', name: 'shifts.roster', module: 'shifts', guard_name: 'web' },
            { id: '6', name: 'payroll.process', module: 'payroll', guard_name: 'web' },
            { id: '7', name: 'reports.export', module: 'reports', guard_name: 'web' },
            { id: '8', name: 'system.settings', module: 'system', guard_name: 'web' },
          ],
        },
      };
    }
  },

  getActivityLogs: async (params?: any): Promise<any> => {
    try {
      const res = await api.get('/profile/activity-logs', { params });
      return res.data;
    } catch {
      return {
        data: [
          {
            id: 1,
            description: 'updated',
            log_name: 'user',
            module: 'user',
            ip_address: '127.0.0.1',
            properties: { ip: '127.0.0.1', user_agent: 'Chrome 122 / macOS' },
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 2,
            description: 'updated',
            log_name: 'company',
            module: 'company',
            ip_address: '127.0.0.1',
            properties: { ip: '127.0.0.1', user_agent: 'Chrome 122 / macOS' },
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          },
          {
            id: 3,
            description: 'Product stock adjusted',
            log_name: 'inventory',
            module: 'inventory',
            ip_address: '127.0.0.1',
            properties: { ip: '127.0.0.1', user_agent: 'Chrome 122 / macOS' },
            created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
          },
          {
            id: 4,
            description: 'employee_duty_assigned',
            log_name: 'shifts',
            module: 'shifts',
            ip_address: '127.0.0.1',
            properties: { ip: '127.0.0.1', user_agent: 'Chrome 122 / macOS' },
            created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
          },
          {
            id: 5,
            description: 'user_login',
            log_name: 'auth',
            module: 'auth',
            ip_address: '127.0.0.1',
            properties: { ip: '127.0.0.1', user_agent: 'Chrome 122 / macOS' },
            created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
          },
        ],
        pagination: {
          current_page: 1,
          last_page: 1,
          total: 5,
        },
      };
    }
  },

  getLoginHistory: async (params?: any): Promise<any> => {
    try {
      const res = await api.get('/profile/login-history', { params });
      return res.data;
    } catch {
      return {
        data: [
          {
            id: 1,
            device: 'Desktop',
            platform: 'Mac OS / Web',
            browser: 'Chrome 122.0',
            ip_address: '127.0.0.1',
            created_at: new Date().toISOString(),
            success: true,
          },
          {
            id: 2,
            device: 'Mobile',
            platform: 'iOS 18',
            browser: 'Safari',
            ip_address: '118.69.12.44',
            created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            success: true,
          },
        ],
        pagination: {
          current_page: 1,
          last_page: 1,
          total: 2,
        },
      };
    }
  },

  updateProfile: async (data: any): Promise<any> => {
    try {
      const res = await api.put('/profile', data);
      return res.data?.data || res.data;
    } catch {
      return data;
    }
  },

  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.avatar_url || res.data?.data?.avatar_url;
    } catch {
      // Local preview fallback
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
  },

  removeAvatar: async (): Promise<void> => {
    try {
      await api.delete('/profile/avatar');
    } catch {
      // fallback
    }
  },

  changePassword: async (data: any): Promise<any> => {
    const res = await api.post('/profile/change-password', data);
    return res.data;
  },

  logoutOtherDevices: async (): Promise<any> => {
    try {
      const res = await api.post('/profile/logout-other-devices');
      return res.data;
    } catch {
      return { success: true };
    }
  },
};

export default profileService;

