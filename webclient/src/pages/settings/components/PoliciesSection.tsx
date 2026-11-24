import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { settingsService } from '@/services/settingsService';
import { useLocaleStore } from '@/stores/localeStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

interface PolicyFormState {
  grace_period_minutes: string;
  min_punch_interval_minutes: string;
  early_checkin_window_minutes: string;
  allow_unscheduled_punch: boolean;
  enable_qr_attendance: boolean;
  default_currency: string;
  usd_khr_exchange_rate: string;
}

const DEFAULT_POLICIES: PolicyFormState = {
  grace_period_minutes: '15',
  min_punch_interval_minutes: '5',
  early_checkin_window_minutes: '60',
  allow_unscheduled_punch: true,
  enable_qr_attendance: true,
  default_currency: 'USD',
  usd_khr_exchange_rate: '4100',
};

const CARD_CLS =
  'overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-card shadow-sm';

const FIELD_INPUT_CLS =
  'h-10 rounded-lg border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-950/30 text-sm text-foreground shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary';

const FIELD_LABEL_CLS = 'text-[13px] font-medium text-slate-700 dark:text-slate-300';

function normalizePolicies(raw?: SystemSettingsMap): PolicyFormState {
  if (!raw) return { ...DEFAULT_POLICIES };
  const qrRaw = String(raw.enable_qr_attendance ?? 'true').toLowerCase();
  const unscheduledRaw = String(raw.allow_unscheduled_punch ?? 'true').toLowerCase();
  return {
    grace_period_minutes: String(raw.grace_period_minutes ?? '15'),
    min_punch_interval_minutes: String(raw.min_punch_interval_minutes ?? '5'),
    early_checkin_window_minutes: String(raw.early_checkin_window_minutes ?? '60'),
    allow_unscheduled_punch: unscheduledRaw === 'true' || unscheduledRaw === '1',
    enable_qr_attendance: qrRaw === 'true' || qrRaw === '1',
    default_currency: raw.default_currency || 'USD',
    usd_khr_exchange_rate: String(raw.usd_khr_exchange_rate ?? '4100'),
  };
}

interface PoliciesSectionProps {
  canEdit: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}

