import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { organizationService } from '@/services/organizationService';
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
import { Textarea } from '@/components/ui/textarea';
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
import type { OrganizationProfile } from '../types';

const EMPTY_ORG: OrganizationProfile = {
  name: '',
  legal_name: '',
  registration_number: '',
  tax_id: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  city: '',
  country: 'Cambodia',
  default_currency: 'USD',
  fiscal_year_start: '01-01',
};

const FIELD_INPUT_CLS =
  'h-10 rounded-lg border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-950/30 text-sm text-foreground shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary';

const FIELD_LABEL_CLS = 'text-[13px] font-medium text-slate-700 dark:text-slate-300';

const CARD_CLS =
  'overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-card shadow-sm';

function normalizeOrg(raw: any): OrganizationProfile {
  if (!raw) return { ...EMPTY_ORG };
  return {
    id: raw.id,
    name: raw.name ?? '',
    legal_name: raw.legal_name ?? '',
    registration_number: raw.registration_number ?? '',
    tax_id: raw.tax_id ?? '',
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    website: raw.website ?? '',
    address: raw.address ?? '',
    city: raw.city ?? '',
    country: raw.country ?? 'Cambodia',
    default_currency: raw.default_currency ?? 'USD',
    fiscal_year_start: raw.fiscal_year_start ?? '01-01',
  };
}

interface OrganizationProfileSectionProps {
  canEdit: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}

