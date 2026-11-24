/**
 * StaffStream EMS - Centralized Environment Configuration & Validation Module
 * Standardizes access to client-side environment variables with early validation and safe defaults.
 */

export type SupportedLocale = 'kh' | 'km' | 'en';

export interface EnvConfig {
  /**
   * Base URL for the Backend REST API (default: '/api/v1')
   */
  readonly apiUrl: string;

  /**
   * Application Display Name (default: 'StaffStream EMS')
   */
  readonly appName: string;

  /**
   * Default Locale for the Application ('km' or 'en', default: 'km')
   */
  readonly defaultLocale: SupportedLocale;

  /**
   * Current Application Mode ('development', 'production', 'test', etc.)
   */
  readonly mode: string;

  /**
   * True if running in development mode
   */
  readonly isDev: boolean;

  /**
   * True if running in production mode
   */
  readonly isProd: boolean;
}

/**
 * Validates and extracts environment configuration.
 * Exposes strongly typed, immutable settings while preventing secret exposure.
 */
function loadAndValidateEnv(): EnvConfig {
  const rawApiUrl = import.meta.env.VITE_API_URL;
  const rawAppName = import.meta.env.VITE_APP_NAME || import.meta.env.VITE_APP_TITLE;
  const rawDefaultLocale = import.meta.env.VITE_DEFAULT_LOCALE;

  // 1. Validate & Normalize API Base URL
  let apiUrl = '/api/v1';
  if (typeof rawApiUrl === 'string' && rawApiUrl.trim() !== '') {
    const trimmed = rawApiUrl.trim();
    if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      apiUrl = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
    } else {
      console.warn(
        `[EnvConfig] Invalid VITE_API_URL "${rawApiUrl}". Expected relative path or absolute HTTP(S) URL. Falling back to default "/api/v1".`
      );
    }
  }

  // 2. Validate & Normalize App Name
  let appName = 'StaffStream EMS';
  if (typeof rawAppName === 'string' && rawAppName.trim() !== '') {
    appName = rawAppName.trim();
  }

  // 3. Validate & Normalize Default Locale
  let defaultLocale: SupportedLocale = 'kh';
  if (rawDefaultLocale === 'en' || rawDefaultLocale === 'kh' || rawDefaultLocale === 'km') {
    defaultLocale = rawDefaultLocale as SupportedLocale;
  } else if (rawDefaultLocale) {
    console.warn(
      `[EnvConfig] Unsupported VITE_DEFAULT_LOCALE "${rawDefaultLocale}". Supported locales are "kh", "km" and "en". Falling back to "kh".`
    );
  }

  return Object.freeze({
    apiUrl,
    appName,
    defaultLocale,
    mode: import.meta.env.MODE || 'development',
    isDev: Boolean(import.meta.env.DEV),
    isProd: Boolean(import.meta.env.PROD),
  });
}

export const env: EnvConfig = loadAndValidateEnv();
export default env;

