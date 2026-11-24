import { api } from '@/api/client';

export const attendanceService = {
  getToday: async () => (await api.get('/attendance/today')).data,
  getRecords: async (params?: any) => {
    const res = await api.get('/attendance/records', { params });
    if (Array.isArray(res.data)) {
      return res.data;
    }
    if (Array.isArray((res.data as any)?.data)) {
      return (res.data as any).data;
    }
    return [];
  },
  exportExcel: async (date?: string) => {
    const response = await api.get('/attendance/export', {
      params: { date },
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Report_${(date || 'all').replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  checkIn: async (data?: { method?: string; latitude?: number; longitude?: number }) =>
    (await api.post('/attendance/check-in', data || { method: 'manual' })).data,
  checkOut: async () => (await api.post('/attendance/check-out')).data,
  adminEntry: async (data: any) => (await api.post('/attendance/admin-entry', data)).data,
  requestCorrection: async (data: any) => (await api.post('/attendance/corrections', data)).data,
  reviewCorrection: async (id: number | string, data: any) =>
    (await api.put(`/attendance/corrections/${id}/review`, data)).data,
  getShifts: async () => (await api.get('/attendance/shifts')).data,
  getHolidays: async () => (await api.get('/attendance/holidays')).data,
};

export default attendanceService;