export const OrganizationProfileSection: React.FC<OrganizationProfileSectionProps> = ({
  canEdit,
  onDirtyChange,
}) => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<OrganizationProfile>(EMPTY_ORG);
  const [serverSnapshot, setServerSnapshot] = useState<OrganizationProfile>(EMPTY_ORG);
  const [errors, setErrors] = useState<Partial<Record<keyof OrganizationProfile, string>>>({});

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['org-profile-settings'],
    queryFn: async () => await organizationService.getProfile(),
  });

  useEffect(() => {
    if (data !== undefined) {
      const normalized = normalizeOrg(data);
      setForm(normalized);
      setServerSnapshot(normalized);
      setErrors({});
    }
  }, [data]);

  const isDirty = useMemo(() => {
    const keys: (keyof OrganizationProfile)[] = [
      'name',
      'legal_name',
      'registration_number',
      'tax_id',
      'email',
      'phone',
      'website',
      'address',
      'city',
      'country',
      'default_currency',
      'fiscal_year_start',
    ];
    return keys.some((k) => (form[k] ?? '') !== (serverSnapshot[k] ?? ''));
  }, [form, serverSnapshot]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof OrganizationProfile, string>> = {};

    if (!form.name.trim()) {
      nextErrors.name = t('settings.validation.required');
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = t('settings.validation.invalidEmail');
    }
    if (form.website.trim() && !/^https?:\/\/.+/i.test(form.website.trim())) {
      nextErrors.website = t('settings.validation.invalidUrl');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        legal_name: form.legal_name.trim() || null,
        registration_number: form.registration_number.trim() || null,
        tax_id: form.tax_id.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        default_currency: form.default_currency || 'USD',
        fiscal_year_start: form.fiscal_year_start || '01-01',
      };
      return await organizationService.updateProfile(payload);
    },
    onSuccess: (res: any) => {
      const updated = normalizeOrg(res?.organization ?? form);
      setForm(updated);
      setServerSnapshot(updated);
      setErrors({});
      queryClient.invalidateQueries({ queryKey: ['org-profile-settings'] });
      queryClient.invalidateQueries({ queryKey: ['org-profile'] });
      toast.success(t('settings.org.saveSuccess'));
    },
    onError: (err: any) => {
      const backendErrors = err?.response?.data?.errors;
      if (backendErrors && typeof backendErrors === 'object') {
        const mapped: Partial<Record<keyof OrganizationProfile, string>> = {};
        Object.entries(backendErrors).forEach(([field, msgs]) => {
          if (Array.isArray(msgs) && msgs.length > 0) {
            mapped[field as keyof OrganizationProfile] = String(msgs[0]);
          }
        });
        setErrors(mapped);
      }
      toast.error(err?.response?.data?.message || t('settings.org.saveError'));
    },
  });

  const updateField = <K extends keyof OrganizationProfile>(
    key: K,
    value: OrganizationProfile[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        <div className="xl:col-span-8 space-y-6">
          <Card className={CARD_CLS}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 space-y-1.5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-64" />
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className={CARD_CLS}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 space-y-1.5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-64" />
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-4 space-y-6">
          <Card className={CARD_CLS}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
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

  const fiscalOptions = ['01-01', '04-01', '07-01', '10-01'] as const;
  const activeFiscal = fiscalOptions.includes(form.fiscal_year_start as any)
    ? form.fiscal_year_start
    : '01-01';

  const initials = (form.name || 'OR')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {!canEdit && (
        <Alert variant="info" className="rounded-xl">
          <AlertDescription>{t('settings.common.readOnlyNotice')}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* ── Left Column: Identity & Contact Cards ── */}
        <div className="xl:col-span-8 space-y-6">
          {/* Card 1: Corporate Identity */}
          <Card className={CARD_CLS}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
              <CardTitle className="text-[15px] font-semibold text-foreground">
                {t('settings.org.identitySection')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('settings.org.identityDesc')}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name" className={FIELD_LABEL_CLS}>
                    {t('settings.org.name')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="org-name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder={t('settings.org.namePlaceholder')}
                    disabled={!canEdit}
                    aria-invalid={Boolean(errors.name)}
                    className={`${FIELD_INPUT_CLS} ${
                      errors.name ? 'border-destructive focus-visible:ring-destructive/20' : ''
                    }`}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-legal-name" className={FIELD_LABEL_CLS}>
                    {t('settings.org.legalName')}
                  </Label>
                  <Input
                    id="org-legal-name"
                    value={form.legal_name}
                    onChange={(e) => updateField('legal_name', e.target.value)}
                    placeholder={t('settings.org.legalNamePlaceholder')}
                    disabled={!canEdit}
                    className={FIELD_INPUT_CLS}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-reg-no" className={FIELD_LABEL_CLS}>
                    {t('settings.org.registrationNumber')}
                  </Label>
                  <Input
                    id="org-reg-no"
                    value={form.registration_number}
                    onChange={(e) => updateField('registration_number', e.target.value)}
                    placeholder={t('settings.org.registrationNumberPlaceholder')}
                    disabled={!canEdit}
                    className={`${FIELD_INPUT_CLS} font-mono text-[13px]`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-tax-id" className={FIELD_LABEL_CLS}>
                    {t('settings.org.taxId')}
                  </Label>
                  <Input
                    id="org-tax-id"
                    value={form.tax_id}
                    onChange={(e) => updateField('tax_id', e.target.value)}
                    placeholder={t('settings.org.taxIdPlaceholder')}
                    disabled={!canEdit}
                    className={`${FIELD_INPUT_CLS} font-mono text-[13px]`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Contact & Location */}
          <Card className={CARD_CLS}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
              <CardTitle className="text-[15px] font-semibold text-foreground">
                {t('settings.org.contactSection')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('settings.org.contactDesc')}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-email" className={FIELD_LABEL_CLS}>
                    {t('settings.org.email')}
                  </Label>
                  <Input
                    id="org-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder={t('settings.org.emailPlaceholder')}
                    disabled={!canEdit}
                    aria-invalid={Boolean(errors.email)}
                    className={`${FIELD_INPUT_CLS} ${
                      errors.email ? 'border-destructive focus-visible:ring-destructive/20' : ''
                    }`}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-phone" className={FIELD_LABEL_CLS}>
                    {t('settings.org.phone')}
                  </Label>
                  <Input
                    id="org-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder={t('settings.org.phonePlaceholder')}
                    disabled={!canEdit}
                    className={FIELD_INPUT_CLS}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="org-website" className={FIELD_LABEL_CLS}>
                    {t('settings.org.website')}
                  </Label>
                  <Input
                    id="org-website"
                    type="url"
                    value={form.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder={t('settings.org.websitePlaceholder')}
                    disabled={!canEdit}
                    aria-invalid={Boolean(errors.website)}
                    className={`${FIELD_INPUT_CLS} ${
                      errors.website ? 'border-destructive focus-visible:ring-destructive/20' : ''
                    }`}
                  />
                  {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-city" className={FIELD_LABEL_CLS}>
                    {t('settings.org.city')}
                  </Label>
                  <Input
                    id="org-city"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder={t('settings.org.cityPlaceholder')}
                    disabled={!canEdit}
                    className={FIELD_INPUT_CLS}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-country" className={FIELD_LABEL_CLS}>
                    {t('settings.org.country')}
                  </Label>
                  <Input
                    id="org-country"
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    placeholder={t('settings.org.countryPlaceholder')}
                    disabled={!canEdit}
                    className={FIELD_INPUT_CLS}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="org-address" className={FIELD_LABEL_CLS}>
                    {t('settings.org.address')}
                  </Label>
                  <Textarea
                    id="org-address"
                    rows={3}
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder={t('settings.org.addressPlaceholder')}
                    disabled={!canEdit}
                    className="rounded-lg border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-950/30 text-sm shadow-none resize-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Rail: Live Organization Summary + Financial Defaults ── */}
        <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-20">
          {/* Card 3: Live Organization Summary */}
          <Card className={CARD_CLS}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-[15px] font-semibold text-foreground">
                    {t('settings.org.summaryTitle')}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {t('settings.org.summarySubtitle')}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="rounded-full font-mono text-xs shrink-0">
                  {form.default_currency || 'USD'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {initials || 'OR'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {form.name || t('settings.org.notSet')}
                  </p>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">
                    {form.legal_name || t('settings.org.notSet')}
                  </p>
                </div>
              </div>

              <dl className="divide-y divide-slate-100 dark:divide-slate-800/80 border-t border-slate-100 dark:border-slate-800/80 pt-1 text-xs">
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-muted-foreground shrink-0">
                    {t('settings.org.registrationNumber')}
                  </dt>
                  <dd className="font-mono font-medium text-foreground truncate">
                    {form.registration_number || '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-muted-foreground shrink-0">{t('settings.org.taxId')}</dt>
                  <dd className="font-mono font-medium text-foreground truncate">
                    {form.tax_id || '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-muted-foreground shrink-0">{t('settings.org.email')}</dt>
                  <dd className="font-medium text-foreground truncate">{form.email || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-muted-foreground shrink-0">{t('settings.org.phone')}</dt>
                  <dd className="font-medium text-foreground truncate">{form.phone || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-muted-foreground shrink-0">
                    {t('settings.org.fiscalYearStart')}
                  </dt>
                  <dd className="font-medium text-foreground truncate">
                    {t(`settings.org.fiscalMonths.${activeFiscal}`)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Card 4: Financial Defaults */}
          <Card className={CARD_CLS}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
              <CardTitle className="text-[15px] font-semibold text-foreground">
                {t('settings.org.financialSection')}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('settings.org.financialDesc')}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="org-currency" className={FIELD_LABEL_CLS}>
                  {t('settings.org.defaultCurrency')}
                </Label>
                <Select
                  value={form.default_currency || 'USD'}
                  onValueChange={(val) => updateField('default_currency', val)}
                  disabled={!canEdit}
                >
                  <SelectTrigger id="org-currency" className={FIELD_INPUT_CLS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">{t('settings.org.currencies.USD')}</SelectItem>
                    <SelectItem value="KHR">{t('settings.org.currencies.KHR')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-fiscal" className={FIELD_LABEL_CLS}>
                  {t('settings.org.fiscalYearStart')}
                </Label>
                <Select
                  value={activeFiscal}
                  onValueChange={(val) => updateField('fiscal_year_start', val)}
                  disabled={!canEdit}
                >
                  <SelectTrigger id="org-fiscal" className={FIELD_INPUT_CLS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fiscalOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {t(`settings.org.fiscalMonths.${opt}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t('settings.org.fiscalYearHint')}</p>
              </div>
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

export default OrganizationProfileSection;
