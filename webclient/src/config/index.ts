import { env } from './env';

export { env };

/**
 * StaffStream EMS - Global Configuration
 */
export const APP_CONFIG = {
  appName: env.appName,
  hospitalNameKh: 'មន្ទីរពេទ្យមិត្តភាពកម្ពុជា-ចិន ត្បូងឃ្មុំ',
  hospitalNameEn: 'Cambodia-China Friendship Tboung Khmum Hospital',
  version: '1.0.0',
  apiPrefix: env.apiUrl,
  defaultLocale: env.defaultLocale,
  defaultTheme: 'light',
  tokenKey: 'staffstream_token',
  userKey: 'staffstream_user',
  companyIdKey: 'staffstream_company_id',
  localeKey: 'staffstream_locale',
  themeKey: 'staffstream_theme',
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HR_MANAGER: 'hr_manager',
  HR_STAFF: 'hr_staff',
  DEPT_MANAGER: 'dept_manager',
  ACCOUNTANT: 'accountant',
  EMPLOYEE: 'employee',
} as const;

export default APP_CONFIG;

