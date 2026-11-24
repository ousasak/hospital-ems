import { api } from '@/api/client';
import type {
  AnnouncementItem,
  AuditLogsResponse,
  CreateAnnouncementPayload,
  SystemSettingsMap,
} from '@/pages/settings/types';

export const settingsService = {
  getSettings: async (): Promise<SystemSettingsMap> =>
    (await api.get('/settings')).data,

  updateSettings: async (data: Record<string, string | number | boolean>) =>
    (await api.put('/settings', data)).data,

  getPublicSettings: async (): Promise<SystemSettingsMap> =>
    (await api.get('/public-settings')).data,

  getAnnouncements: async (): Promise<AnnouncementItem[]> => {
    const res = (await api.get('/settings/announcements')).data;
    return Array.isArray(res) ? res : res?.data || [];
  },

  createAnnouncement: async (data: CreateAnnouncementPayload) =>
    (await api.post('/settings/announcements', data)).data,

  deleteAnnouncement: async (id: number | string) =>
    (await api.delete(`/settings/announcements/${id}`)).data,

  getAuditLogs: async (params?: { page?: number; per_page?: number }): Promise<AuditLogsResponse> => {
    const res = (await api.get('/settings/audit-logs', { params })).data;
    if (Array.isArray(res)) {
      return {
        data: res,
        current_page: 1,
        last_page: 1,
        per_page: res.length || 25,
        total: res.length,
      };
    }
    return {
      data: res?.data || [],
      current_page: res?.current_page || 1,
      last_page: res?.last_page || 1,
      per_page: res?.per_page || 25,
      total: res?.total || 0,
    };
  },
};

export default settingsService;
