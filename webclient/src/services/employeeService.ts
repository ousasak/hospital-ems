import { api } from '@/api/client';
import { env } from '@/config/env';
import { ApiResponse, PaginationMeta } from '@/types/api';

export interface EmployeeFilters {
  page?: number;
  per_page?: number;
  search?: string;
  country?: string;
  department?: string;
  office?: string;
  type?: string;
  status?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface PaginatedEmployees {
  data: any[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  meta?: PaginationMeta;
}

export const employeeService = {
  getEmployees: async (params?: EmployeeFilters): Promise<PaginatedEmployees> => {
    const res = await api.get<any[]>('/employees', { params });
    const items = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.data || [];

    const meta = res.meta || (res.data as any)?.meta;
    const total = meta?.total ?? (res.data as any)?.total ?? items.length;
    const current_page = meta?.current_page ?? (res.data as any)?.current_page ?? 1;
    const last_page = meta?.last_page ?? (res.data as any)?.last_page ?? 1;
    const per_page = meta?.per_page ?? (res.data as any)?.per_page ?? (params?.per_page || 10);

    return {
      data: items,
      total,
      current_page,
      last_page,
      per_page,
      meta: meta || {
        current_page,
        last_page,
        per_page,
        total,
      },
    };
  },

  getEmployeeById: async (id: number | string) => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },

  createEmployee: async (data: any) => {
    const res = await api.post('/employees', data);
    return res.data;
  },

  updateEmployee: async (id: number | string, data: any) => {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
  },

  deleteEmployee: async (id: number | string) => {
    const res = await api.delete(`/employees/${id}`);
    return res.data;
  },

  restoreEmployee: async (id: number | string) => {
    const res = await api.post(`/employees/${id}/restore`);
    return res.data;
  },

  uploadAvatar: async (id: number | string, fileOrBase64: File | string) => {
    if (typeof fileOrBase64 === 'string') {
      const res = await api.post(`/employees/${id}/avatar`, { avatar_url: fileOrBase64 });
      return res.data;
    }
    const formData = new FormData();
    formData.append('avatar', fileOrBase64);
    const res = await api.post(`/employees/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  addEmergencyContact: async (id: number | string, data: any) => {
    const res = await api.post(`/employees/${id}/emergency-contacts`, data);
    return res.data;
  },

  addEducation: async (id: number | string, data: any) => {
    const res = await api.post(`/employees/${id}/educations`, data);
    return res.data;
  },

  addExperience: async (id: number | string, data: any) => {
    const res = await api.post(`/employees/${id}/experiences`, data);
    return res.data;
  },

  uploadDocument: async (id: number | string, formData: FormData) => {
    const res = await api.post(`/employees/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteDocument: async (id: number | string, docId: number | string) => {
    const res = await api.delete(`/employees/${id}/documents/${docId}`);
    return res.data;
  },

  exportCsvUrl: `${env.apiUrl}/employees/export`,
};

export default employeeService;
