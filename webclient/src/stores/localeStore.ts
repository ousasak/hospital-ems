import { create } from 'zustand';
import { env } from '../config/env';
import { en, kh, km, TranslationDictionary, dictionaries } from '../i18n/dictionaries';

export type LocaleType = 'kh' | 'km' | 'en';
export type { TranslationDictionary };

export type TranslationFunction = {
  (
    key: string,
    defaultValueOrOptions?: string | { defaultValue?: string; [k: string]: any },
    _maybeOptions?: any
  ): string;
} & TranslationDictionary;

export function createTFunction(locale: LocaleType): TranslationFunction {
  const dict = locale === 'en' ? (en as TranslationDictionary) : kh;
  const fallbackDict = en as TranslationDictionary;

  const fn = (
    key: string,
    defaultValueOrOptions?: string | { defaultValue?: string; [k: string]: any },
    _maybeOptions?: any
  ): string => {
    let defaultValue: string | undefined;
    let templateVars: Record<string, any> = {};

    if (typeof defaultValueOrOptions === 'string') {
      defaultValue = defaultValueOrOptions;
    } else if (defaultValueOrOptions && typeof defaultValueOrOptions === 'object') {
      defaultValue = defaultValueOrOptions.defaultValue;
      templateVars = defaultValueOrOptions;
    }

    // Try direct key first
    let current: any = (dict as any)[key];

    // Try resolving dotted path
    if (current === undefined) {
      const parts = key.split('.');
      current = dict;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          current = undefined;
          break;
        }
      }
    }

    // Fallback to English dictionary
    if (current === undefined) {
      current = (fallbackDict as any)[key];
      if (current === undefined) {
        const parts = key.split('.');
        current = fallbackDict;
        for (const part of parts) {
          if (current && typeof current === 'object' && part in current) {
            current = current[part];
          } else {
            current = undefined;
            break;
          }
        }
      }
    }

    let text = typeof current === 'string' ? current : (defaultValue !== undefined ? defaultValue : key);

    if (typeof text === 'string' && Object.keys(templateVars).length > 0) {
      for (const [k, v] of Object.entries(templateVars)) {
        if (k === 'defaultValue') continue;
        const val = String(v ?? '');
        text = text.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), val);
        text = text.replace(new RegExp(`(?<!{){\\s*${k}\\s*}(?!})`, 'g'), val);
      }
    }

    return text;
  };

  return Object.assign(fn, dict) as TranslationFunction;
}

interface LocaleState {
  locale: LocaleType;
  t: TranslationFunction;
  setLocale: (locale: LocaleType) => void;
}

export const useLocaleStore = create<LocaleState>((set) => {
  const saved = localStorage.getItem('staffstream_locale') as LocaleType | null;
  const initialLocale: LocaleType =
    saved === 'kh' || saved === 'km' || saved === 'en'
      ? saved
      : (env.defaultLocale as LocaleType) || 'kh';

  return {
    locale: initialLocale,
    t: createTFunction(initialLocale),
    setLocale: (locale) => {
      localStorage.setItem('staffstream_locale', locale);
      set({
        locale,
        t: createTFunction(locale),
      });
    },
  };
});
