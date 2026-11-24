export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type LeaveCategoryType =
  | 'Annual Leave'
  | 'Sick Leave'
  | 'Personal Leave'
  | 'Unpaid Leave';

export interface LeaveEmployee {
  id?: string;
  name: string;
  country: string;
  office: string;
  avatar: string;
  avatarUrl?: string;
  department?: string;
  employee_code?: string;
}

export interface LeaveRequestItem {
  id: string;
  employee: string;
  employeeId?: number | string;
  country: string;
  office: string;
  avatar: string;
  avatarUrl?: string;
  type: LeaveCategoryType;
  typeId?: number;
  start: Date;
  end: Date;
  duration: number; // in days
  status: LeaveStatus;
  reason: string;
  appliedDate?: string;
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon';
  approver?: string;
  approvedAt?: string;
  notes?: string;
}

export interface LeaveCategoryBalance {
  type: LeaveCategoryType;
  used: number;
  total: number;
}

export interface RegionalHoliday {
  country: string;
  name: string;
  date: string;
}

export interface LeaveKPISummary {
  totalAvailable: number; // e.g. 4286
  pending: number;        // e.g. 9
  approved: number;       // e.g. 9
  rejected: number;       // e.g. 8
  upcoming: number;       // e.g. 8
}

export interface LeaveFilterState {
  search: string;
  status: string;
  sortKey: 'employee' | 'start' | null;
  sortDir: 'asc' | 'desc';
}

export interface CalendarDayDetail {
  day: number;
  entries: LeaveRequestItem[];
}

