import { api } from '@/api/client';

export interface LoginPayload {
  email?: string;
  username?: string;
  password?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: any;
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface LockoutStatusResponse {
  success: boolean;
  locked: boolean;
  retry_after: number;
  failed_attempts: number;
  remaining_attempts: number;
  warning?: boolean;
  message?: string;
  data?: any;
}

export const authService = {
  login: async (credentials: LoginPayload) => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  getLockoutStatus: async (username?: string): Promise<LockoutStatusResponse> => {
    const params = username ? { username } : undefined;
    const response = await api.get<LockoutStatusResponse>('/auth/lockout-status', { params });
    const resData = (response.data as any)?.data || response.data;
    return {
      success: resData?.success ?? true,
      locked: resData?.locked ?? false,
      retry_after: Number(resData?.retry_after ?? 0),
      failed_attempts: Number(resData?.failed_attempts ?? 0),
      remaining_attempts: Number(resData?.remaining_attempts ?? 3),
      warning: Boolean(resData?.warning),
      message: resData?.message,
    };
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refresh: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  changePassword: async (data: { current_password: string; new_password: string; new_password_confirmation: string }) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    name?: string;
    gender?: string;
    date_of_birth?: string | null;
    city?: string;
    phone?: string;
    emergency_contact_phone?: string;
    emergency_contact_name?: string;
    department_id?: number | string;
    avatar_url?: string;
    [key: string]: any;
  }) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  removeAvatar: async () => {
    const response = await api.delete('/auth/avatar');
    return response.data;
  },
};

export default authService;

