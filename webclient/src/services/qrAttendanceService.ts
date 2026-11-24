import { api } from '@/api/client';

export interface HospitalNetworkItem {
  id: number;
  organization_id?: number | null;
  branch_name: string;
  network_name: string;
  allowed_ip?: string | null;
  allowed_cidr?: string | null;
  description?: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface HospitalGeofenceItem {
  id: number;
  organization_id?: number | null;
  name: string;
  branch_name: string;
  latitude: number | string;
  longitude: number | string;
  radius_meters: number;
  max_accuracy_meters: number;
  description?: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AttendanceScanLogItem {
  id: number;
  employee_id?: number | null;
  user_id?: number | null;
  qr_code_id?: number | null;
  event_type: 'qr_validate' | 'check_in' | 'check_out' | 'rejected';
  source_ip: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  geofence_distance?: number | null;
  network_validation_status: 'passed' | 'failed';
  location_validation_status: 'passed' | 'failed' | 'skipped';
  overall_status: 'success' | 'rejected';
  failure_reason?: string | null;
  device_metadata?: string | null;
  created_at: string;
  employee?: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    primary_assignment?: {
      department?: { name: string };
    };
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface EmployeeQrDetails {
  employee: {
    id: number;
    employee_code: string;
    full_name: string;
    department?: string;
    position?: string;
    avatar_url?: string;
  };
  active_qr: {
    id: number;
    status: 'active' | 'revoked' | 'expired';
    generated_at: string;
    expires_at?: string | null;
    attendance_url: string;
    svg: string;
    png_data_uri: string;
    generated_by: string;
  } | null;
  history: Array<{
    id: number;
    status: string;
    generated_at: string;
    revoked_at?: string | null;
    revocation_reason?: string | null;
    generated_by?: string | null;
    revoked_by?: string | null;
  }>;
}

export interface EmployeeIdCardData {
  organization: {
    name: string;
    legal_name: string;
    logo_url: string;
    phone: string;
    email: string;
    address: string;
  };
  employee: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar_url?: string;
    department: string;
    position: string;
    specialization?: string | null;
    medical_license_number?: string | null;
    join_date?: string | null;
    national_id?: string | null;
    blood_group?: string | null;
    emergency_phone?: string | null;
  };
  qr: {
    attendance_url: string;
    svg: string;
    png_data_uri: string;
  };
}

export interface QrPreValidationResult {
  valid: boolean;
  employee: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar_url?: string;
    department: string;
    position: string;
  };
  qr_code: {
    id: number;
    status: string;
    generated_at: string;
  };
  shift: {
    id: number;
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    grace_period_minutes: number;
    is_overnight: boolean;
  } | null;
  today_record: {
    id?: number;
    attendance_date?: string;
    check_in_time?: string | null;
    check_out_time?: string | null;
    working_hours?: number | string;
    status?: string;
    has_checked_in: boolean;
    has_checked_out: boolean;
  };
  suggested_action: 'check_in' | 'check_out' | 'completed';
  network_precheck: {
    client_ip: string;
    is_authorized_hospital_wifi: boolean;
    message: string;
  };
}

export interface QrAttendanceSubmitPayload {
  token: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  device_metadata?: string;
}

export interface QrAttendanceSubmitResult {
  action: 'check_in' | 'check_out';
  status?: string;
  timing_status?: 'on_time' | 'late' | 'early' | 'early_leave' | 'overtime' | 'unscheduled';
  timing_note?: string;
  time: string;
  time_formatted?: string;
  date: string;
  late_minutes?: number;
  working_hours?: number;
  overtime_hours?: number;
  early_leaving_minutes?: number;
  message: string;
  message_kh?: string;
  network?: string;
  geofence?: string;
  distance_meters?: number;
  employee?: {
    id: number;
    employee_code: string;
    full_name: string;
    avatar_url?: string;
    department?: string;
    position?: string;
  };
  shift?: {
    name: string;
    start_time: string;
    end_time: string;
  } | null;
  record?: any;
}

export const qrAttendanceService = {
  // Admin QR Operations
  getEmployeeQr: async (employeeId: number | string): Promise<EmployeeQrDetails> => {
    const res = await api.get(`/employees/${employeeId}/qr`);
    const root = res as any;
    const body = (res.data as any) || {};

    const employee = body?.employee || root?.employee || (body?.id ? body : root?.data?.employee);
    const active_qr = body?.active_qr !== undefined ? body.active_qr : (root?.active_qr !== undefined ? root.active_qr : root?.data?.active_qr ?? null);
    const history = body?.history || root?.history || root?.data?.history || [];

    return {
      employee,
      active_qr,
      history,
    };
  },

  generateEmployeeQr: async (employeeId: number | string) => {
    const res = await api.post(`/employees/${employeeId}/qr/generate`);
    const root = res as any;
    const body = (res.data as any) || {};
    return {
      message: body?.message || root?.message || root?.data?.message,
      active_qr: body?.active_qr || root?.active_qr || root?.data?.active_qr,
      employee: body?.employee || root?.employee || root?.data?.employee,
    };
  },

  regenerateEmployeeQr: async (employeeId: number | string) => {
    const res = await api.post(`/employees/${employeeId}/qr/regenerate`);
    const root = res as any;
    const body = (res.data as any) || {};
    return {
      message: body?.message || root?.message || root?.data?.message,
      active_qr: body?.active_qr || root?.active_qr || root?.data?.active_qr,
      employee: body?.employee || root?.employee || root?.data?.employee,
    };
  },

  revokeEmployeeQr: async (employeeId: number | string, reason?: string) => {
    const res = await api.patch(`/employees/${employeeId}/qr/revoke`, { reason });
    return res.data;
  },

  getEmployeeIdCard: async (employeeId: number | string): Promise<EmployeeIdCardData> => {
    const res = await api.get(`/employees/${employeeId}/id-card`);
    const root = res as any;
    const body = (res.data as any) || {};

    return {
      organization: body?.organization || root?.organization || root?.data?.organization,
      employee: body?.employee || root?.employee || root?.data?.employee,
      qr: body?.qr || root?.qr || root?.data?.qr,
    };
  },

  // Hospital Network Settings
  getNetworks: async (): Promise<HospitalNetworkItem[]> => {
    const res = await api.get('/attendance/networks');
    return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
  },

  createNetwork: async (data: Partial<HospitalNetworkItem>) => {
    const res = await api.post('/attendance/networks', data);
    return res.data;
  },

  updateNetwork: async (id: number | string, data: Partial<HospitalNetworkItem>) => {
    const res = await api.put(`/attendance/networks/${id}`, data);
    return res.data;
  },

  deleteNetwork: async (id: number | string) => {
    const res = await api.delete(`/attendance/networks/${id}`);
    return res.data;
  },

  // Hospital Geofence Settings
  getGeofences: async (): Promise<HospitalGeofenceItem[]> => {
    const res = await api.get('/attendance/geofences');
    return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
  },

  createGeofence: async (data: Partial<HospitalGeofenceItem>) => {
    const res = await api.post('/attendance/geofences', data);
    return res.data;
  },

  updateGeofence: async (id: number | string, data: Partial<HospitalGeofenceItem>) => {
    const res = await api.put(`/attendance/geofences/${id}`, data);
    return res.data;
  },

  deleteGeofence: async (id: number | string) => {
    const res = await api.delete(`/attendance/geofences/${id}`);
    return res.data;
  },

  // Audit Logs & Attendance Stats
  getScanLogs: async (params?: any): Promise<{
    data: AttendanceScanLogItem[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
  }> => {
    const res = await api.get('/attendance/scan-logs', { params });
    const payload = res.data;
    return {
      data: Array.isArray(payload) ? payload : payload?.data || [],
      total: payload?.total || 0,
      current_page: payload?.current_page || 1,
      last_page: payload?.last_page || 1,
      per_page: payload?.per_page || 20,
    };
  },

  getAttendanceStats: async (date?: string) => {
    const res = await api.get('/attendance/stats', { params: { date } });
    return res.data;
  },

  // Employee Mobile Flow
  validateQrToken: async (token: string): Promise<QrPreValidationResult> => {
    const res = await api.get(`/employee/attendance/qr/${token}/validate`);
    return res.data;
  },

  submitAttendance: async (payload: QrAttendanceSubmitPayload): Promise<QrAttendanceSubmitResult> => {
    const res = await api.post('/employee/attendance/qr/submit', payload);
    return res.data;
  },

  getEmployeeToday: async () => {
    const res = await api.get('/employee/attendance/today');
    return res.data;
  },

  getEmployeeHistory: async (params?: any) => {
    const res = await api.get('/employee/attendance/history', { params });
    return res.data;
  },
};

export default qrAttendanceService;

