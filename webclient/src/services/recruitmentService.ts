import { api } from '@/api/client';

export const recruitmentService = {
  getVacancies: async (params?: any) => (await api.get('/recruitment/vacancies', { params })).data,
  createVacancy: async (data: any) => (await api.post('/recruitment/vacancies', data)).data,
  getCandidates: async (params?: any) => (await api.get('/recruitment/candidates', { params })).data,
  createCandidate: async (data: any) => (await api.post('/recruitment/candidates', data)).data,
  updateCandidateStatus: async (id: number | string, status: string) =>
    (await api.put(`/recruitment/candidates/${id}/status`, { status })).data,
  convertToEmployee: async (id: number | string, data: any) =>
    (await api.post(`/recruitment/candidates/${id}/convert-to-employee`, data)).data,
  scheduleInterview: async (data: any) => (await api.post('/recruitment/interviews', data)).data,
};

export default recruitmentService;

