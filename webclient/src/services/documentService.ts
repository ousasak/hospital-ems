import { api } from '@/api/client';
import { PaginationMeta } from '@/types/api';

export interface DocumentFilters {
  department_id?: number | string;
  employee_id?: number | string;
  category?: string;
  status?: string;
  search?: string;
  expiry_from?: string;
  expiry_to?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface EmployeeInfo {
  id: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  employee_code?: string;
  email?: string;
  avatar_url?: string | null;
  primary_assignment?: {
    id: number;
    department?: {
      id: number;
      name: string;
      code?: string;
    };
    position?: {
      id: number;
      title: string;
      level?: string;
    };
  };
}

export interface DocumentItem {
  id: number;
  employee_id: number;
  category: string;
  title: string;
  file_path: string;
  file_url?: string;
  file_size: number;
  mime_type: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  employee?: EmployeeInfo;
}

export interface PaginatedDocuments {
  data: DocumentItem[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  meta?: PaginationMeta;
}

export interface CategoryStat {
  name: string;
  count: number;
  percent: number;
}

export interface UrgentAlert {
  id: number;
  title: string;
  category: string;
  status: string;
  expiry_date: string | null;
  days_left: number | null;
  employee: {
    id: number;
    full_name: string;
    employee_code: string;
    department: string;
  };
}

export interface DocumentStats {
  total: number;
  verified: number;
  pending: number;
  expiring: number;
  expired: number;
  audit_ready_percent: number;
  categories: CategoryStat[];
  alerts: UrgentAlert[];
}

export const documentService = {
  getDocuments: async (params?: DocumentFilters): Promise<PaginatedDocuments> => {
    const res = await api.get<DocumentItem[]>('/documents', { params });
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
      meta,
    };
  },

  getStats: async (): Promise<DocumentStats> => {
    const res = await api.get<DocumentStats>('/documents/stats');
    return res.data;
  },

  getDocument: async (id: number | string): Promise<DocumentItem> => {
    const res = await api.get<DocumentItem>(`/documents/${id}`);
    return res.data;
  },

  createDocument: async (data: FormData | any) => {
    const isFormData = data instanceof FormData;
    const res = await api.post(
      '/documents',
      data,
      isFormData
        ? {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        : undefined
    );
    return res.data;
  },

  getDownloadUrl: (id: number | string) => {
    return `/api/v1/documents/${id}/download`;
  },

  deleteDocument: async (id: number | string) => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },

  verifyDocument: async (id: number | string) => {
    const res = await api.patch(`/documents/${id}/verify`);
    return res.data;
  },

  pingRenewal: async (id: number | string) => {
    const res = await api.post(`/documents/${id}/ping-renewal`);
    return res.data;
  },
};

export default documentService;

