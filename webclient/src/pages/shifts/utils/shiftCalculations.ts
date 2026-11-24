/**
 * Shift Time & Business Logic Calculations
 */

export interface ShiftDurationResult {
  totalHours: number;
  breakHours: number;
  effectiveHours: number;
  isOvernight: boolean;
  formattedDuration: string;
}

/**
 * Calculates total and effective working hours between two times formatted as HH:MM.
 * Correctly accounts for shifts that cross midnight (overnight shifts).
 */
export function calculateShiftDuration(
  start: string,
  end: string,
  breakMinutes: number = 0
): ShiftDurationResult {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  const isOvernight = endMinutes <= startMinutes;
  if (isOvernight) {
    endMinutes += 24 * 60; // Add 24 hours
  }

  const totalMinutes = endMinutes - startMinutes;
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const breakHours = Math.round((breakMinutes / 60) * 10) / 10;
  const effectiveMinutes = Math.max(0, totalMinutes - breakMinutes);
  const effectiveHours = Math.round((effectiveMinutes / 60) * 10) / 10;

  const hoursPart = Math.floor(effectiveMinutes / 60);
  const minutesPart = effectiveMinutes % 60;
  const formattedDuration =
    minutesPart > 0 ? `${hoursPart}h ${minutesPart}m` : `${hoursPart}h`;

  return {
    totalHours,
    breakHours,
    effectiveHours,
    isOvernight,
    formattedDuration,
  };
}

/**
 * Normalized Sunday-start week helper matching SmartHR reference
 */
export function getStartOfWeek(date: Date): Date {
  const t = new Date(date);
  t.setDate(t.getDate() - t.getDay());
  t.setHours(0, 0, 0, 0);
  return t;
}

export const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MONTHS_KM = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
];

export const DAYS_ABBR_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAYS_ABBR_KM = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
export const DAYS_SHORT_KM = ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'];

// Backward compatibility
export const MONTHS = MONTHS_EN;
export const DAYS_ABBR = DAYS_ABBR_EN;

/**
 * Formats a 7-day week range:
 * In Khmer: "06 – 12 កញ្ញា 2026" or "30 សីហា – 05 កញ្ញា 2026"
 * In English: "Sep 06 – 12, 2026" or "Aug 30 – Sep 05, 2026"
 */
export function formatWeekRange(start: Date, locale: string = 'km'): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const pad = (n: number) => String(n).padStart(2, '0');
  const startDay = pad(start.getDate());
  const endDay = pad(end.getDate());
  const startMonthIdx = start.getMonth();
  const endMonthIdx = end.getMonth();
  const year = end.getFullYear();

  if (locale === 'km') {
    if (startMonthIdx === endMonthIdx) {
      return `${startDay} – ${endDay} ${MONTHS_KM[startMonthIdx]} ${year}`;
    }
    return `${startDay} ${MONTHS_KM[startMonthIdx]} – ${endDay} ${MONTHS_KM[endMonthIdx]} ${year}`;
  }

  // English
  if (startMonthIdx === endMonthIdx) {
    return `${MONTHS_EN[startMonthIdx]} ${startDay} – ${endDay}, ${year}`;
  }
  return `${MONTHS_EN[startMonthIdx]} ${startDay} – ${MONTHS_EN[endMonthIdx]} ${endDay}, ${year}`;
}

/**
 * Gets the live time and active business hours status for a timezone
 */
export function getTimezoneLiveTime(tz: string): { time: string; isOpen: boolean } {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const hour24 = parseInt(
      now.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour: 'numeric',
        hour12: false,
      }),
      10
    );

    return {
      time: timeStr,
      isOpen: hour24 >= 8 && hour24 < 18,
    };
  } catch (e) {
    return {
      time: '12:00 PM',
      isOpen: true,
    };
  }
}

