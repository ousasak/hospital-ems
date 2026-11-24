import { api } from '@/api/client'; 

export const organizationService = {
  getProfile: async () => (await api.get('/organization/profile')).data,
  updateProfile: async (data: any) => (await api.put('/organization/profile', data)).data,
  
  getDepartments: async (params?: any) => (await api.get('/organization/departments', { params })).data,
  createDepartment: async (data: any) => (await api.post('/organization/departments', data)).data,
  updateDepartment: async (id: number | string, data: any) => (await api.put(`/organization/departments/${id}`, data)).data,
  deleteDepartment: async (id: number | string) => (await api.delete(`/organization/departments/${id}`)).data,

  getPositions: async (params?: any) => (await api.get('/organization/positions', { params })).data,
  createPosition: async (data: any) => (await api.post('/organization/positions', data)).data,
  updatePosition: async (id: number | string, data: any) => (await api.put(`/organization/positions/${id}`, data)).data,
  deletePosition: async (id: number | string) => (await api.delete(`/organization/positions/${id}`)).data,

  getWorkLocations: async () => (await api.get('/organization/work-locations')).data,
  createWorkLocation: async (data: any) => (await api.post('/organization/work-locations', data)).data,
  updateWorkLocation: async (id: number | string, data: any) => (await api.put(`/organization/work-locations/${id}`, data)).data,

  getEmploymentTypes: async () => (await api.get('/organization/employment-types')).data,

  getOrgChart: async () => (await api.get('/organization/chart')).data,
};

export default organizationService;

