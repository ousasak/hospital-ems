import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Moon, RefreshCw, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { settingsService } from '@/services/settingsService';
import { useLocaleStore } from '@/stores/localeStore';
import { useThemeStore, type ColorPreset } from '@/stores/themeStore';
import { cn } from '@/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SettingsFormFooter } from './SettingsFormFooter';
import type { SystemSettingsMap } from '../types';

interface LocalizationFormState {
  organization_name: string;
  default_language: string;
}

const DEFAULT_LOCALIZATION: LocalizationFormState = {
  organization_name: '',
  default_language: 'km',
};

const COLOR_PRESETS: Array<{ id: ColorPreset; swatch: string }> = [
  { id: 'emerald', swatch: '#0f766e' },
  { id: 'blue', swatch: '#2563eb' },
  { id: 'violet', swatch: '#7c3aed' },
  { id: 'rose', swatch: '#e11d48' },
  { id: 'orange', swatch: '#ea580c' },
  { id: 'slate', swatch: '#475569' },
];

const CARD_CLS =
  'overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-card shadow-sm';

const FIELD_INPUT_CLS =
  'h-10 rounded-lg border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-950/30 text-sm text-foreground shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary';

const FIELD_LABEL_CLS = 'text-[13px] font-medium text-slate-700 dark:text-slate-300';

function normalizeLocalization(raw?: SystemSettingsMap): LocalizationFormState {
  if (!raw) return { ...DEFAULT_LOCALIZATION };
  const lang = raw.default_language === 'en' ? 'en' : 'km';
  return {
    organization_name: raw.organization_name ?? '',
    default_language: lang,
  };
}

interface LocalizationPreferencesSectionProps {
  canEdit: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}

