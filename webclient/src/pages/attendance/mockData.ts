import { AttendanceRecordItem, AttendanceStatus, AttendanceExceptionType } from './types';

export interface GlobalHubOffice {
  office: string;
  country: string;
  region: string;
  tz: string;
  start: string;
}

export const GLOBAL_OFFICES: GlobalHubOffice[] = [
  { office: 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ', country: 'កម្ពុជា', region: 'ត្បូងឃ្មុំ', tz: 'ICT', start: '08:00' },
  { office: 'អគារសង្គ្រោះបន្ទាន់ & វះកាត់', country: 'កម្ពុជា', region: 'ត្បូងឃ្មុំ', tz: 'ICT', start: '07:00' },
  { office: 'អគារពិគ្រោះជំងឺក្រៅ (OPD)', country: 'កម្ពុជា', region: 'ត្បូងឃ្មុំ', tz: 'ICT', start: '07:30' },
  { office: 'អគារសម្ភព & មន្ទីរពិសោធន៍', country: 'កម្ពុជា', region: 'ត្បូងឃ្មុំ', tz: 'ICT', start: '08:00' },
];

export const DEPARTMENTS = [
  'ថ្នាក់ដឹកនាំមន្ទីរពេទ្យ (Executive)',
  'រដ្ឋបាល & បុគ្គលិក (HR & Admin)',
  'សង្គ្រោះបន្ទាន់ (Emergency / ER)',
  'វះកាត់ទូទៅ (Surgery)',
  'សម្ភព និងរោគស្ត្រី (OB/GYN)',
  'ជំងឺទូទៅ និងកុមារ (Pediatrics)',
  'ឱសថស្ថានមន្ទីរពេទ្យ (Pharmacy)',
  'មន្ទីរពិសោធន៍ (Laboratory)',
  'រូបភាពវេជ្ជសាស្ត្រ (Imaging / X-Ray)',
  'ប្រពោធនកម្ម (ICU)',
  'ពិគ្រោះជំងឺក្រៅ (OPD)',
  'ហិរញ្ញវត្ថុ & គណនេយ្យ (Finance)',
  'ព័ត៌មានវិទ្យា (IT Systems)',
  'ទន្តសាស្ត្រ (Dentistry)',
];

export const HOSPITAL_SHIFTS = [
  'វេនព្រឹក (07:00 - 15:00)',
  'វេនរសៀល (14:00 - 21:00)',
  'វេនយប់ប្រចាំការ (20:00 - 08:00)',
  'ម៉ោងរដ្ឋបាល (08:00 - 17:00)',
];

export interface HospitalEmployeeProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  shift: string;
  avatar?: string;
}

