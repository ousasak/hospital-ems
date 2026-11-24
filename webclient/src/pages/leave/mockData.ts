import {
  LeaveEmployee,
  LeaveCategoryBalance,
  RegionalHoliday,
  LeaveRequestItem,
  LeaveCategoryType,
  LeaveStatus,
} from './types';

export const LEAVE_EMPLOYEES: LeaveEmployee[] = [
  {
    id: 'EMP-01',
    name: 'Olivia Bennett',
    country: 'United Kingdom',
    office: 'London',
    avatar: 'avatar-01.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces',
    department: 'Human Resources',
    employee_code: 'UK-0841',
  },
  {
    id: 'EMP-02',
    name: 'Daniel Carter',
    country: 'United States',
    office: 'New York',
    avatar: 'avatar-02.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
    department: 'Operations',
    employee_code: 'US-1029',
  },
  {
    id: 'EMP-03',
    name: 'Sophia Mitchell',
    country: 'Canada',
    office: 'Toronto',
    avatar: 'avatar-03.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    department: 'Finance',
    employee_code: 'CA-2201',
  },
  {
    id: 'EMP-04',
    name: 'Matteo Rossi',
    country: 'Italy',
    office: 'Milan',
    avatar: 'avatar-04.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
    department: 'Engineering',
    employee_code: 'IT-5510',
  },
  {
    id: 'EMP-05',
    name: 'Hannah Müller',
    country: 'Germany',
    office: 'Berlin',
    avatar: 'avatar-05.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces',
    department: 'Engineering',
    employee_code: 'DE-3042',
  },
  {
    id: 'EMP-06',
    name: 'Elena Garcia',
    country: 'Spain',
    office: 'Madrid',
    avatar: 'avatar-06.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces',
    department: 'Sales',
    employee_code: 'ES-4419',
  },
  {
    id: 'EMP-07',
    name: 'Liam Wilson',
    country: 'Australia',
    office: 'Sydney',
    avatar: 'avatar-07.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces',
    department: 'Customer Support',
    employee_code: 'AU-9102',
  },
  {
    id: 'EMP-08',
    name: 'Chloe Laurent',
    country: 'France',
    office: 'Paris',
    avatar: 'avatar-08.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces',
    department: 'Marketing',
    employee_code: 'FR-6721',
  },
  {
    id: 'EMP-09',
    name: 'Kenji Tanaka',
    country: 'Japan',
    office: 'Tokyo',
    avatar: 'avatar-09.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces',
    department: 'IT Infrastructure',
    employee_code: 'JP-3190',
  },
  {
    id: 'EMP-10',
    name: 'Aisha Rahman',
    country: 'UAE',
    office: 'Dubai',
    avatar: 'avatar-10.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
    department: 'Administration',
    employee_code: 'AE-5012',
  },
  {
    id: 'EMP-11',
    name: 'Lucas Martin',
    country: 'Netherlands',
    office: 'Amsterdam',
    avatar: 'avatar-11.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces',
    department: 'Field Services',
    employee_code: 'NL-8820',
  },
  {
    id: 'EMP-12',
    name: 'Emma Johansson',
    country: 'Sweden',
    office: 'Stockholm',
    avatar: 'avatar-12.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=faces',
    department: 'Operations',
    employee_code: 'SE-1193',
  },
  {
    id: 'EMP-13',
    name: 'Ethan Williams',
    country: 'United States',
    office: 'New York',
    avatar: 'avatar-13.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
    department: 'Sales',
    employee_code: 'US-7740',
  },
  {
    id: 'EMP-14',
    name: 'Amelia Thompson',
    country: 'United Kingdom',
    office: 'London',
    avatar: 'avatar-14.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    department: 'Customer Support',
    employee_code: 'UK-3921',
  },
  {
    id: 'EMP-15',
    name: 'Charlotte Dubois',
    country: 'France',
    office: 'Paris',
    avatar: 'avatar-15.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces',
    department: 'Design',
    employee_code: 'FR-8290',
  },
  {
    id: 'EMP-16',
    name: 'Alexander Schmidt',
    country: 'Germany',
    office: 'Berlin',
    avatar: 'avatar-16.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces',
    department: 'Engineering',
    employee_code: 'DE-4911',
  },
  {
    id: 'EMP-17',
    name: 'Mia Taylor',
    country: 'Australia',
    office: 'Sydney',
    avatar: 'avatar-17.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces',
    department: 'Field Services',
    employee_code: 'AU-2098',
  },
  {
    id: 'EMP-18',
    name: 'James Anderson',
    country: 'Canada',
    office: 'Toronto',
    avatar: 'avatar-18.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
    department: 'Logistics',
    employee_code: 'CA-7712',
  },
  {
    id: 'EMP-19',
    name: 'Benjamin Clark',
    country: 'United States',
    office: 'New York',
    avatar: 'avatar-19.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&h=120&fit=crop&crop=faces',
    department: 'IT',
    employee_code: 'US-9932',
  },
  {
    id: 'EMP-20',
    name: 'William Brown',
    country: 'United Kingdom',
    office: 'London',
    avatar: 'avatar-20.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces',
    department: 'Operations',
    employee_code: 'UK-6140',
  },
  {
    id: 'EMP-21',
    name: 'Isabella Rossi',
    country: 'Italy',
    office: 'Milan',
    avatar: 'avatar-21.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    department: 'Marketing',
    employee_code: 'IT-4019',
  },
  {
    id: 'EMP-22',
    name: 'Noah Anderson',
    country: 'Netherlands',
    office: 'Amsterdam',
    avatar: 'avatar-22.jpg',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces',
    department: 'Product Management',
    employee_code: 'NL-1025',
  },
];