export const LocalizationPreferencesSection: React.FC<LocalizationPreferencesSectionProps> = ({
  canEdit,
  onDirtyChange,
}) => {
  const { t, locale, setLocale } = useLocaleStore();
  const { theme, setTheme, colorPreset, setColorPreset } = useThemeStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<LocalizationFormState>(DEFAULT_LOCALIZATION);
  const [serverSnapshot, setServerSnapshot] = useState<LocalizationFormState>(DEFAULT_LOCALIZATION);
  const [errors, setErrors] = useState<Partial<Record<keyof LocalizationFormState, string>>>({});

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['system-settings-all'],
    queryFn: async () => await settingsService.getSettings(),
  });

  useEffect(() => {
    if (data !== undefined) {
      const normalized = normalizeLocalization(data);
      setForm(normalized);
      setServerSnapshot(normalized);
      setErrors({});
    }
  }, [data]);

  const isDirty = useMemo(() => {
    return (
      form.organization_name !== serverSnapshot.organization_name ||
      form.default_language !== serverSnapshot.default_language
    );
  }, [form, serverSnapshot]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await settingsService.updateSettings({
        organization_name: form.organization_name.trim(),
        default_language: form.default_language,
      });
    },
    onSuccess: () => {
      const saved: LocalizationFormState = {
        organization_name: form.organization_name.trim(),
        default_language: form.default_language,
      };
      setForm(saved);
      setServerSnapshot(saved);
      setErrors({});
      queryClient.invalidateQueries({ queryKey: ['system-settings-all'] });
      toast.success(t('settings.localization.saveSuccess'));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('settings.localization.saveError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || updateMutation.isPending) return;
    if (!form.organization_name.trim()) {
      setErrors({ organization_name: t('settings.validation.required') });
      return;
    }
    setErrors({});
    updateMutation.mutate();
  };

  const handleReset = () => {
    setForm({ ...serverSnapshot });
    setErrors({});
  };

  const activeLocaleNormalized = locale === 'en' ? 'en' : 'kh';
  const activePresetObj =
    COLOR_PRESETS.find((p) => p.id === colorPreset) ?? COLOR_PRESETS[0];

  return (
    <div className="space-y-6">
      {!canEdit && (
        <Alert variant="info" className="rounded-xl">
          <AlertDescription>{t('settings.common.readOnlyNotice')}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* ── Left Column: Server Defaults & Workspace Appearance ── */}
        <div className="xl:col-span-7 space-y-6">
          {/* Card 1: Server-persisted Organization Localization Defaults */}
          {isLoading ? (
            <Card className={CARD_CLS}>
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 space-y-1.5">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3.5 w-72" />
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-64 rounded-lg" />
              </CardContent>
            </Card>
          ) : isError ? (
            <Alert variant="destructive" className="rounded-xl">
              <AlertTitle>{t('settings.common.loadErrorTitle')}</AlertTitle>
              <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{t('settings.common.loadErrorDesc')}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{t('common.retry')}</span>
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Card className={CARD_CLS}>
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
                <CardTitle className="text-[15px] font-semibold text-foreground">
                  {t('settings.localization.systemDefaultsTitle')}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {t('settings.localization.systemDefaultsDesc')}
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit} noValidate>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="sys-org-name" className={FIELD_LABEL_CLS}>
                      {t('settings.localization.organizationDisplayName')}{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="sys-org-name"
                      value={form.organization_name}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, organization_name: e.target.value }));
                        if (errors.organization_name) {
                          setErrors({});
                        }
                      }}
                      placeholder={t('settings.localization.organizationDisplayNamePlaceholder')}
                      disabled={!canEdit}
                      aria-invalid={Boolean(errors.organization_name)}
                      className={`${FIELD_INPUT_CLS} ${
                        errors.organization_name
                          ? 'border-destructive focus-visible:ring-destructive/20'
                          : ''
                      }`}
                    />
                    {errors.organization_name ? (
                      <p className="text-xs text-destructive">{errors.organization_name}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {t('settings.localization.organizationDisplayNameHint')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 sm:max-w-xs">
                    <Label htmlFor="sys-default-lang" className={FIELD_LABEL_CLS}>
                      {t('settings.localization.defaultLanguage')}
                    </Label>
                    <Select
                      value={form.default_language}
                      onValueChange={(val) =>
                        setForm((prev) => ({ ...prev, default_language: val }))
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger id="sys-default-lang" className={FIELD_INPUT_CLS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="km">{t('settings.localization.langKhmer')}</SelectItem>
                        <SelectItem value="en">{t('settings.localization.langEnglish')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.localization.defaultLanguageHint')}
                    </p>
                  </div>
                </CardContent>

                <SettingsFormFooter
                  isDirty={isDirty}
                  isSaving={updateMutation.isPending}
                  readOnly={!canEdit}
                  onReset={handleReset}
                />
              </form>
            </Card>
          )}

          {/* Card 2: Local Workspace Appearance */}
          <Card className={CARD_CLS}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-[15px] font-semibold text-foreground">
                    {t('settings.localization.workspaceTitle')}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {t('settings.localization.workspaceDesc')}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="rounded-full font-normal text-xs shrink-0">
                  {t('settings.localization.workspaceBadge')}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* Active Interface Language */}
              <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <p className="text-[13px] font-medium text-foreground">
                    {t('settings.localization.activeLanguage')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.localization.activeLanguageDesc')}
                  </p>
                </div>

                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/70 p-1 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setLocale('kh')}
                    className={cn(
                      'rounded-md px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer',
                      activeLocaleNormalized === 'kh'
                        ? 'bg-white dark:bg-slate-900 text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t('settings.localization.langKhmer')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale('en')}
                    className={cn(
                      'rounded-md px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer',
                      activeLocaleNormalized === 'en'
                        ? 'bg-white dark:bg-slate-900 text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t('settings.localization.langEnglish')}
                  </button>
                </div>
              </div>

              {/* Theme Mode */}
              <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <p className="text-[13px] font-medium text-foreground">
                    {t('settings.localization.colorMode')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.localization.colorModeDesc')}
                  </p>
                </div>

                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/70 p-1 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer',
                      theme === 'light'
                        ? 'bg-white dark:bg-slate-900 text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>{t('settings.localization.lightMode')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer',
                      theme === 'dark'
                        ? 'bg-white dark:bg-slate-900 text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    <span>{t('settings.localization.darkMode')}</span>
                  </button>
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-3 px-6 py-5">
                <div className="space-y-0.5">
                  <p className="text-[13px] font-medium text-foreground">
                    {t('settings.localization.accentColor')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.localization.accentColorDesc')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = colorPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setColorPreset(preset.id)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                          isSelected
                            ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary/30'
                            : 'border-slate-200 dark:border-slate-700 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        )}
                      >
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: preset.swatch }}
                        />
                        <span>{t(`settings.localization.presets.${preset.id}`)}</span>
                        {isSelected && <Check className="h-3 w-3 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Live Interface Preview ── */}
        <div className="xl:col-span-5 xl:sticky xl:top-20">
          <Card className={CARD_CLS}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
              <CardTitle className="text-[15px] font-semibold text-foreground">
                {t('settings.localization.previewTitle')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('settings.localization.previewDesc')}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Interactive Mini App Preview */}
              <div
                className={cn(
                  'rounded-xl border p-4 transition-colors',
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-900 text-slate-100'
                    : 'border-slate-200 bg-slate-50/70 text-slate-900'
                )}
              >
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-current/10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-7 w-7 rounded-lg shrink-0"
                      style={{ backgroundColor: activePresetObj.swatch }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">
                        {form.organization_name || 'StaffStream EMS'}
                      </p>
                      <p className="text-[11px] opacity-60">
                        {activeLocaleNormalized === 'kh'
                          ? t('settings.localization.langKhmer')
                          : t('settings.localization.langEnglish')}
                      </p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white shrink-0"
                    style={{ backgroundColor: activePresetObj.swatch }}
                  >
                    {theme === 'dark'
                      ? t('settings.localization.darkMode')
                      : t('settings.localization.lightMode')}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="h-2.5 w-2/3 rounded bg-current/15" />
                  <div className="h-2 w-full rounded bg-current/10" />
                  <div className="h-2 w-4/5 rounded bg-current/10" />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white"
                    style={{ backgroundColor: activePresetObj.swatch }}
                  >
                    {t('settings.localization.previewPrimaryAction')}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-lg border px-3 py-1.5 text-[11px] font-medium',
                      theme === 'dark'
                        ? 'border-slate-700 text-slate-300'
                        : 'border-slate-200 bg-white text-slate-700'
                    )}
                  >
                    {t('settings.localization.previewSecondaryAction')}
                  </span>
                </div>
              </div>

              <dl className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-muted-foreground">
                    {t('settings.localization.defaultLanguage')}
                  </dt>
                  <dd className="font-medium text-foreground">
                    {form.default_language === 'en'
                      ? t('settings.localization.langEnglish')
                      : t('settings.localization.langKhmer')}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-muted-foreground">
                    {t('settings.localization.colorMode')}
                  </dt>
                  <dd className="font-medium text-foreground">
                    {theme === 'dark'
                      ? t('settings.localization.darkMode')
                      : t('settings.localization.lightMode')}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-muted-foreground">
                    {t('settings.localization.accentColor')}
                  </dt>
                  <dd className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: activePresetObj.swatch }}
                    />
                    <span>{t(`settings.localization.presets.${colorPreset}`)}</span>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LocalizationPreferencesSection;
