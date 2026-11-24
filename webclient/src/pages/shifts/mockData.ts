import {
  ShiftEmployee,
  ShiftTemplate,
  TimezoneHub,
  ShiftConflict,
  WeeklyScheduleMap,
} from './types';
import { getStartOfWeek } from './utils/shiftCalculations';

export const SHIFT_TEMPLATES: ShiftTemplate[] = [
  {
    key: 'Morning',
    label: 'វេនព្រឹក',
    labelEn: 'Morning',
    start: '07:00',
    end: '15:00',
    hours: 8,
    breakMinutes: 45,
    cls: 'bg-teal-500/15 text-teal-800 dark:text-teal-200 border border-teal-500/30 hover:bg-teal-500/25',
  },
  {
    key: 'Day',
    label: 'វេនថ្ងៃ/រដ្ឋបាល',
    labelEn: 'Day / Office',
    start: '08:00',
    end: '17:00',
    hours: 8,
    breakMinutes: 60,
    cls: 'bg-sky-500/15 text-sky-800 dark:text-sky-200 border border-sky-500/30 hover:bg-sky-500/25',
  },
  {
    key: 'Evening',
    label: 'វេនរសៀល',
    labelEn: 'Evening',
    start: '14:00',
    end: '21:00',
    hours: 7,
    breakMinutes: 45,
    cls: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 hover:bg-amber-500/25',
  },
  {
    key: 'Night',
    label: 'វេនយប់ប្រចាំការ',
    labelEn: 'Night Duty',
    start: '20:00',
    end: '08:00',
    hours: 12,
    breakMinutes: 60,
    cls: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/25',
  },
];

export const getShiftTemplate = (key: string | null): ShiftTemplate | undefined =>
  SHIFT_TEMPLATES.find((t) => t.key === key);

export const EMPLOYEES: ShiftEmployee[] = [
  {
    id: 'EMP-01',
    name: 'Olivia Bennett',
    office: 'London',
    tz: 'Europe/London',
    department: 'Human Resources',
    avatar: 'avatar-01.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-02',
    name: 'Daniel Carter',
    office: 'New York',
    tz: 'America/New_York',
    department: 'Operations',
    avatar: 'avatar-02.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-03',
    name: 'Sophia Mitchell',
    office: 'Toronto',
    tz: 'America/Toronto',
    department: 'Finance',
    avatar: 'avatar-03.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-04',
    name: 'Matteo Rossi',
    office: 'Milan',
    tz: 'Europe/Rome',
    department: 'Engineering',
    avatar: 'avatar-04.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-05',
    name: 'Hannah Müller',
    office: 'Berlin',
    tz: 'Europe/Berlin',
    department: 'Engineering',
    avatar: 'avatar-05.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-06',
    name: 'Elena Garcia',
    office: 'Madrid',
    tz: 'Europe/Madrid',
    department: 'Sales',
    avatar: 'avatar-06.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-07',
    name: 'Liam Wilson',
    office: 'Sydney',
    tz: 'Australia/Sydney',
    department: 'Customer Support',
    avatar: 'avatar-07.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-08',
    name: 'Chloe Laurent',
    office: 'Paris',
    tz: 'Europe/Paris',
    department: 'Marketing',
    avatar: 'avatar-08.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-09',
    name: 'Kenji Tanaka',
    office: 'Tokyo',
    tz: 'Asia/Tokyo',
    department: 'IT',
    avatar: 'avatar-09.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-10',
    name: 'Aisha Rahman',
    office: 'Dubai',
    tz: 'Asia/Dubai',
    department: 'Administration',
    avatar: 'avatar-10.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-11',
    name: 'Lucas Martin',
    office: 'Amsterdam',
    tz: 'Europe/Amsterdam',
    department: 'Field Services',
    avatar: 'avatar-11.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-12',
    name: 'Emma Johansson',
    office: 'Stockholm',
    tz: 'Europe/Stockholm',
    department: 'Operations',
    avatar: 'avatar-12.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-13',
    name: 'Ethan Williams',
    office: 'New York',
    tz: 'America/New_York',
    department: 'Sales',
    avatar: 'avatar-13.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-14',
    name: 'Amelia Thompson',
    office: 'London',
    tz: 'Europe/London',
    department: 'Customer Support',
    avatar: 'avatar-14.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-15',
    name: 'Benjamin Clark',
    office: 'New York',
    tz: 'America/New_York',
    department: 'IT',
    avatar: 'avatar-19.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces',
  },
  {
    id: 'EMP-16',
    name: 'Mia Taylor',
    office: 'Sydney',
    tz: 'Australia/Sydney',
    department: 'Field Services',
    avatar: 'avatar-17.jpg',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces',
  },
];

