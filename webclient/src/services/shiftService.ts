import {
  ShiftEmployee,
  ShiftTemplate,
  ShiftConflict,
  WeeklyScheduleMap,
  TimezoneHub,
  ShiftKPIStats,
} from '@/pages/shifts/types';
import {
  EMPLOYEES,
  SHIFT_TEMPLATES,
  TIMEZONE_HUBS,
  INITIAL_CONFLICTS,
  getWeeklySchedule,
  updateEmployeeShift,
  copyWeekSchedule,
  batchAssignEmployeeSchedule,
} from '@/pages/shifts/mockData';
import { api } from '@/api/client';
import { getStartOfWeek, getTimezoneLiveTime } from '@/pages/shifts/utils/shiftCalculations';
import { employeeService } from './employeeService';

export const shiftService = {
  /**
   * Shift templates
   */
  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    try {
      const res = await api.get('/attendance/shifts');
      const rawShifts = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      if (rawShifts.length > 0) {
        return rawShifts.map((s: any) => ({
          key: s.code || `shift_${s.id}`,
          label: s.name,
          color: s.is_overnight ? '#8B5CF6' : (s.code?.includes('EVE') ? '#F59E0B' : '#3B82F6'),
          textColor: '#FFFFFF',
          hours: Number(s.full_day_hours) || 8,
          startTime: s.start_time?.slice(0, 5) || '08:00',
          endTime: s.end_time?.slice(0, 5) || '17:00',
        }));
      }
    } catch {
      // fallback
    }
    return SHIFT_TEMPLATES;
  },

  /**
   * Returns employees: first tries backend API, fallbacks to hospital shift employees
   */
  async getEmployees(): Promise<ShiftEmployee[]> {
    try {
      const res = await employeeService.getEmployees({ per_page: 50 });
      if (res && res.data && res.data.length > 0) {
        return res.data.map((emp: any, idx: number) => ({
          id: String(emp.id || `EMP-${idx + 1}`),
          name:
            emp.full_name_km ||
            emp.full_name_en ||
            `${emp.first_name || ''} ${emp.last_name || ''}`.trim() ||
            emp.name ||
            `Staff ${idx + 1}`,
          office:
            emp.primaryAssignment?.work_location?.name ||
            emp.work_location?.name ||
            emp.office ||
            'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ',
          tz: 'Asia/Phnom_Penh',
          department:
            emp.primaryAssignment?.department?.name ||
            emp.department?.name ||
            emp.department ||
            'ទូទៅ',
          avatar: emp.avatar_url || '',
          avatarUrl: emp.avatar_url || '',
        }));
      }
    } catch {
      // fallback to default
    }
    return EMPLOYEES;
  },

  /**
   * Fetches the weekly schedule board for a given week start (Synchronous)
   */
  getWeeklyRoster(weekStart: Date, employeeList?: ShiftEmployee[]): WeeklyScheduleMap {
    return getWeeklySchedule(weekStart, employeeList);
  },

  /**
   * Assigns or updates a shift for an employee on a given day
   */
  assignShift(
    weekStart: Date,
    employeeName: string,
    dayIndex: number,
    shiftKey: string | null
  ): WeeklyScheduleMap {
    return updateEmployeeShift(weekStart, employeeName, dayIndex, shiftKey);
  },

  /**
   * Copies entire schedule from one week to another
   */
  copyWeek(fromWeek: Date, toWeek: Date): WeeklyScheduleMap {
    return copyWeekSchedule(fromWeek, toWeek);
  },

  /**
   * Batch assigns a preset schedule pattern for an employee across the week
   */
  batchAssignEmployee(
    weekStart: Date,
    employeeName: string,
    pattern: 'office' | 'morning' | 'evening' | 'night' | 'clear'
  ): WeeklyScheduleMap {
    return batchAssignEmployeeSchedule(weekStart, employeeName, pattern);
  },

  /**
   * Computes KPI summary metrics matching SmartHR reference exact formula
   */
  computeKPIStats(
    schedule: WeeklyScheduleMap,
    weekStart: Date,
    conflictsCount: number,
    employees: ShiftEmployee[]
  ): ShiftKPIStats {
    const today = new Date();
    const isCurrentWeek =
      getStartOfWeek(today).getTime() === getStartOfWeek(weekStart).getTime();
    const todayDayIdx = today.getDay();

    let todayCount = 0;
    let unassignedCount = 0;
    const scheduledEmployees = new Set<string>();

    employees.forEach((emp) => {
      const days = schedule[emp.name] ?? [];
      days.forEach((key, dayIdx) => {
        if (key && key !== 'OFF') {
          scheduledEmployees.add(emp.name);
          if (
            (isCurrentWeek && dayIdx === todayDayIdx) ||
            (!isCurrentWeek && dayIdx === 1) // default Monday for demo week
          ) {
            todayCount++;
          }
        } else if (!key) {
          unassignedCount++;
        }
      });
    });

    return {
      today: todayCount,
      scheduled: scheduledEmployees.size,
      unassigned: unassignedCount,
      open: unassignedCount,
      conflicts: conflictsCount,
    };
  },

  /**
   * Timezone hub details with real-time clock
   */
  getTimezoneHubs(): TimezoneHub[] {
    return TIMEZONE_HUBS.map((hub) => {
      const live = getTimezoneLiveTime(hub.tz);
      return {
        ...hub,
        isOpen: live.isOpen,
        time: live.time,
      };
    });
  },

  /**
   * Initial shift conflicts list
   */
  getInitialConflicts(): ShiftConflict[] {
    return INITIAL_CONFLICTS;
  },
};

export default shiftService;
