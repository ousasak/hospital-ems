export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Late'
  | 'Half Day'
  | 'Remote'
  | 'On Leave';

export type AttendanceExceptionType =
  | 'Late Arrival'
  | 'Missing Check-out'
  | 'Early Departure'
  | 'Missing Attendance'
  | 'Excessive Overtime'
  | 'None';

export type ExceptionSeverity = 'High' | 'Medium' | 'Low';

export interface AttendanceRecordItem {
  id: string; // e.g. "EMP-001"
  name: string;
  avatar: string;
  avatar_url?: string;
  country: string;
  office: string;
  region: string;
  department: string;
  shift?: string; // e.g. "វេនព្រឹក (07:00 - 15:00)"
  position?: string;
  dateLabel: string; // e.g. "12 វិច្ឆិកា 2026"
  dateSort: string; // e.g. "2026-11-12"
  checkIn: string; // e.g. "07:58"
  checkOut: string; // e.g. "17:01" or "—"
  workingHours: string; // e.g. "8h 03m"
  overtime: string; // e.g. "1h 10m" or "—"
  status: AttendanceStatus;
  exception: AttendanceExceptionType;
  hasException: boolean;
  verificationMethod?: string; // e.g. "Wi-Fi + GPS ត្រឹមត្រូវ"
  notes?: string;
  ipAddress?: string;
  device?: string;
}

export interface AttendanceFilterState {
  search: string;
  country: string;
  region: string;
  office: string;
  department: string;
  shift?: string;
  status: string;
  dateRangeFrom?: Date | null;
  dateRangeTo?: Date | null;
}

export interface AttendanceSnapshotItem {
  label: AttendanceStatus;
  value: number;
  tone: 'success' | 'danger' | 'warning' | 'neutral';
  icon: string;
  sub: string;
}

export interface AttendanceExceptionGroup {
  title: string;
  icon: string;
  severity: ExceptionSeverity;
  list: AttendanceRecordItem[];
}

