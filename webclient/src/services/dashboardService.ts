import { api } from '@/api/client';

export interface DashboardMetrics {
  total_employees: number;
  active_employees: number;
  probation_employees: number;
  inactive_employees: number;
  today_present: number;
  today_late: number;
  today_absent: number;
  today_on_leave: number;
  pending_leave_count: number;
  latest_payroll_gross: number;
  latest_payroll_net: number;
  latest_payroll_currency: string;
}

export interface DashboardStats {
  metrics: DashboardMetrics;
  departments: Array<{ id: number; name: string; count: number }>;
  gender_distribution: Array<{ gender: string; count: number }>;
  attendance_trends: Array<{ date: string; dayName: string; present: number; late: number; absent: number }>;
  pending_leaves: any[];
  upcoming_birthdays: any[];
  upcoming_holidays: any[];
  announcements: any[];
  expiring_contracts?: Array<{
    id: number;
    name: string;
    employee_code?: string;
    department: string;
    position: string;
    contract_end_date: string;
    days_remaining: number;
    avatar_url?: string;
  }>;
  probation_reviews?: Array<{
    id: number;
    name: string;
    employee_code?: string;
    department: string;
    position: string;
    probation_end_date: string;
    days_remaining: number;
    avatar_url?: string;
  }>;
  new_joiners?: Array<{
    id: number;
    name: string;
    employee_code?: string;
    department: string;
    position: string;
    join_date: string;
    avatar_url?: string;
  }>;
  today_exceptions?: {
    late: Array<{
      id: number;
      name: string;
      avatar_url?: string;
      check_in_time: string;
      late_minutes: number;
    }>;
    on_leave: Array<{
      id: number;
      name: string;
      avatar_url?: string;
      notes: string;
    }>;
  };
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get<any>('/dashboard/stats');
    if (res?.data && typeof res.data === 'object' && 'metrics' in res.data) {
      return res.data as DashboardStats;
    }
    if ((res as any)?.metrics) {
      return res as any as DashboardStats;
    }
    return (res?.data || res) as DashboardStats;
  },
};

export default dashboardService;