export const INITIAL_LEAVE_BALANCES: LeaveCategoryBalance[] = [
  { type: 'Annual Leave', used: 742, total: 1240 },
  { type: 'Sick Leave', used: 318, total: 496 },
  { type: 'Personal Leave', used: 214, total: 372 },
  { type: 'Unpaid Leave', used: 38, total: 120 },
];

export const REGIONAL_HOLIDAYS: RegionalHoliday[] = [
  { country: 'កម្ពុជា 🇰🇭', name: 'ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ', date: '២៤ កញ្ញា ២០២៦' },
  { country: 'កម្ពុជា 🇰🇭', name: 'ពិធីបុណ្យភ្ជុំបិណ្ឌ', date: '១១ – ១៣ តុលា ២០២៦' },
  { country: 'កម្ពុជា 🇰🇭', name: 'ទិវារំលឹកព្រះបរមរតនកោដ្ឋ', date: '១៥ តុលា ២០២៦' },
  { country: 'កម្ពុជា 🇰🇭', name: 'ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិ', date: '២៩ តុលា ២០២៦' },
  { country: 'កម្ពុជា 🇰🇭', name: 'ពិធីបុណ្យឯករាជ្យជាតិ', date: '០៩ វិច្ឆិកា ២០២៦' },
  { country: 'កម្ពុជា 🇰🇭', name: 'ព្រះរាជពិធីបុណ្យអុំទូក បណ្តែតប្រទីប', date: '២៤ – ២៦ វិច្ឆិកា ២០២៦' },
  { country: 'កម្ពុជា 🇰🇭', name: 'ទិវាសន្តិភាពនៅកម្ពុជា', date: '២៩ ធ្នូ ២០២៦' },
];

/**
 * Deterministically generates the exact 26 SmartHR reference leave requests
 * replicating the pseudo-random seed generator from the original React bundle
 */
export function generateInitialLeaveRequests(): LeaveRequestItem[] {
  const leaveTypes: LeaveCategoryType[] = [
    'Annual Leave',
    'Sick Leave',
    'Personal Leave',
    'Unpaid Leave',
  ];
  const statuses: LeaveStatus[] = ['Pending', 'Approved', 'Rejected'];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const calculateDays = (start: Date, end: Date) =>
    Math.round((end.getTime() - start.getTime()) / 864e5) + 1;

  const requests: LeaveRequestItem[] = [];
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < 32; i++) {
    const emp = LEAVE_EMPLOYEES[i % LEAVE_EMPLOYEES.length];
    const type = leaveTypes[Math.floor(rand() * leaveTypes.length)];
    // Distribute nicely across previous month, current month, and next month
    const offset = Math.floor(rand() * 70) - 20;
    const startDate = new Date(currentYear, currentMonth, 1 + offset);
    const durationDays = 1 + Math.floor(rand() * 4);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays - 1);

    const status = statuses[Math.floor(rand() * statuses.length)];

    requests.push({
      id: `LV-${1000 + i}`,
      employee: emp.name,
      employeeId: emp.id,
      country: emp.country,
      office: emp.office,
      avatar: emp.avatar,
      avatarUrl: emp.avatarUrl,
      type,
      start: startDate,
      end: endDate,
      duration: Math.max(1, calculateDays(startDate, endDate)),
      status,
      reason: 'កិច្ចការបន្ទាន់ផ្ទាល់ខ្លួន',
      appliedDate: new Date(startDate.getTime() - 86400000 * 3).toISOString().split('T')[0],
      isHalfDay: i % 4 === 0,
      halfDayType: i % 4 === 0 ? (i % 2 === 0 ? 'morning' : 'afternoon') : undefined,
    });
  }

  return requests;
}