export const PoliciesSection: React.FC<PoliciesSectionProps> = ({
  canEdit,
  onDirtyChange,
}) => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PolicyFormState>(DEFAULT_POLICIES);
  const [serverSnapshot, setServerSnapshot] = useState<PolicyFormState>(DEFAULT_POLICIES);
  const [errors, setErrors] = useState<Partial<Record<keyof PolicyFormState, string>>>({});

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['system-settings-all'],
    queryFn: async () => await settingsService.getSettings(),
  });

  useEffect(() => {
    if (data !== undefined) {
      const normalized = normalizePolicies(data);
      setForm(normalized);
      setServerSnapshot(normalized);
      setErrors({});
    }
  }, [data]);

  const isDirty = useMemo(() => {
    return (
      form.grace_period_minutes !== serverSnapshot.grace_period_minutes ||
      form.min_punch_interval_minutes !== serverSnapshot.min_punch_interval_minutes ||
      form.early_checkin_window_minutes !== serverSnapshot.early_checkin_window_minutes ||
      form.allow_unscheduled_punch !== serverSnapshot.allow_unscheduled_punch ||
      form.enable_qr_attendance !== serverSnapshot.enable_qr_attendance ||
      form.default_currency !== serverSnapshot.default_currency ||
      form.usd_khr_exchange_rate !== serverSnapshot.usd_khr_exchange_rate
    );
  }, [form, serverSnapshot]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof PolicyFormState, string>> = {};

    const graceNum = Number(form.grace_period_minutes);
    if (
      form.grace_period_minutes.trim() === '' ||
      !Number.isInteger(graceNum) ||
      graceNum < 0 ||
      graceNum > 180
    ) {
      nextErrors.grace_period_minutes = t('settings.validation.gracePeriodRange');
    }

    const intervalNum = Number(form.min_punch_interval_minutes);
    if (
      form.min_punch_interval_minutes.trim() === '' ||
      !Number.isInteger(intervalNum) ||
      intervalNum < 0 ||
      intervalNum > 120
    ) {
      nextErrors.min_punch_interval_minutes = 'ត្រូវជាចំនួនគត់ចន្លោះពី ០ ដល់ ១២០ នាទី';
    }

    const earlyNum = Number(form.early_checkin_window_minutes);
    if (
      form.early_checkin_window_minutes.trim() === '' ||
      !Number.isInteger(earlyNum) ||
      earlyNum < 0 ||
      earlyNum > 240
    ) {
      nextErrors.early_checkin_window_minutes = 'ត្រូវជាចំនួនគត់ចន្លោះពី ០ ដល់ ២៤០ នាទី';
    }

    const rateNum = Number(form.usd_khr_exchange_rate);
    if (
      form.usd_khr_exchange_rate.trim() === '' ||
      Number.isNaN(rateNum) ||
      rateNum <= 0
    ) {
      nextErrors.usd_khr_exchange_rate = t('settings.validation.exchangeRatePositive');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        grace_period_minutes: String(Math.trunc(Number(form.grace_period_minutes))),
        min_punch_interval_minutes: String(Math.trunc(Number(form.min_punch_interval_minutes))),
        early_checkin_window_minutes: String(Math.trunc(Number(form.early_checkin_window_minutes))),
        allow_unscheduled_punch: form.allow_unscheduled_punch ? 'true' : 'false',
        enable_qr_attendance: form.enable_qr_attendance ? 'true' : 'false',
        default_currency: form.default_currency || 'USD',
        usd_khr_exchange_rate: String(Number(form.usd_khr_exchange_rate)),
      };
      return await settingsService.updateSettings(payload);
    },
    onSuccess: () => {
      const saved: PolicyFormState = {
        grace_period_minutes: String(Math.trunc(Number(form.grace_period_minutes))),
        min_punch_interval_minutes: String(Math.trunc(Number(form.min_punch_interval_minutes))),
        early_checkin_window_minutes: String(Math.trunc(Number(form.early_checkin_window_minutes))),
        allow_unscheduled_punch: form.allow_unscheduled_punch,
        enable_qr_attendance: form.enable_qr_attendance,
        default_currency: form.default_currency || 'USD',
        usd_khr_exchange_rate: String(Number(form.usd_khr_exchange_rate)),
      };
      setForm(saved);
      setServerSnapshot(saved);
      setErrors({});
      queryClient.invalidateQueries({ queryKey: ['system-settings-all'] });
      toast.success(t('settings.policies.saveSuccess'));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('settings.policies.saveError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || updateMutation.isPending) return;
    if (!validate()) return;
    updateMutation.mutate();
  };

  const handleReset = () => {
    setForm({ ...serverSnapshot });
    setErrors({});
  };

  const numericRate = Number(form.usd_khr_exchange_rate);
  const hasValidRate = !Number.isNaN(numericRate) && numericRate > 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        <div className="xl:col-span-7 space-y-6">
          <Card className={CARD_CLS}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-5">
          <Card className={CARD_CLS}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
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
    );
  }

  const conversionSamples = [1, 10, 100, 1000];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {!canEdit && (
        <Alert variant="info" className="rounded-xl">
          <AlertDescription>{t('settings.common.readOnlyNotice')}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* ── Left Column: Attendance & Finance Cards ── */}
        <div className="xl:col-span-7 space-y-6">
          {/* Card 1: Attendance Rules */}
          <Card className={CARD_CLS}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
              <CardTitle className="text-[15px] font-semibold text-foreground">
                {t('settings.policies.attendanceSection')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('settings.policies.attendanceDesc')}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Grace Period */}
                <div className="space-y-2">
                  <Label htmlFor="grace-period" className={FIELD_LABEL_CLS}>
                    {t('settings.policies.gracePeriod', 'នាទីអនុគ្រោះពេលចូល')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="grace-period"
                      type="number"
                      min={0}
                      max={180}
                      step={1}
                      value={form.grace_period_minutes}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, grace_period_minutes: e.target.value }));
                        if (errors.grace_period_minutes) {
                          setErrors((prev) => ({ ...prev, grace_period_minutes: undefined }));
                        }
                      }}
                      disabled={!canEdit}
                      aria-invalid={Boolean(errors.grace_period_minutes)}
                      className={`${FIELD_INPUT_CLS} pr-16 font-mono ${
                        errors.grace_period_minutes
                          ? 'border-destructive focus-visible:ring-destructive/20'
                          : ''
                      }`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {t('settings.policies.gracePeriodUnit', 'នាទី')}
                    </span>
                  </div>
                  {errors.grace_period_minutes ? (
                    <p className="text-xs text-destructive">{errors.grace_period_minutes}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t('settings.policies.gracePeriodHint', 'រយៈពេលអនុគ្រោះមុនពេលចាត់ទុកថាមកយឺត')}
                    </p>
                  )}
                </div>

                {/* 2. Min Punch Interval / Cooldown */}
                <div className="space-y-2">
                  <Label htmlFor="min-punch-interval" className={FIELD_LABEL_CLS}>
                    {t('settings.policies.minPunchInterval', 'ទប់ស្កាត់ស្កេនច្រឡំ (Cooldown)')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="min-punch-interval"
                      type="number"
                      min={0}
                      max={120}
                      step={1}
                      value={form.min_punch_interval_minutes}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, min_punch_interval_minutes: e.target.value }));
                        if (errors.min_punch_interval_minutes) {
                          setErrors((prev) => ({ ...prev, min_punch_interval_minutes: undefined }));
                        }
                      }}
                      disabled={!canEdit}
                      aria-invalid={Boolean(errors.min_punch_interval_minutes)}
                      className={`${FIELD_INPUT_CLS} pr-16 font-mono ${
                        errors.min_punch_interval_minutes
                          ? 'border-destructive focus-visible:ring-destructive/20'
                          : ''
                      }`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {t('settings.policies.gracePeriodUnit', 'នាទី')}
                    </span>
                  </div>
                  {errors.min_punch_interval_minutes ? (
                    <p className="text-xs text-destructive">{errors.min_punch_interval_minutes}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t('settings.policies.minPunchIntervalHint', 'គម្លាតនាទីអប្បបរមារវាងការចុះចូល និងចេញ')}
                    </p>
                  )}
                </div>

                {/* 3. Early Check-in Window */}
                <div className="space-y-2">
                  <Label htmlFor="early-checkin-window" className={FIELD_LABEL_CLS}>
                    {t('settings.policies.earlyCheckinWindow', 'អនុញ្ញាតស្កេនមុនវេន')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="early-checkin-window"
                      type="number"
                      min={0}
                      max={240}
                      step={1}
                      value={form.early_checkin_window_minutes}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, early_checkin_window_minutes: e.target.value }));
                        if (errors.early_checkin_window_minutes) {
                          setErrors((prev) => ({ ...prev, early_checkin_window_minutes: undefined }));
                        }
                      }}
                      disabled={!canEdit}
                      aria-invalid={Boolean(errors.early_checkin_window_minutes)}
                      className={`${FIELD_INPUT_CLS} pr-16 font-mono ${
                        errors.early_checkin_window_minutes
                          ? 'border-destructive focus-visible:ring-destructive/20'
                          : ''
                      }`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {t('settings.policies.gracePeriodUnit', 'នាទី')}
                    </span>
                  </div>
                  {errors.early_checkin_window_minutes ? (
                    <p className="text-xs text-destructive">{errors.early_checkin_window_minutes}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t('settings.policies.earlyCheckinWindowHint', 'ចំនួននាទីច្រើនបំផុតដែលអាចស្កេនមុនម៉ោងវេន')}
                    </p>
                  )}
                </div>
              </div>

              {/* Switches */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="allow-unscheduled-punch"
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      {t('settings.policies.allowUnscheduledPunch', 'អនុញ្ញាតឱ្យស្កេនក្រៅវេនកំណត់ (Unscheduled)')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.policies.allowUnscheduledPunchDesc', 'អនុញ្ញាតឱ្យបុគ្គលិកចុះវត្តមានទោះបីជាគ្មានវេនការងារផ្លូវការនៅថ្ងៃនោះ (សមរម្យសម្រាប់វេនបន្ទាន់)')}
                    </p>
                  </div>
                  <Switch
                    id="allow-unscheduled-punch"
                    checked={form.allow_unscheduled_punch}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, allow_unscheduled_punch: checked }))
                    }
                    disabled={!canEdit}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="enable-qr-attendance"
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      {t('settings.policies.enableQrAttendance')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.policies.enableQrAttendanceDesc')}
                    </p>
                  </div>
                  <Switch
                    id="enable-qr-attendance"
                    checked={form.enable_qr_attendance}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, enable_qr_attendance: checked }))
                    }
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Currency & Exchange Rate */}
          <Card className={CARD_CLS}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
              <CardTitle className="text-[15px] font-semibold text-foreground">
                {t('settings.policies.financeSection')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('settings.policies.financeDesc')}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="policy-currency" className={FIELD_LABEL_CLS}>
                    {t('settings.policies.defaultCurrency')}
                  </Label>
                  <Select
                    value={form.default_currency || 'USD'}
                    onValueChange={(val) =>
                      setForm((prev) => ({ ...prev, default_currency: val }))
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger id="policy-currency" className={FIELD_INPUT_CLS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">{t('settings.org.currencies.USD')}</SelectItem>
                      <SelectItem value="KHR">{t('settings.org.currencies.KHR')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exchange-rate" className={FIELD_LABEL_CLS}>
                    {t('settings.policies.exchangeRate')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="exchange-rate"
                      type="number"
                      min={1}
                      step="any"
                      value={form.usd_khr_exchange_rate}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          usd_khr_exchange_rate: e.target.value,
                        }));
                        if (errors.usd_khr_exchange_rate) {
                          setErrors((prev) => ({ ...prev, usd_khr_exchange_rate: undefined }));
                        }
                      }}
                      disabled={!canEdit}
                      aria-invalid={Boolean(errors.usd_khr_exchange_rate)}
                      className={`${FIELD_INPUT_CLS} pr-14 font-mono ${
                        errors.usd_khr_exchange_rate
                          ? 'border-destructive focus-visible:ring-destructive/20'
                          : ''
                      }`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      KHR
                    </span>
                  </div>
                  {errors.usd_khr_exchange_rate ? (
                    <p className="text-xs text-destructive">{errors.usd_khr_exchange_rate}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t('settings.policies.exchangeRateHint')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Live Policy Summary & Conversion Table ── */}
        <div className="xl:col-span-5 xl:sticky xl:top-20">
          <Card className={CARD_CLS}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
              <CardTitle className="text-[15px] font-semibold text-foreground">
                {t('settings.policies.summaryTitle')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('settings.policies.summarySubtitle')}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <dl className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-muted-foreground">{t('settings.policies.gracePeriod')}</dt>
                  <dd className="font-mono font-semibold text-foreground">
                    {form.grace_period_minutes || '0'} {t('settings.policies.gracePeriodUnit')}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-muted-foreground">
                    {t('settings.policies.enableQrAttendance')}
                  </dt>
                  <dd>
                    <Badge
                      variant={form.enable_qr_attendance ? 'default' : 'secondary'}
                      className="rounded-full text-[11px] font-medium"
                    >
                      {form.enable_qr_attendance
                        ? t('settings.policies.qrEnabled')
                        : t('settings.policies.qrDisabled')}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-muted-foreground">
                    {t('settings.policies.defaultCurrency')}
                  </dt>
                  <dd className="font-mono font-semibold text-foreground">
                    {form.default_currency || 'USD'}
                  </dd>
                </div>
              </dl>

              {hasValidRate && (
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-2.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('settings.policies.exchangePreviewLabel')}
                  </p>
                  <div className="divide-y divide-slate-200/60 dark:divide-slate-800 text-xs font-mono">
                    {conversionSamples.map((usd) => (
                      <div key={usd} className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">${usd.toLocaleString()}</span>
                        <span className="font-semibold text-foreground">
                          {Math.round(numericRate * usd).toLocaleString()} ៛
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Clean Unified Save Bar */}
      {canEdit && (
        <Card className={CARD_CLS}>
          <SettingsFormFooter
            isDirty={isDirty}
            isSaving={updateMutation.isPending}
            readOnly={!canEdit}
            borderTop={false}
            onReset={handleReset}
          />
        </Card>
      )}
    </form>
  );
};

export default PoliciesSection;
