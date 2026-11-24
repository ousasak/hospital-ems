export type ShiftTemplateKey = 'Morning' | 'Day' | 'Evening' | 'Night' | 'OFF';

export interface ShiftTemplate {
  key: string;
  label: string;
  labelEn?: string;
  start: string;
  end: string;
  hours: number;
  breakMinutes: number;
  cls: string;
}

export interface ShiftEmployee {
  id: string;
  name: string;
  office: string;
  tz: string;
  department: string;
  avatar: string;
  avatarUrl?: string;
}

export interface ShiftFilterState {
  search: string;
  office: string;
  department: string;
  status: string;
}

export interface ShiftKPIStats {
  today: number;
  scheduled: number;
  unassigned: number;
  open: number;
  conflicts: number;
}

export interface ShiftConflict {
  id: string;
  title: string;
  icon: string;
  text: string;
  meta: string;
}

export interface TimezoneHub {
  office: string;
  tz: string;
  hours: string;
  flag: string;
  isOpen?: boolean;
  time?: string;
}

export interface ActiveShiftDetail {
  name: string;
  dayIndex: number;
  key: string | null;
}

export type WeeklyScheduleMap = Record<string, (string | null)[]>;