export const TIMEZONE_HUBS: TimezoneHub[] = [
  { office: 'London', tz: 'Europe/London', hours: '08:00–16:00', flag: '🇬🇧' },
  { office: 'New York', tz: 'America/New_York', hours: '09:00–17:00', flag: '🇺🇸' },
  { office: 'Singapore', tz: 'Asia/Singapore', hours: '09:00–18:00', flag: '🇸🇬' },
  { office: 'Sydney', tz: 'Australia/Sydney', hours: '08:00–16:00', flag: '🇦🇺' },
  { office: 'Berlin', tz: 'Europe/Berlin', hours: '08:30–16:30', flag: '🇩🇪' },
  { office: 'Tokyo', tz: 'Asia/Tokyo', hours: '09:00–18:00', flag: '🇯🇵' },
];

export const INITIAL_CONFLICTS: ShiftConflict[] = [
  {
    id: 'c1',
    title: 'Overlapping Shifts',
    icon: 'CopyX',
    text: 'Matteo Rossi is scheduled for both Day and Evening shifts on Wednesday in Milan.',
    meta: 'Matteo Rossi · Milan',
  },
  {
    id: 'c2',
    title: 'Missing Assignments',
    icon: 'UserX',
    text: '3 shifts in the New York office have no employee assigned for Thursday.',
    meta: 'New York office',
  },
  {
    id: 'c3',
    title: 'Insufficient Staffing',
    icon: 'Users',
    text: 'Customer Support has only 1 employee scheduled during Sydney evening hours.',
    meta: 'Customer Support · Sydney',
  },
  {
    id: 'c4',
    title: 'Excessive Working Hours',
    icon: 'ClockAlert',
    text: 'Kenji Tanaka is scheduled for 6 consecutive days without a rest day.',
    meta: 'Kenji Tanaka · Tokyo',
  },
  {
    id: 'c5',
    title: 'Cross-Time-Zone Overlap',
    icon: 'Globe',
    text: 'A joint Berlin/Sydney handover shift overlaps outside both offices’ working hours.',
    meta: 'Berlin ↔ Sydney',
  },
];

export const ALL_OFFICES = [...new Set(EMPLOYEES.map((e) => e.office))].sort();
export const ALL_DEPARTMENTS = [
  ...new Set(EMPLOYEES.map((e) => e.department)),
].sort();

/**
 * Exact reference schedule matrix extracted from SmartHR production DOM
 * for reference week: Aug 30 – Sep 05, 2026
 */
export const EXACT_REFERENCE_SCHEDULE: WeeklyScheduleMap = {
  'Olivia Bennett': ['Night', null, 'Morning', 'Day', 'Evening', 'Night', null],
  'Daniel Carter': [null, null, null, 'OFF', 'Day', 'Day', null],
  'Sophia Mitchell': [null, 'Morning', 'Morning', 'Morning', 'Morning', 'Evening', null],
  'Matteo Rossi': [null, 'OFF', 'Evening', 'Night', 'Evening', 'Evening', 'Day'],
  'Hannah Müller': [null, 'Day', 'Day', 'OFF', 'Day', 'Morning', null],
  'Elena Garcia': [null, 'Morning', 'Day', 'Night', 'Night', 'Morning', null],
  'Liam Wilson': [null, 'Night', 'Day', 'Evening', null, 'Morning', null],
  'Chloe Laurent': [null, 'Morning', 'Evening', 'Night', 'Day', 'Night', 'Morning'],
  'Kenji Tanaka': [null, 'Evening', 'Evening', 'Night', 'OFF', 'Night', 'Night'],
  'Aisha Rahman': [null, 'Day', 'Morning', 'Night', 'Morning', 'Day', null],
  'Lucas Martin': [null, 'Evening', 'Night', 'Night', 'Evening', 'Day', null],
  'Emma Johansson': [null, 'Morning', 'Evening', 'Day', 'OFF', 'Day', null],
  'Ethan Williams': ['Evening', 'Evening', 'Morning', 'Morning', 'Morning', 'Morning', null],
  'Amelia Thompson': [null, 'Evening', 'Morning', 'Evening', 'OFF', 'Evening', 'Night'],
  'Benjamin Clark': ['Night', 'Day', 'Night', 'Night', 'Evening', 'Day', null],
  'Mia Taylor': [null, 'Evening', 'OFF', 'Night', 'Morning', 'Evening', null],
};

const scheduleCache = new Map<string, WeeklyScheduleMap>();
const cacheKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const STORAGE_PREFIX = 'staffstream_schedule_';

function loadCacheFromStorage(key: string): WeeklyScheduleMap | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error loading schedule from localStorage:', e);
  }
  return null;
}

function saveCacheToStorage(key: string, data: WeeklyScheduleMap) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    }
  } catch (e) {
    console.warn('Error saving schedule to localStorage:', e);
  }
}

// Default reference start date: Sunday August 30, 2026
export const DEFAULT_REFERENCE_START = getStartOfWeek(new Date(2026, 8, 4));

// Initialize default week in cache
scheduleCache.set(cacheKey(DEFAULT_REFERENCE_START), { ...EXACT_REFERENCE_SCHEDULE });

// Pseudorandom helper for other weeks
let seed = 42;
const pseudoRandom = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

