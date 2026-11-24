import { api } from '@/api/client';
import { employeeService } from './employeeService';
import {
  LeaveRequestItem,
  LeaveCategoryBalance,
  RegionalHoliday,
  LeaveEmployee,
  LeaveStatus,
  LeaveKPISummary,
  LeaveCategoryType,
} from '@/pages/leave/types';
import {
  LEAVE_EMPLOYEES,
  INITIAL_LEAVE_BALANCES,
  REGIONAL_HOLIDAYS,
  generateInitialLeaveRequests,
} from '@/pages/leave/mockData';
import { computeLeaveKPISummary } from '@/pages/leave/utils/leaveCalculations';

class LeaveService {
  private inMemoryRequests: LeaveRequestItem[] = [];
  private inMemoryBalances: LeaveCategoryBalance[] = [...INITIAL_LEAVE_BALANCES];

  constructor() {
    this.inMemoryRequests = generateInitialLeaveRequests();
  }

  // --- Raw Backend API endpoints ---
  async getTypes() {
    return (await api.get('/leaves/types')).data;
  }

  async createType(data: any) {
    return (await api.post('/leaves/types', data)).data;
  }

  async getRawBalances(params?: any) {
    return (await api.get('/leaves/balances', { params })).data;
  }

  async getRawRequests(params?: any) {
    return (await api.get('/leaves/requests', { params })).data;
  }

  async supervisorReview(
    id: number | string,
    data: { status: 'approved' | 'rejected'; comments?: string }
  ) {
    return (await api.put(`/leaves/requests/${id}/supervisor-review`, data)).data;
  }

  async hrReview(
    id: number | string,
    data: { status: 'approved' | 'rejected'; comments?: string }
  ) {
    return (await api.put(`/leaves/requests/${id}/hr-review`, data)).data;
  }

  async cancelRequest(id: number | string, data?: { reason?: string }) {
    return (await api.post(`/leaves/requests/${id}/cancel`, data)).data;
  }

  // --- Domain Methods (Used by Leave Management Feature) ---

  /**
   * Get all employees dynamically from backend
   */
  async getEmployees(): Promise<LeaveEmployee[]> {
    try {
      const res = await employeeService.getEmployees({ per_page: 100 });
      const rawList = Array.isArray(res) ? res : res?.data || [];
      if (rawList.length > 0) {
        const backendEmps: LeaveEmployee[] = rawList.map((e: any) => ({
          id: String(e.id),
          name: e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Staff Member',
          country: e.country || 'កម្ពុជា (Cambodia)',
          office: e.primary_assignment?.work_location?.name || e.office || 'ត្បូងឃ្មុំ (Tboung Khmum)',
          avatar: 'avatar-01.jpg',
          avatarUrl: e.profile_photo_url,
          department: e.primary_assignment?.department?.name || 'ផ្នែកទូទៅ',
          employee_code: e.employee_code || `EMP-${e.id}`,
        }));
        return backendEmps;
      }
    } catch (err) {
      console.warn('Fallback to local employees:', err);
    }
    return LEAVE_EMPLOYEES;
  }