// ─── Hospital Staff: Exactly 1 HR (Chanthy Vorn), the rest are Medical & Operational Staff ───
export const HOSPITAL_STAFF_MEMBERS: HospitalEmployeeProfile[] = [
  { id: 'EMP-001', name: 'Sokha Meng', role: 'នាយកប្រតិបត្តិ (CEO)', department: 'ថ្នាក់ដឹកនាំមន្ទីរពេទ្យ (Executive)', shift: 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)' },
  { id: 'EMP-002', name: 'Chanthy Vorn', role: 'ប្រធានរដ្ឋបាល និងបុគ្គលិក', department: 'រដ្ឋបាល & បុគ្គលិក (HR & Admin)', shift: 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)' }, // << ONLY 1 HR
  { id: 'EMP-003', name: 'Chan Sokhum', role: 'វេជ្ជបណ្ឌិតសង្គ្រោះបន្ទាន់', department: 'សង្គ្រោះបន្ទាន់ (Emergency / ER)', shift: 'វេនព្រឹក (07:00 - 15:00)' },
  { id: 'EMP-004', name: 'Kim Sreyleak', role: 'គិលានុបដ្ឋាយិកាប្រចាំការ', department: 'សង្គ្រោះបន្ទាន់ (Emergency / ER)', shift: 'វេនរសៀល (14:00 - 21:00)' },
  { id: 'EMP-005', name: 'Ngeth Sovann', role: 'វេជ្ជបណ្ឌិតឯកទេសវះកាត់', department: 'វះកាត់ទូទៅ (Surgery)', shift: 'វេនព្រឹក (07:00 - 15:00)' },
  { id: 'EMP-006', name: 'Pich Chenda', role: 'គិលានុបដ្ឋាយិកាផ្នែកវះកាត់', department: 'វះកាត់ទូទៅ (Surgery)', shift: 'វេនព្រឹក (07:00 - 15:00)' },
  { id: 'EMP-007', name: 'Ouch Vicheth', role: 'វេជ្ជបណ្ឌិតឯកទេសសម្ភព', department: 'សម្ភព និងរោគស្ត្រី (OB/GYN)', shift: 'វេនយប់ប្រចាំការ (20:00 - 08:00)' },
  { id: 'EMP-008', name: 'Sreyneath Khem', role: 'ឆ្មបមន្ទីរពេទ្យជាន់ខ្ពស់', department: 'សម្ភព និងរោគស្ត្រី (OB/GYN)', shift: 'វេនព្រឹក (07:00 - 15:00)' },
  { id: 'EMP-009', name: 'Ly Vichet', role: 'ឱសថការីជាន់ខ្ពស់', department: 'ឱសថស្ថានមន្ទីរពេទ្យ (Pharmacy)', shift: 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)' },
  { id: 'EMP-010', name: 'Tep Kunthea', role: 'ឱសថការីគ្រប់គ្រងឃ្លាំង', department: 'ឱសថស្ថានមន្ទីរពេទ្យ (Pharmacy)', shift: 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)' },
  { id: 'EMP-011', name: 'Heng Visal', role: 'អ្នកបច្ចេកទេសមន្ទីរពិសោធន៍', department: 'មន្ទីរពិសោធន៍ (Laboratory)', shift: 'វេនព្រឹក (07:00 - 15:00)' },
  { id: 'EMP-012', name: 'Bopha Pich', role: 'អ្នកវិភាគឈាម និងជីវគីមី', department: 'មន្ទីរពិសោធន៍ (Laboratory)', shift: 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)' },
  { id: 'EMP-013', name: 'Som Sophearith', role: 'វេជ្ជបណ្ឌិតឯកទេសកុមារ', department: 'ជំងឺទូទៅ និងកុមារ (Pediatrics)', shift: 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)' },
  { id: 'EMP-014', name: 'Keo Phalla', role: 'គិលានុបដ្ឋាកកុមារ', department: 'ជំងឺទូទៅ និងកុមារ (Pediatrics)', shift: 'វេនរសៀល (14:00 - 21:00)' },
  { id: 'EMP-015', name: 'Kong Vanna', role: 'អ្នកបច្ចេកទេសកាំរស្មីអ៊ិច', department: 'រូបភាពវេជ្ជសាស្ត្រ (Imaging / X-Ray)', shift: 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)' },
  { id: 'EMP-016', name: 'Chea Rathana', role: 'គិលានុបដ្ឋាកប្រពោធនកម្ម (ICU)', department: 'ប្រពោធនកម្ម (ICU)', shift: 'វេនយប់ប្រចាំការ (20:00 - 08:00)' },
  { id: 'EMP-017', name: 'Kosal Som', role: 'គណនេយ្យករជាន់ខ្ពស់', department: 'ហិរញ្ញវត្ថុ & គណនេយ្យ (Finance)', shift: 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)' },
  { id: 'EMP-018', name: 'Ros Sitha', role: 'បេឡា និងគិតលុយ', department: 'ហិរញ្ញវត្ថុ & គណនេយ្យ (Finance)', shift: 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)' },
  { id: 'EMP-019', name: 'Rithy Dara', role: 'វិស្វករបច្ចេកវិទ្យាព័ត៌មាន (IT)', department: 'ព័ត៌មានវិទ្យា (IT Systems)', shift: 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)' },
  { id: 'EMP-020', name: 'Mao Sopheak', role: 'មន្ត្រីបញ្ជិកាអ្នកជំងឺ', department: 'ពិគ្រោះជំងឺក្រៅ (OPD)', shift: 'វេនព្រឹក (07:00 - 15:00)' },
  { id: 'EMP-021', name: 'Sun Dara', role: 'អ្នកបើកបររថយន្តសង្គ្រោះ', department: 'សង្គ្រោះបន្ទាន់ (Emergency / ER)', shift: 'វេនរសៀល (14:00 - 21:00)' },
  { id: 'EMP-022', name: 'Chhim Sophal', role: 'បុគ្គលិកអនាម័យ & សម្លាប់មេរោគ', department: 'សង្គ្រោះបន្ទាន់ (Emergency / ER)', shift: 'វេនព្រឹក (07:00 - 15:00)' },
  { id: 'EMP-023', name: 'Long Piseth', role: 'មន្ត្រីសន្តិសុខមន្ទីរពេទ្យ', department: 'សង្គ្រោះបន្ទាន់ (Emergency / ER)', shift: 'វេនយប់ប្រចាំការ (20:00 - 08:00)' },
  { id: 'EMP-024', name: 'Sovann Keo', role: 'ទន្តបណ្ឌិតឯកទេស', department: 'ទន្តសាស្ត្រ (Dentistry)', shift: 'ម៉ោងរដ្ឋបាល (08:00 - 17:00)' },
];

