import { api } from '@/api/client';
import { PaginationMeta } from '@/types/api';

export interface AssignmentFilters {
  department_id?: number | string;
  employee_id?: number | string;
  status?: string;
  search?: string;
  is_primary_only?: boolean;
  page?: number;
  per_page?: number;
}

export interface PaginatedAssignments {
  data: any[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  meta?: PaginationMeta;
}

export const assignmentService = {
  getAssignments: async (params?: AssignmentFilters): Promise<PaginatedAssignments> => {
    const res = await api.get<any[]>('/assignments', { params });
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

  getEmployeeAssignments: async (employeeId: number | string) =>
    (await api.get(`/assignments/employee/${employeeId}`)).data,

  createAssignment: async (data: any) =>
    (await api.post('/assignments', data)).data,

  updateAssignment: async (id: number | string, data: any) =>
    (await api.put(`/assignments/${id}`, data)).data,

  deleteAssignment: async (id: number | string) =>
    (await api.delete(`/assignments/${id}`)).data,
};

export default assignmentService;