  /**
   * Get Leave Requests dynamically from backend
   */
  async getRequests(params?: any): Promise<LeaveRequestItem[]> {
    try {
      const res = await (await api.get('/leaves/requests', { params: params || { per_page: 100 } })).data;
      const rawList = Array.isArray(res) ? res : res?.data || [];

      if (rawList.length > 0) {
        const backendRequests: LeaveRequestItem[] = rawList.map((r: any) => {
          let mappedStatus: LeaveStatus = 'Pending';
          const rawStatus = String(r.status || '').toLowerCase();
          if (rawStatus === 'approved') mappedStatus = 'Approved';
          else if (rawStatus === 'rejected') mappedStatus = 'Rejected';
          else if (rawStatus === 'cancelled') mappedStatus = 'Cancelled';
          else mappedStatus = 'Pending';

          const emp = r.employee;
          const empName = emp?.full_name || `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim() || 'បុគ្គលិក';
          const typeName = r.leave_type?.name || r.leaveType?.name || 'Annual Leave';

          return {
            id: `LV-${r.id}`,
            employee: empName,
            employeeId: emp?.employee_code || (r.employee_id ? String(r.employee_id) : `EMP-${r.id}`),
            country: emp?.country || 'កម្ពុជា',
            office: emp?.primary_assignment?.work_location?.name || 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ',
            avatar: 'avatar-01.jpg',
            avatarUrl: emp?.profile_photo_url,
            type: (typeName as LeaveCategoryType) || 'Annual Leave',
            typeId: r.leave_type_id,
            start: new Date(r.start_date),
            end: new Date(r.end_date),
            duration: Number(r.total_days) || 1,
            status: mappedStatus,
            reason: r.reason || 'កិច្ចការបន្ទាន់ផ្ទាល់ខ្លួន',
            appliedDate: r.created_at ? r.created_at.split('T')[0] : undefined,
            isHalfDay: Boolean(r.is_half_day),
            halfDayType: r.half_day_type,
          };
        });

        return backendRequests;
      }
    } catch (err) {
      console.warn('Fallback to in-memory leave requests:', err);
    }
    return [...this.inMemoryRequests];
  }

  /**
   * Get Leave Balances dynamically from backend
   */
  async getBalances(params?: any): Promise<LeaveCategoryBalance[]> {
    try {
      const res = await (await api.get('/leaves/balances', { params })).data;
      const rawBalances = Array.isArray(res) ? res : res?.data || [];
      if (rawBalances.length > 0) {
        const aggregated: Record<string, { used: number; total: number }> = {};
        rawBalances.forEach((b: any) => {
          const typeName = b.leave_type?.name || b.leaveType?.name || 'Annual Leave';
          if (!aggregated[typeName]) {
            aggregated[typeName] = { used: 0, total: 0 };
          }
          aggregated[typeName].used += Number(b.used_days || 0);
          aggregated[typeName].total += Number(b.total_days || 0);
        });

        const balances = Object.entries(aggregated).map(([type, stats]) => ({
          type: type as LeaveCategoryType,
          used: stats.used,
          total: stats.total,
        }));

        if (balances.length > 0) {
          return balances;
        }
      }
    } catch (err) {
      console.warn('Fallback to local balances:', err);
    }
    return [...this.inMemoryBalances];
  }

  /**
   * Get Regional & Statutory Holidays (Official Cambodian Holidays)
   */
  async getHolidays(): Promise<RegionalHoliday[]> {
    return REGIONAL_HOLIDAYS;
  }

  /**
   * Update request status (Approve / Reject) with real backend API sync
   */
  async updateRequestStatus(
    id: string,
    newStatus: 'Approved' | 'Rejected'
  ): Promise<LeaveRequestItem> {
    // 1. Update in-memory state
    const target = this.inMemoryRequests.find((r) => r.id === id);
    if (target) {
      const prevStatus = target.status;
      target.status = newStatus;

      // Adjust category balance if approved/rejected
      if (newStatus === 'Approved' && prevStatus !== 'Approved') {
        const cat = this.inMemoryBalances.find((b) => b.type === target.type);
        if (cat) {
          cat.used = Math.min(cat.total, cat.used + target.duration);
        }
      } else if (prevStatus === 'Approved' && newStatus === 'Rejected') {
        const cat = this.inMemoryBalances.find((b) => b.type === target.type);
        if (cat) {
          cat.used = Math.max(0, cat.used - target.duration);
        }
      }
    }

    // 2. Real Backend sync via Laravel API
    const numericId = id.replace(/^[^\d]*/, '');
    if (numericId && !isNaN(Number(numericId))) {
      try {
        const backendStatus = newStatus === 'Approved' ? 'approved' : 'rejected';
        await this.hrReview(numericId, {
          status: backendStatus,
          comments: `អនុម័តដោយ HR តាមរយៈផ្ទាំងគ្រប់គ្រងច្បាប់ (${newStatus})`,
        });
      } catch (err) {
        console.warn(`Backend HR review sync failed for ID ${numericId}, kept in local state:`, err);
      }
    }

    return (
      target || {
        id,
        employee: 'បុគ្គលិក',
        type: 'Annual Leave',
        start: new Date(),
        end: new Date(),
        duration: 1,
        status: newStatus,
        office: 'ត្បូងឃ្មុំ',
        country: 'កម្ពុជា',
        avatar: 'avatar-01.jpg',
        reason: 'កិច្ចការបន្ទាន់ផ្ទាល់ខ្លួន',
      }
    );
  }

  /**
   * Map Leave Category Name to Backend leave_type_id
   */
  getLeaveTypeId(type: LeaveCategoryType | string): number {
    switch (type) {
      case 'Sick Leave':
        return 2;
      case 'Personal Leave':
      case 'Special Personal Leave':
        return 3;
      case 'Unpaid Leave':
        return 4;
      case 'Annual Leave':
      default:
        return 1;
    }
  }

  /**
   * Submit new Leave Request with backend sync
   */
  async createRequest(data: {
    employee: string;
    employeeId?: string | number;
    type: LeaveCategoryType;
    typeId?: number;
    start: Date;
    end: Date;
    reason: string;
    isHalfDay?: boolean;
    halfDayType?: 'morning' | 'afternoon';
  }): Promise<LeaveRequestItem> {
    const leaveTypeId = data.typeId || this.getLeaveTypeId(data.type);
    const startDateStr = data.start.toISOString().split('T')[0];
    const endDateStr = data.end.toISOString().split('T')[0];

    const daysDiff = Math.max(
      1,
      Math.round((data.end.getTime() - data.start.getTime()) / 864e5) + 1
    );
    const duration = data.isHalfDay ? 0.5 : daysDiff;

    // Call Laravel Backend API
    const payload: any = {
      leave_type_id: leaveTypeId,
      start_date: startDateStr,
      end_date: endDateStr,
      is_half_day: Boolean(data.isHalfDay),
      half_day_type: data.halfDayType || null,
      reason: data.reason,
    };

    if (data.employeeId) {
      const numericId = Number(String(data.employeeId).replace(/^[^\d]*/, ''));
      if (numericId > 0) {
        payload.employee_id = numericId;
      }
    }

    const res = await api.post('/leaves/requests', payload);
    const created = res.data?.leave_request || res.data;

    const newReq: LeaveRequestItem = {
      id: created?.id ? `LV-${created.id}` : `LV-${1000 + this.inMemoryRequests.length + 1}`,
      employee: created?.employee?.full_name || data.employee,
      employeeId: created?.employee_id || data.employeeId,
      country: created?.employee?.country || 'កម្ពុជា',
      office: created?.employee?.primary_assignment?.work_location?.name || 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ',
      avatar: 'avatar-01.jpg',
      avatarUrl: created?.employee?.profile_photo_url,
      type: data.type,
      typeId: leaveTypeId,
      start: data.start,
      end: data.end,
      duration: created?.total_days ? Number(created.total_days) : duration,
      status: 'Pending',
      reason: data.reason || 'កិច្ចការបន្ទាន់ផ្ទាល់ខ្លួន',
      appliedDate: created?.created_at ? created.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      isHalfDay: data.isHalfDay,
      halfDayType: data.halfDayType,
    };

    this.inMemoryRequests.unshift(newReq);
    return newReq;
  }

  /**
   * Calculate summary KPIs
   */
  getKPISummary(requests: LeaveRequestItem[]): LeaveKPISummary {
    return computeLeaveKPISummary(requests, this.inMemoryBalances);
  }
}

export const leaveService = new LeaveService();
export default leaveService;
