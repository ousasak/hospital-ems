import { api } from '@/api/client';

export interface ReportDateRange {
  startDate?: string;
  endDate?: string;
}

export interface ReportFilterParams {
  start_date?: string;
  end_date?: string;
  department_id?: number | string;
  status?: string;
  search?: string;
  year?: number;
  category?: 'attendance' | 'leave' | 'employee' | 'shift' | 'department' | 'payroll';
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  lang?: string;
}

export interface ReportScope {
  is_department_scoped: boolean;
  department_ids?: number[] | null;
  department_names: string[];
}

export interface ReportSummaryMetrics {
  total_employees: number;
  active_employees: number;
  probation_employees: number;
  inactive_employees: number;
  department_count: number;
  today_attendance_count: number;
  today_present_count: number;
  today_late_count: number;
  today_absent_count: number;
  today_on_leave_count: number;
  today_attendance_rate: number;
  period_attendance_rate: number;
  attendance_rate_change?: number | null;
  period_present_count: number;
  period_late_count: number;
  period_absent_count: number;
  period_on_leave_count: number;
  total_working_hours: number;
  total_overtime_hours: number;
  total_late_minutes: number;
  pending_leaves_count: number;
  leaves_this_month: number;
}

export interface ReportSummaryResponse {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  scope: ReportScope;
  metrics: ReportSummaryMetrics;
  payroll_summary?: {
    latest_period: string;
    total_gross: number;
    total_deductions: number;
    total_net: number;
    currency: string;
    status: string;
  } | null;
  // Legacy backward compatible fields
  employee_count?: number;
  active_employee_count?: number;
  department_count?: number;
  today_attendance_count?: number;
}

export interface WorkforceAnalyticsResponse {
  total_headcount: number;
  by_department: Array<{
    id: number;
    name: string;
    code: string;
    count: number;
    percentage: number;
  }>;
  by_status: Array<{
    status: string;
    label: string;
    count: number;
  }>;
  by_gender: Array<{
    gender: string;
    label: string;
    count: number;
  }>;
  by_position: Array<{
    id: number;
    title: string;
    code: string;
    count: number;
  }>;
  hiring_trends: Array<{
    month: string;
    short_month: string;
    count: number;
  }>;
  by_employment_type: Array<{
    id: number;
    name: string;
    count: number;
  }>;
}

export interface AttendanceAnalyticsResponse {
  period: {
    start_date: string;
    end_date: string;
  };
  status_counts: {
    present: number;
    late: number;
    absent: number;
    on_leave: number;
    half_day: number;
  };
  attendance_rate: number;
  total_working_hours: number;
  total_overtime_hours: number;
  total_late_minutes: number;
  daily_trends: Array<{
    date: string;
    label: string;
    day_name: string;
    present: number;
    late: number;
    absent: number;
    on_leave: number;
    rate: number;
  }>;
  department_rates: Array<{
    department: string;
    present: number;
    total: number;
    rate: number;
  }>;
  late_arrival_buckets: {
    '1_to_15_mins': number;
    '16_to_30_mins': number;
    '31_to_60_mins': number;
    'over_60_mins': number;
  };
  total_records: number;
}

export interface LeaveAnalyticsResponse {
  year: number;
  by_status: {
    approved: number;
    pending_supervisor: number;
    pending_hr: number;
    rejected: number;
    cancelled: number;
  };
  by_type: Array<{
    id: number;
    name: string;
    code: string;
    total_days: number;
    count: number;
  }>;
  leaves_by_month: Array<{
    month: string;
    full_month: string;
    days: number;
    requests_count: number;
  }>;
  by_department: Array<{
    department: string;
    days: number;
    count: number;
  }>;
  currently_on_leave: Array<{
    id: number;
    employee_id: string;
    name: string;
    avatar_url?: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    total_days: number;
  }>;
  total_requests: number;
}

export interface ShiftAnalyticsResponse {
  period: {
    start_date: string;
    end_date: string;
  };
  total_active_employees: number;
  total_shift_records: number;
  unassigned_employees_count: number;
  by_shift: Array<{
    id: number;
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    is_overnight: boolean;
    category: 'morning' | 'afternoon' | 'night' | 'office';
    records_count: number;
    unique_employees: number;
    percentage: number;
  }>;
  categories_breakdown: {
    morning: { label: string; count: number };
    afternoon: { label: string; count: number };
    night: { label: string; count: number };
    office: { label: string; count: number };
  };
  by_department: Array<{
    department: string;
    morning: number;
    afternoon: number;
    night: number;
    office: number;
    total: number;
  }>;
}

export interface PayrollAnalyticsResponse {
  available: boolean;
  reason?: string;
  year?: number;
  total_disbursed_year?: number;
  payrolls?: Array<{
    month: string;
    gross: number;
    deductions: number;
    net: number;
    status: string;
  }>;
}

export interface DetailedRecordsResponse<T = any> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const reportService = {
  getSummary: async (params?: ReportFilterParams): Promise<ReportSummaryResponse> => {
    const res = await api.get<ReportSummaryResponse>('/reports/summary', { params });
    return res.data;
  },

  getWorkforce: async (params?: ReportFilterParams): Promise<WorkforceAnalyticsResponse> => {
    const res = await api.get<WorkforceAnalyticsResponse>('/reports/workforce', { params });
    return res.data;
  },

  getAttendance: async (params?: ReportFilterParams): Promise<AttendanceAnalyticsResponse> => {
    const res = await api.get<AttendanceAnalyticsResponse>('/reports/attendance', { params });
    return res.data;
  },

  getLeaves: async (params?: ReportFilterParams): Promise<LeaveAnalyticsResponse> => {
    const res = await api.get<LeaveAnalyticsResponse>('/reports/leaves', { params });
    return res.data;
  },

  getShifts: async (params?: ReportFilterParams): Promise<ShiftAnalyticsResponse> => {
    const res = await api.get<ShiftAnalyticsResponse>('/reports/shifts', { params });
    return res.data;
  },

  getPayroll: async (params?: ReportFilterParams): Promise<PayrollAnalyticsResponse> => {
    const res = await api.get<PayrollAnalyticsResponse>('/reports/payroll', { params });
    return res.data;
  },

  getDetailedRecords: async <T = any>(params?: ReportFilterParams): Promise<DetailedRecordsResponse<T>> => {
    const res = await api.get<any>('/reports/detailed-records', { params });
    // Handles enveloped pagination or direct structure
    if (res.meta && res.data) {
      return {
        data: res.data as T[],
        current_page: res.meta.current_page,
        last_page: res.meta.last_page,
        per_page: res.meta.per_page,
        total: res.meta.total,
      };
    }
    return res.data as DetailedRecordsResponse<T>;
  },

  exportCsv: (params?: ReportFilterParams): void => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const token = localStorage.getItem('staffstream_token');
    const url = `/api/v1/reports/export?${query.toString()}`;
    
    // Trigger direct download with bearer token via anchor or fetch
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Export request failed');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Report_${params?.category || 'data'}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((err) => {
        console.error('Export error:', err);
      });
  },

  // Legacy method aliases
  getAttendanceReport: async (params?: any) => (await api.get('/reports/attendance', { params })).data,
  getLeaveReport: async (params?: any) => (await api.get('/reports/leaves', { params })).data,
  getPayrollReport: async (params?: any) => (await api.get('/reports/payroll', { params })).data,
};

export default reportService;
