import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Globe,
  History,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { settingsService } from '@/services/settingsService';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import { confirmAction } from '@/stores/confirmStore';
import { PageHeader } from '@/components/common/PageHeader';
import { GlobalSubmenu, type SubmenuItem } from '@/components/common/GlobalSubmenu';
import { Card, CardContent } from '@/components/ui/card';
import { OrganizationProfileSection } from './components/OrganizationProfileSection';
import { LocalizationPreferencesSection } from './components/LocalizationPreferencesSection';
import { PoliciesSection } from './components/PoliciesSection';
import { HospitalAttendanceSecurityTab } from './components/HospitalAttendanceSecurityTab';
import { AnnouncementsSection } from './components/AnnouncementsSection';
import { AuditLogsSection } from './components/AuditLogsSection';
import type { SettingsSectionId } from './types';

function resolveSectionFromLocation(
  pathname: string,
  tabParam: string | null
): SettingsSectionId {
  const normalizedTab = (tabParam || '').toLowerCase();
  switch (normalizedTab) {
    case 'organization':
    case 'org':
      return 'organization';
    case 'localization':
    case 'appearance':
    case 'preferences':
      return 'localization';
    case 'policies':
    case 'system':
    case 'workflow':
      return 'policies';
    case 'attendance_security':
    case 'hospital_security':
    case 'security':
      return 'attendance_security';
    case 'announcements':
    case 'notifications':
      return 'announcements';
    case 'audit_logs':
    case 'audit':
      return 'audit_logs';
    default:
      break;
  }

  if (pathname.endsWith('/localization')) return 'localization';
  if (pathname.endsWith('/notifications')) return 'announcements';
  if (pathname.endsWith('/workflow')) return 'policies';

  return 'organization';
}

