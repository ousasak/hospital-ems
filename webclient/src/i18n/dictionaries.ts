// EN JSON modules
import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enMessages from './locales/en/messages.json';
import enEmployees from './locales/en/employees.json';
import enDocuments from './locales/en/documents.json';
import enDashboard from './locales/en/dashboard.json';
import enAttendance from './locales/en/attendance.json';
import enShifts from './locales/en/shifts.json';
import enLeaves from './locales/en/leaves.json';
import enPayroll from './locales/en/payroll.json';
import enOrganization from './locales/en/organization.json';
import enRecruitment from './locales/en/recruitment.json';
import enPerformance from './locales/en/performance.json';
import enReports from './locales/en/reports.json';
import enUsers from './locales/en/users.json';
import enSettings from './locales/en/settings.json';
import enAssignments from './locales/en/assignments.json';
import enAuth from './locales/en/auth.json';

// KH JSON modules
import khCommon from './locales/kh/common.json';
import khNavigation from './locales/kh/navigation.json';
import khMessages from './locales/kh/messages.json';
import khEmployees from './locales/kh/employees.json';
import khDocuments from './locales/kh/documents.json';
import khDashboard from './locales/kh/dashboard.json';
import khAttendance from './locales/kh/attendance.json';
import khShifts from './locales/kh/shifts.json';
import khLeaves from './locales/kh/leaves.json';
import khPayroll from './locales/kh/payroll.json';
import khOrganization from './locales/kh/organization.json';
import khRecruitment from './locales/kh/recruitment.json';
import khPerformance from './locales/kh/performance.json';
import khReports from './locales/kh/reports.json';
import khUsers from './locales/kh/users.json';
import khSettings from './locales/kh/settings.json';
import khAssignments from './locales/kh/assignments.json';
import khAuth from './locales/kh/auth.json';

export const en = {
  ...enCommon,
  ...enNavigation,
  ...enMessages,
  common: enCommon.common,
  status: enCommon.status,
  filters: enCommon.filters,
  buttons: enCommon.buttons,
  pagination: enCommon.pagination,
  tables: enCommon.tables,
  confirm: enCommon.confirm,
  theme: enCommon.theme,
  nav: enNavigation.nav,
  header: enNavigation.header,
  userMenu: enNavigation.userMenu,
  command: enNavigation.command,
  navigation: enNavigation.navigation,
  toast: enMessages.toast,
  notifications: enMessages.notifications,
  messages: enMessages,
  employees: enEmployees,
  documents: enDocuments,
  dashboard: enDashboard,
  attendance: enAttendance,
  shifts: enShifts,
  leaves: enLeaves,
  payroll: enPayroll,
  organization: enOrganization,
  recruitment: enRecruitment,
  performance: enPerformance,
  reports: enReports,
  users: enUsers,
  settings: enSettings,
  assignments: enAssignments,
  auth: enAuth,
};

export const kh = {
  ...khCommon,
  ...khNavigation,
  ...khMessages,
  common: khCommon.common,
  status: khCommon.status,
  filters: khCommon.filters,
  buttons: khCommon.buttons,
  pagination: khCommon.pagination,
  tables: khCommon.tables,
  confirm: khCommon.confirm,
  theme: khCommon.theme,
  nav: khNavigation.nav,
  header: khNavigation.header,
  userMenu: khNavigation.userMenu,
  command: khNavigation.command,
  navigation: khNavigation.navigation,
  toast: khMessages.toast,
  notifications: khMessages.notifications,
  messages: khMessages,
  employees: khEmployees,
  documents: khDocuments,
  dashboard: khDashboard,
  attendance: khAttendance,
  shifts: khShifts,
  leaves: khLeaves,
  payroll: khPayroll,
  organization: khOrganization,
  recruitment: khRecruitment,
  performance: khPerformance,
  reports: khReports,
  users: khUsers,
  settings: khSettings,
  assignments: khAssignments,
  auth: khAuth,
};

// Aliased to kh for backwards compatibility
export const km = kh;

export type TranslationDictionary = typeof kh;

export const dictionaries: Record<string, TranslationDictionary> = {
  en: en as TranslationDictionary,
  kh: kh,
  km: kh,
};

export default dictionaries;