export const EMPLOYEE_NAMES = HOSPITAL_STAFF_MEMBERS.map((s) => s.name);

const STATUS_CYCLE: AttendanceStatus[] = [
  'Present',
  'Present',
  'Present',
  'Present',
  'Late',
  'Present',
  'Half Day',
  'Absent',
  'On Leave',
  'Present',
];

export function generateSmartHRAttendanceData(): AttendanceRecordItem[] {
  const currentDate = '12 វិច្ឆិកា 2026';
  const currentDateSort = '2026-11-12';

  return HOSPITAL_STAFF_MEMBERS.map((staff, idx) => {
    const status = STATUS_CYCLE[idx % STATUS_CYCLE.length];
    const isLate = status === 'Late';
    const isOff = status === 'Absent' || status === 'On Leave';

    // Shift times computation
    let baseInHour = 8;
    let baseInMin = 0;
    let baseOutHour = 17;
    let baseOutMin = 0;

    if (staff.shift.includes('07:00')) {
      baseInHour = 7;
      baseOutHour = 15;
    } else if (staff.shift.includes('14:00')) {
      baseInHour = 14;
      baseOutHour = 21;
    } else if (staff.shift.includes('20:00')) {
      baseInHour = 20;
      baseOutHour = 8;
    }

    // In time: usually 2-10 min early or late
    const inMin = isLate ? 12 + (idx % 20) : (58 + (idx % 5)) % 60;
    const inHour = isLate ? baseInHour : (inMin > 50 ? baseInHour - 1 : baseInHour);

    const checkIn = isOff
      ? '—'
      : `${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}`;

    // Out time:
    const outMin = (idx * 3 + 2) % 30;
    const checkOut = isOff || (idx === 0 && status === 'Present')
      ? '—'
      : `${String(baseOutHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')}`;

    // Working hours & overtime
    const workingHours = isOff
      ? '0h 00m'
      : status === 'Half Day'
      ? '4h 00m'
      : checkOut === '—'
      ? 'កំពុងបំពេញការងារ'
      : `${8 + (idx % 2)}h ${String((idx * 4) % 60).padStart(2, '0')}m`;

    const hasOvertime = idx % 5 === 0 && status === 'Present' && checkOut !== '—';
    const overtime = hasOvertime ? `+${1 + (idx % 2)}h 15m` : '—';

    let exception: AttendanceExceptionType = 'None';
    if (status === 'Late') {
      exception = 'Late Arrival';
    } else if (status === 'Present' && checkOut === '—' && idx === 0) {
      exception = 'None';
    } else if (status === 'Half Day') {
      exception = 'Early Departure';
    } else if (status === 'Absent') {
      exception = 'Missing Attendance';
    }

    const hasException = exception !== 'None';

    return {
      id: staff.id,
      name: staff.name,
      avatar: '',
      country: 'កម្ពុជា',
      office: 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ',
      region: 'ត្បូងឃ្មុំ',
      department: staff.department,
      shift: staff.shift,
      position: staff.role,
      dateLabel: currentDate,
      dateSort: currentDateSort,
      checkIn,
      checkOut,
      workingHours,
      overtime,
      status,
      exception,
      hasException,
      verificationMethod: isOff ? 'មិនបានស្កេន' : (idx % 3 === 0 ? 'Wi-Fi + GPS ត្រឹមត្រូវ' : 'Personal QR ត្រឹមត្រូវ'),
      notes: hasException ? `ករណីចាំបាច់ត្រូវត្រួតពិនិត្យ: ${exception}` : 'បានបំពេញវត្តមានពេញលេញតាមបទបញ្ជាផ្ទៃក្នុង',
      ipAddress: `192.168.1.${10 + (idx % 40)}`,
      device: idx % 2 === 0 ? 'ស្មាតហ្វូនផ្ទាល់ខ្លួន (Mobile Web QR)' : 'ស្មាតហ្វូនផ្ទាល់ខ្លួន (Android Chrome)',
    };
  });
}