export const SettingsPage: React.FC = () => {
  const { t } = useLocaleStore();
  const { hasRole, hasPermission } = useAuthStore();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // RBAC Permissions
  const isSuperAdmin = hasRole('Super Admin');
  const canManageSettings = isSuperAdmin || hasPermission('manage settings');
  const canManageOrg = canManageSettings || hasPermission('manage organization');
  const canManageAttendanceSecurity =
    canManageSettings || hasPermission('manage attendance');
  const canViewAuditLogs = canManageSettings || hasPermission('view audit logs');

  const hasAnySettingsAccess =
    canManageSettings ||
    canManageOrg ||
    canManageAttendanceSecurity ||
    canViewAuditLogs;

  const [activeSection, setActiveSection] = useState<SettingsSectionId>(() =>
    resolveSectionFromLocation(location.pathname, searchParams.get('tab'))
  );

  const [dirtySections, setDirtySections] = useState<
    Partial<Record<SettingsSectionId, boolean>>
  >({});

  // Sync URL query param / legacy route paths when navigated externally
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam ||
      location.pathname.endsWith('/localization') ||
      location.pathname.endsWith('/notifications') ||
      location.pathname.endsWith('/workflow')
    ) {
      const target = resolveSectionFromLocation(location.pathname, tabParam);
      setActiveSection(target);
    }
  }, [location.pathname, searchParams]);

  // Share announcements query cache to show count badge in submenu
  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements-list'],
    queryFn: async () => await settingsService.getAnnouncements(),
    enabled: hasAnySettingsAccess && (canManageSettings || canManageOrg),
  });

  const submenuItems = useMemo<SubmenuItem<SettingsSectionId>[]>(() => {
    const items: Array<SubmenuItem<SettingsSectionId> & { visible: boolean }> = [
      {
        value: 'organization',
        label: t('settings.nav.organization'),
        icon: Building2,
        visible: canManageOrg,
      },
      {
        value: 'localization',
        label: t('settings.nav.localization'),
        icon: Globe,
        visible: canManageSettings || canManageOrg,
      },
      {
        value: 'policies',
        label: t('settings.nav.policies'),
        icon: SlidersHorizontal,
        visible: canManageSettings,
      },
      {
        value: 'attendance_security',
        label: t('settings.nav.attendanceSecurity'),
        icon: ShieldCheck,
        visible: canManageAttendanceSecurity,
      },
      {
        value: 'announcements',
        label: t('settings.nav.announcements'),
        icon: Megaphone,
        count: announcements.length > 0 ? announcements.length : undefined,
        visible: canManageSettings || canManageOrg,
      },
      {
        value: 'audit_logs',
        label: t('settings.nav.auditLogs'),
        icon: History,
        visible: canViewAuditLogs,
      },
    ];

    return items.filter((item) => item.visible);
  }, [
    t,
    canManageOrg,
    canManageSettings,
    canManageAttendanceSecurity,
    canViewAuditLogs,
    announcements.length,
  ]);

  const visibleSectionIds = useMemo(
    () => submenuItems.map((item) => item.value),
    [submenuItems]
  );

  // Ensure active section is always permitted
  useEffect(() => {
    if (
      visibleSectionIds.length > 0 &&
      !visibleSectionIds.includes(activeSection)
    ) {
      setActiveSection(visibleSectionIds[0]);
    }
  }, [visibleSectionIds, activeSection]);

  const setSectionDirty = useCallback(
    (section: SettingsSectionId) => (dirty: boolean) => {
      setDirtySections((prev) => {
        if (Boolean(prev[section]) === dirty) return prev;
        return { ...prev, [section]: dirty };
      });
    },
    []
  );

  const handleOrgDirtyChange = useMemo(
    () => setSectionDirty('organization'),
    [setSectionDirty]
  );
  const handleLocalizationDirtyChange = useMemo(
    () => setSectionDirty('localization'),
    [setSectionDirty]
  );
  const handlePoliciesDirtyChange = useMemo(
    () => setSectionDirty('policies'),
    [setSectionDirty]
  );

  const navigateToSection = useCallback(
    (nextId: SettingsSectionId) => {
      setActiveSection(nextId);
      setSearchParams({ tab: nextId }, { replace: true });
    },
    [setSearchParams]
  );

  const handleSelectSection = useCallback(
    (nextId: SettingsSectionId) => {
      if (nextId === activeSection) return;

      if (dirtySections[activeSection]) {
        confirmAction({
          title: t('settings.common.switchConfirmTitle'),
          message: t('settings.common.switchConfirmDesc'),
          variant: 'warning',
          actionType: 'warning',
          confirmText: t('settings.common.switchConfirmAction'),
          cancelText: t('common.cancel'),
          onConfirm: () => {
            setDirtySections((prev) => ({ ...prev, [activeSection]: false }));
            navigateToSection(nextId);
          },
        });
        return;
      }

      navigateToSection(nextId);
    },
    [activeSection, dirtySections, navigateToSection, t]
  );

  const activeNavItem = useMemo(
    () => submenuItems.find((i) => i.value === activeSection),
    [submenuItems, activeSection]
  );

  const isActiveDirty = Boolean(dirtySections[activeSection]);

  if (!hasAnySettingsAccess) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('settings.title')}
          subtitle={t('settings.subtitle')}
          breadcrumbs={[{ label: t('nav.systemSettings') }]}
        />
        <Card className="max-w-xl rounded-xl border border-neutral-200/90 dark:border-neutral-800 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              {t('settings.common.accessDeniedTitle')}
            </h2>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              {t('settings.common.accessDeniedDesc')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        breadcrumbs={[
          { label: t('nav.systemSettings') },
          ...(activeNavItem ? [{ label: String(activeNavItem.label) }] : []),
        ]}
      />

      <div className="space-y-5">
        <GlobalSubmenu
          value={activeSection}
          onChange={handleSelectSection}
          items={submenuItems}
          ariaLabel={t('settings.title')}
          rightContent={
            isActiveDirty ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{t('settings.common.unsavedChanges')}</span>
              </span>
            ) : undefined
          }
        />

        <div className="w-full">
          {activeSection === 'organization' && (
            <OrganizationProfileSection
              canEdit={canManageOrg}
              onDirtyChange={handleOrgDirtyChange}
            />
          )}

          {activeSection === 'localization' && (
            <LocalizationPreferencesSection
              canEdit={canManageSettings}
              onDirtyChange={handleLocalizationDirtyChange}
            />
          )}

          {activeSection === 'policies' && (
            <PoliciesSection
              canEdit={canManageSettings}
              onDirtyChange={handlePoliciesDirtyChange}
            />
          )}

          {activeSection === 'attendance_security' && (
            <HospitalAttendanceSecurityTab canEdit={canManageAttendanceSecurity} />
          )}

          {activeSection === 'announcements' && (
            <AnnouncementsSection canEdit={canManageSettings || canManageOrg} />
          )}

          {activeSection === 'audit_logs' && <AuditLogsSection />}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