export function getWeeklySchedule(
  weekStart: Date,
  employeeList?: ShiftEmployee[]
): WeeklyScheduleMap {
  const key = cacheKey(weekStart);
  let schedule = scheduleCache.get(key) || loadCacheFromStorage(key);

  if (!schedule) {
    // Check previous week to auto carry over shift roster
    const prevWeek = new Date(weekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    const prevKey = cacheKey(prevWeek);
    const prevSchedule = scheduleCache.get(prevKey) || loadCacheFromStorage(prevKey);

    if (prevSchedule && Object.keys(prevSchedule).length > 0) {
      schedule = {};
      Object.keys(prevSchedule).forEach((emp) => {
        schedule![emp] = [...prevSchedule[emp]];
      });
    } else {
      // Default to reference schedule so roster is rich and ready immediately
      schedule = { ...EXACT_REFERENCE_SCHEDULE };
    }
  }

  // Ensure every employee in the active list has a clean schedule
  const listToEnsure = employeeList && employeeList.length > 0 ? employeeList : EMPLOYEES;
  let hasNew = false;

  listToEnsure.forEach((emp, empIdx) => {
    if (!schedule![emp.name] || schedule![emp.name].length === 0) {
      hasNew = true;
      const mod = empIdx % 5;
      if (mod === 0) {
        // Standard Day shift (Mon-Fri)
        schedule![emp.name] = ['OFF', 'Day', 'Day', 'Day', 'Day', 'Day', 'OFF'];
      } else if (mod === 1) {
        // Morning shift (Mon-Fri)
        schedule![emp.name] = ['OFF', 'Morning', 'Morning', 'Morning', 'Morning', 'Morning', 'OFF'];
      } else if (mod === 2) {
        // Hospital weekend & weekday rotation
        schedule![emp.name] = ['Day', 'Day', 'OFF', 'Evening', 'Evening', 'Morning', 'OFF'];
      } else if (mod === 3) {
        // Night Duty rotation (Mon, Wed, Fri night, rest on other days)
        schedule![emp.name] = ['OFF', 'Night', 'OFF', 'Night', 'OFF', 'Night', 'OFF'];
      } else {
        // Evening & Day blend
        schedule![emp.name] = ['OFF', 'Evening', 'Day', 'Day', 'OFF', 'Evening', 'Morning'];
      }
    }
  });

  scheduleCache.set(key, schedule);
  if (hasNew) {
    saveCacheToStorage(key, schedule);
  }
  return schedule;
}

export function updateEmployeeShift(
  weekStart: Date,
  employeeName: string,
  dayIndex: number,
  shiftKey: string | null
): WeeklyScheduleMap {
  const current = { ...getWeeklySchedule(weekStart) };
  const empShifts = [...(current[employeeName] ?? Array(7).fill(null))];
  empShifts[dayIndex] = shiftKey;
  current[employeeName] = empShifts;

  const key = cacheKey(weekStart);
  scheduleCache.set(key, current);
  saveCacheToStorage(key, current);
  return current;
}

export function copyWeekSchedule(fromWeek: Date, toWeek: Date): WeeklyScheduleMap {
  const source = getWeeklySchedule(fromWeek);
  const target: WeeklyScheduleMap = {};
  Object.keys(source).forEach((emp) => {
    target[emp] = [...source[emp]];
  });
  const key = cacheKey(toWeek);
  scheduleCache.set(key, target);
  saveCacheToStorage(key, target);
  return target;
}

export function batchAssignEmployeeSchedule(
  weekStart: Date,
  employeeName: string,
  pattern: 'office' | 'morning' | 'evening' | 'night' | 'clear'
): WeeklyScheduleMap {
  const current = { ...getWeeklySchedule(weekStart) };
  let newDays: (string | null)[] = Array(7).fill(null);

  if (pattern === 'office') {
    // Sun: OFF, Mon-Fri: Day (08:00-17:00), Sat: OFF
    newDays = ['OFF', 'Day', 'Day', 'Day', 'Day', 'Day', 'OFF'];
  } else if (pattern === 'morning') {
    // Sun: OFF, Mon-Fri: Morning, Sat: OFF
    newDays = ['OFF', 'Morning', 'Morning', 'Morning', 'Morning', 'Morning', 'OFF'];
  } else if (pattern === 'evening') {
    newDays = ['OFF', 'Evening', 'Evening', 'Evening', 'Evening', 'Evening', 'OFF'];
  } else if (pattern === 'night') {
    // Night duty rotation: Sun OFF, Mon Night, Tue Rest, Wed Night, Thu Rest, Fri Night, Sat OFF
    newDays = ['OFF', 'Night', 'OFF', 'Night', 'OFF', 'Night', 'OFF'];
  } else if (pattern === 'clear') {
    newDays = Array(7).fill(null);
  }

  current[employeeName] = newDays;
  const key = cacheKey(weekStart);
  scheduleCache.set(key, current);
  saveCacheToStorage(key, current);
  return current;
}
