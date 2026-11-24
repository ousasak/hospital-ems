import { api } from '@/api/client';

export const performanceService = {
  getReviews: async (params?: any) => (await api.get('/performance/reviews', { params })).data,
  createReview: async (data: any) => (await api.post('/performance/reviews', data)).data,
  addCriteria: async (reviewId: number | string, data: any) =>
    (await api.post(`/performance/reviews/${reviewId}/criteria`, data)).data,
  getPrograms: async (params?: any) => (await api.get('/training/programs', { params })).data,
  createProgram: async (data: any) => (await api.post('/training/programs', data)).data,
  enroll: async (programId: number | string, data: any) =>
    (await api.post(`/training/programs/${programId}/enroll`, data)).data,
};

export default performanceService;

