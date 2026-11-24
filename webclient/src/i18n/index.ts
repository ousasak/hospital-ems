import { useLocaleStore, LocaleType } from '../stores/localeStore';
import { en, kh, km, dictionaries, TranslationDictionary } from './dictionaries';

export type { LocaleType, TranslationDictionary };
export { en, kh, km, dictionaries };

/**
 * Resolves a nested key string like "common.save" or "nav.dashboard"
 * against a dictionary object.
 */
export function resolveKey(obj: any, key: string): any {
  if (!obj || typeof obj !== 'object') return undefined;

  // Direct key lookup
  if (key in obj) {
    return obj[key];
  }

  // Nested path traversal (e.g. "common.save")
  const parts = key.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Interpolates variables in template strings:
 * Supports both {{count}} and {count} formats.
 */
export function interpolate(template: string, vars: Record<string, any>): string {
  if (!template || typeof template !== 'string' || !vars) return template;

  let result = template;
  for (const [k, v] of Object.entries(vars)) {
    if (k === 'defaultValue') continue;
    const val = String(v ?? '');
    // Replace {{key}}
    result = result.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), val);
    // Replace {key}
    result = result.replace(new RegExp(`(?<!{){\\s*${k}\\s*}(?!})`, 'g'), val);
  }
  return result;
}

/**
 * Universal translation resolver function
 */
export function translate(
  key: string,
  defaultValueOrOptions?: string | { defaultValue?: string; [k: string]: any },
  explicitLocale?: LocaleType
): string {
  const currentLocale = explicitLocale || useLocaleStore.getState().locale || 'kh';
  const dict = dictionaries[currentLocale] || dictionaries.kh || dictionaries.km;
  const fallbackDict = dictionaries.en;

  let defaultValue: string | undefined;
  let templateVars: Record<string, any> = {};

  if (typeof defaultValueOrOptions === 'string') {
    defaultValue = defaultValueOrOptions;
  } else if (defaultValueOrOptions && typeof defaultValueOrOptions === 'object') {
    defaultValue = defaultValueOrOptions.defaultValue;
    templateVars = defaultValueOrOptions;
  }

  let text = resolveKey(dict, key);

  // Fallback to English dictionary if key is missing in primary
  if (text === undefined || text === null) {
    text = resolveKey(fallbackDict, key);
  }

  // Fallback to explicit default value or key
  if (text === undefined || text === null || typeof text !== 'string') {
    text = defaultValue !== undefined ? defaultValue : key;
  }

  // Apply template variables
  if (typeof text === 'string' && Object.keys(templateVars).length > 0) {
    text = interpolate(text, templateVars);
  }

  return text;
}

export const translateString = (str: string, locale?: LocaleType): string => {
  return translate(str, str, locale);
};

/**
 * Hook conforming to react-i18next useTranslation API
 */
export const useTranslation = (_namespaces?: string[] | string) => {
  const { locale } = useLocaleStore();

  const t = (
    key: string,
    defaultValueOrOptions?: string | { defaultValue?: string; [k: string]: any },
    _maybeOptions?: any
  ): string => {
    return translate(key, defaultValueOrOptions, locale);
  };

  return {
    t,
    i18n: {
      language: locale,
      changeLanguage: (lng: LocaleType) => useLocaleStore.getState().setLocale(lng),
    },
  };
};

/**
 * Hook for language state & switching
 */
export const useLanguage = () => {
  const { locale, setLocale, t } = useLocaleStore();
  const isKhmer = locale === 'kh' || locale === 'km';

  return {
    locale,
    setLocale,
    isKhmer,
    t,
  };
};

export default {
  translate,
  translateString,
  useTranslation,
  useLanguage,
};
