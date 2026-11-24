import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  History,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Wifi,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  qrAttendanceService,
  type HospitalGeofenceItem,
  type HospitalNetworkItem,
} from '@/services/qrAttendanceService';
import { useLocaleStore } from '@/stores/localeStore';
import { confirmDelete } from '@/stores/confirmStore';
import { formatDateTime } from '@/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, GlobalModal, LoadingState, Pagination, StatusBadge } from '@/components/common';
import {
  RowActionGroup,
  EditRowButton,
  DeleteRowButton,
} from '@/components/common/GlobalActionButtons';

interface HospitalAttendanceSecurityTabProps {
  canEdit?: boolean;
}

interface NetworkFormState {
  network_name: string;
  branch_name: string;
  allowed_ip: string;
  allowed_cidr: string;
  description: string;
  status: 'active' | 'inactive';
}

interface GeofenceFormState {
  name: string;
  branch_name: string;
  latitude: string;
  longitude: string;
  radius_meters: string;
  max_accuracy_meters: string;
  description: string;
  status: 'active' | 'inactive';
}

const DEFAULT_NETWORK_FORM: NetworkFormState = {
  network_name: '',
  branch_name: '',
  allowed_ip: '',
  allowed_cidr: '',
  description: '',
  status: 'active',
};

const DEFAULT_GEOFENCE_FORM: GeofenceFormState = {
  name: '',
  branch_name: '',
  latitude: '11.8891000',
  longitude: '105.8762000',
  radius_meters: '200',
  max_accuracy_meters: '80',
  description: '',
  status: 'active',
};

export const HospitalAttendanceSecurityTab: React.FC<HospitalAttendanceSecurityTabProps> = ({
  canEdit = true,
}) => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const [activeSubTab, setActiveSubTab] = useState<'networks' | 'geofences' | 'scan_logs'>(
    'networks'
  );

  // Network Modal State
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<HospitalNetworkItem | null>(null);
  const [networkForm, setNetworkForm] = useState<NetworkFormState>(DEFAULT_NETWORK_FORM);
  const [networkErrors, setNetworkErrors] = useState<
    Partial<Record<keyof NetworkFormState | 'ip_or_cidr', string>>
  >({});

  // Geofence Modal State
  const [geofenceModalOpen, setGeofenceModalOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<HospitalGeofenceItem | null>(null);
  const [geofenceForm, setGeofenceForm] = useState<GeofenceFormState>(DEFAULT_GEOFENCE_FORM);
  const [geofenceErrors, setGeofenceErrors] = useState<
    Partial<Record<keyof GeofenceFormState, string>>
  >({});

  // Scan Logs Filter & Pagination State
  const [scanFilter, setScanFilter] = useState({
    status: 'all',
    event_type: 'all',
    date: '',
    page: 1,
    per_page: 20,
  });

  // Queries
  const {
    data: networks = [],
    isLoading: isNetworksLoading,
    isError: isNetworksError,
    refetch: refetchNetworks,
  } = useQuery({
    queryKey: ['hospital-networks'],
    queryFn: async () => await qrAttendanceService.getNetworks(),
  });

  const {
    data: geofences = [],
    isLoading: isGeofencesLoading,
    isError: isGeofencesError,
    refetch: refetchGeofences,
  } = useQuery({
    queryKey: ['hospital-geofences'],
    queryFn: async () => await qrAttendanceService.getGeofences(),
  });

  const {
    data: scanLogsData,
    isLoading: isLogsLoading,
    isFetching: isLogsFetching,
    isError: isLogsError,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ['hospital-scan-logs', scanFilter],
    queryFn: async () =>
      await qrAttendanceService.getScanLogs({
        status: scanFilter.status !== 'all' ? scanFilter.status : undefined,
        event_type: scanFilter.event_type !== 'all' ? scanFilter.event_type : undefined,
        date: scanFilter.date || undefined,
        page: scanFilter.page,
        per_page: scanFilter.per_page,
      }),
  });

  // Network Mutations
  const saveNetworkMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        network_name: networkForm.network_name.trim(),
        branch_name: networkForm.branch_name.trim() || undefined,
        allowed_ip: networkForm.allowed_ip.trim() || null,
        allowed_cidr: networkForm.allowed_cidr.trim() || null,
        description: networkForm.description.trim() || null,
        status: networkForm.status,
      };
      if (editingNetwork) {
        return await qrAttendanceService.updateNetwork(editingNetwork.id, payload);
      }
      return await qrAttendanceService.createNetwork(payload);
    },
    onSuccess: () => {
      toast.success(t('settings.security.networkSaved'));
      setNetworkModalOpen(false);
      setEditingNetwork(null);
      setNetworkErrors({});
      queryClient.invalidateQueries({ queryKey: ['hospital-networks'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('settings.security.networkSaveError'));
    },
  });

  const deleteNetworkMutation = useMutation({
    mutationFn: async (id: number) => await qrAttendanceService.deleteNetwork(id),
    onSuccess: () => {
      toast.success(t('settings.security.networkDeleted'));
      queryClient.invalidateQueries({ queryKey: ['hospital-networks'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('settings.security.networkDeleteError'));
    },
  });

  // Geofence Mutations
  const saveGeofenceMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: geofenceForm.name.trim(),
        branch_name: geofenceForm.branch_name.trim() || undefined,
        latitude: parseFloat(geofenceForm.latitude),
        longitude: parseFloat(geofenceForm.longitude),
        radius_meters: parseInt(geofenceForm.radius_meters, 10),
        max_accuracy_meters: parseInt(geofenceForm.max_accuracy_meters, 10),
        description: geofenceForm.description.trim() || null,
        status: geofenceForm.status,
      };
      if (editingGeofence) {
        return await qrAttendanceService.updateGeofence(editingGeofence.id, payload);
      }
      return await qrAttendanceService.createGeofence(payload);
    },
    onSuccess: () => {
      toast.success(t('settings.security.geofenceSaved'));
      setGeofenceModalOpen(false);
      setEditingGeofence(null);
      setGeofenceErrors({});
      queryClient.invalidateQueries({ queryKey: ['hospital-geofences'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('settings.security.geofenceSaveError'));
    },
  });

  const deleteGeofenceMutation = useMutation({
    mutationFn: async (id: number) => await qrAttendanceService.deleteGeofence(id),
    onSuccess: () => {
      toast.success(t('settings.security.geofenceDeleted'));
      queryClient.invalidateQueries({ queryKey: ['hospital-geofences'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('settings.security.geofenceDeleteError'));
    },
  });

  // Modal Handlers
  const openAddNetwork = () => {
    setEditingNetwork(null);
    setNetworkForm({ ...DEFAULT_NETWORK_FORM });
    setNetworkErrors({});
    setNetworkModalOpen(true);
  };

  const openEditNetwork = (net: HospitalNetworkItem) => {
    setEditingNetwork(net);
    setNetworkForm({
      network_name: net.network_name || '',
      branch_name: net.branch_name || '',
      allowed_ip: net.allowed_ip || '',
      allowed_cidr: net.allowed_cidr || '',
      description: net.description || '',
      status: net.status || 'active',
    });
    setNetworkErrors({});
    setNetworkModalOpen(true);
  };

  const validateNetwork = (): boolean => {
    const next: Partial<Record<keyof NetworkFormState | 'ip_or_cidr', string>> = {};
    if (!networkForm.network_name.trim()) {
      next.network_name = t('settings.validation.required');
    }
    if (!networkForm.allowed_ip.trim() && !networkForm.allowed_cidr.trim()) {
      next.ip_or_cidr = t('settings.validation.ipOrCidrRequired');
    }
    setNetworkErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveNetwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || saveNetworkMutation.isPending) return;
    if (!validateNetwork()) return;
    saveNetworkMutation.mutate();
  };

  const openAddGeofence = () => {
    setEditingGeofence(null);
    setGeofenceForm({ ...DEFAULT_GEOFENCE_FORM });
    setGeofenceErrors({});
    setGeofenceModalOpen(true);
  };

  const openEditGeofence = (geo: HospitalGeofenceItem) => {
    setEditingGeofence(geo);
    setGeofenceForm({
      name: geo.name || '',
      branch_name: geo.branch_name || '',
      latitude: String(geo.latitude ?? ''),
      longitude: String(geo.longitude ?? ''),
      radius_meters: String(geo.radius_meters ?? 200),
      max_accuracy_meters: String(geo.max_accuracy_meters ?? 80),
      description: geo.description || '',
      status: geo.status || 'active',
    });
    setGeofenceErrors({});
    setGeofenceModalOpen(true);
  };

  const validateGeofence = (): boolean => {
    const next: Partial<Record<keyof GeofenceFormState, string>> = {};
    if (!geofenceForm.name.trim()) {
      next.name = t('settings.validation.required');
    }
    const lat = Number(geofenceForm.latitude);
    if (geofenceForm.latitude.trim() === '' || Number.isNaN(lat) || lat < -90 || lat > 90) {
      next.latitude = t('settings.validation.invalidLatitude');
    }
    const lng = Number(geofenceForm.longitude);
    if (geofenceForm.longitude.trim() === '' || Number.isNaN(lng) || lng < -180 || lng > 180) {
      next.longitude = t('settings.validation.invalidLongitude');
    }
    const rad = Number(geofenceForm.radius_meters);
    if (
      geofenceForm.radius_meters.trim() === '' ||
      !Number.isInteger(rad) ||
      rad < 10 ||
      rad > 5000
    ) {
      next.radius_meters = t('settings.validation.invalidRadius');
    }
    const acc = Number(geofenceForm.max_accuracy_meters);
    if (
      geofenceForm.max_accuracy_meters.trim() === '' ||
      !Number.isInteger(acc) ||
      acc < 5 ||
      acc > 500
    ) {
      next.max_accuracy_meters = t('settings.validation.invalidAccuracy');
    }
    setGeofenceErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || saveGeofenceMutation.isPending) return;
    if (!validateGeofence()) return;
    saveGeofenceMutation.mutate();
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'check_in':
        return t('settings.security.eventCheckIn');
      case 'check_out':
        return t('settings.security.eventCheckOut');
      case 'qr_validate':
        return t('settings.security.eventQrValidate');
      case 'rejected':
        return t('settings.security.eventRejected');
      default:
        return eventType;
    }
  };

  const hasScanFilters =
    scanFilter.status !== 'all' || scanFilter.event_type !== 'all' || Boolean(scanFilter.date);

  return (
    <div className="space-y-4">
      {!canEdit && (
        <Alert variant="info">
          <AlertDescription>{t('settings.common.readOnlyNotice')}</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-card shadow-md">
        <CardHeader className="border-b border-border/60 bg-muted/15 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                {t('settings.security.title')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {t('settings.security.subtitle')}
              </CardDescription>
            </div>

            {canEdit && activeSubTab === 'networks' && (
              <Button size="sm" onClick={openAddNetwork} className="self-start sm:self-auto">
                <Plus className="h-4 w-4" />
                <span>{t('settings.security.addNetwork')}</span>
              </Button>
            )}

            {canEdit && activeSubTab === 'geofences' && (
              <Button size="sm" onClick={openAddGeofence} className="self-start sm:self-auto">
                <Plus className="h-4 w-4" />
                <span>{t('settings.security.addGeofence')}</span>
              </Button>
            )}

            {activeSubTab === 'scan_logs' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchLogs()}
                disabled={isLogsFetching}
                className="self-start sm:self-auto"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLogsFetching ? 'animate-spin' : ''}`} />
                <span>{t('common.refresh')}</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs
            value={activeSubTab}
            onValueChange={(val) =>
              setActiveSubTab(val as 'networks' | 'geofences' | 'scan_logs')
            }
            className="space-y-5"
          >
            <TabsList className="w-full sm:w-auto justify-start overflow-x-auto">
              <TabsTrigger value="networks" className="gap-1.5 text-xs sm:text-sm">
                <Wifi className="h-3.5 w-3.5" />
                <span>{t('settings.security.tabNetworks')}</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {networks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="geofences" className="gap-1.5 text-xs sm:text-sm">
                <MapPin className="h-3.5 w-3.5" />
                <span>{t('settings.security.tabGeofences')}</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {geofences.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="scan_logs" className="gap-1.5 text-xs sm:text-sm">
                <History className="h-3.5 w-3.5" />
                <span>{t('settings.security.tabScanLogs')}</span>
              </TabsTrigger>
            </TabsList>

            {/* ─── 1. Wi-Fi Networks ─── */}
            <TabsContent value="networks" className="space-y-4 mt-0">
              <Alert variant="default" className="rounded-xl bg-muted/30">
                <AlertTitle>{t('settings.security.wifiPolicyTitle')}</AlertTitle>
                <AlertDescription>{t('settings.security.wifiPolicyDesc')}</AlertDescription>
              </Alert>

              {isNetworksError ? (
                <Alert variant="destructive">
                  <AlertTitle>{t('settings.common.loadErrorTitle')}</AlertTitle>
                  <AlertDescription className="mt-2 flex items-center justify-between gap-3">
                    <span>{t('settings.common.loadErrorDesc')}</span>
                    <Button variant="outline" size="sm" onClick={() => refetchNetworks()}>
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>{t('common.retry')}</span>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : isNetworksLoading ? (
                <LoadingState message={t('common.loading')} />
              ) : networks.length === 0 ? (
                <EmptyState
                  icon={Wifi}
                  title={t('settings.security.noNetworksTitle')}
                  description={t('settings.security.noNetworksDesc')}
                  actionLabel={canEdit ? t('settings.security.addNetwork') : undefined}
                  onAction={canEdit ? openAddNetwork : undefined}
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">{t('settings.security.networkName')}</th>
                        <th className="px-4 py-3">{t('settings.security.branchName')}</th>
                        <th className="px-4 py-3">{t('settings.security.allowedIp')}</th>
                        <th className="px-4 py-3">{t('settings.security.status')}</th>
                        {canEdit && (
                          <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {networks.map((net) => (
                        <tr key={net.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{net.network_name}</div>
                            {net.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {net.description}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {net.branch_name || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                              {net.allowed_ip && (
                                <Badge variant="outline" className="font-mono font-normal">
                                  {net.allowed_ip}
                                </Badge>
                              )}
                              {net.allowed_cidr && (
                                <Badge variant="secondary" className="font-mono font-normal">
                                  {net.allowed_cidr}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={net.status} />
                          </td>
                          {canEdit && (
                            <td className="px-4 py-3 text-right">
                              <RowActionGroup align="right">
                                <EditRowButton
                                  onClick={() => openEditNetwork(net)}
                                  title={t('common.edit')}
                                />
                                <DeleteRowButton
                                  onClick={() => {
                                    confirmDelete({
                                      title: t('settings.security.deleteNetworkTitle'),
                                      itemName:
                                        net.network_name ||
                                        net.allowed_ip ||
                                        net.allowed_cidr ||
                                        '',
                                      confirmText: t('common.delete'),
                                      cancelText: t('common.cancel'),
                                      onConfirm: () => deleteNetworkMutation.mutate(net.id),
                                    });
                                  }}
                                  title={t('common.delete')}
                                />
                              </RowActionGroup>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ─── 2. GPS Geofences ─── */}
            <TabsContent value="geofences" className="space-y-4 mt-0">
              <Alert variant="default" className="rounded-xl bg-muted/30">
                <AlertTitle>{t('settings.security.geofencePolicyTitle')}</AlertTitle>
                <AlertDescription>{t('settings.security.geofencePolicyDesc')}</AlertDescription>
              </Alert>

              {isGeofencesError ? (
                <Alert variant="destructive">
                  <AlertTitle>{t('settings.common.loadErrorTitle')}</AlertTitle>
                  <AlertDescription className="mt-2 flex items-center justify-between gap-3">
                    <span>{t('settings.common.loadErrorDesc')}</span>
                    <Button variant="outline" size="sm" onClick={() => refetchGeofences()}>
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>{t('common.retry')}</span>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : isGeofencesLoading ? (
                <LoadingState message={t('common.loading')} />
              ) : geofences.length === 0 ? (
                <EmptyState
                  icon={MapPin}
                  title={t('settings.security.noGeofencesTitle')}
                  description={t('settings.security.noGeofencesDesc')}
                  actionLabel={canEdit ? t('settings.security.addGeofence') : undefined}
                  onAction={canEdit ? openAddGeofence : undefined}
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">{t('settings.security.zoneName')}</th>
                        <th className="px-4 py-3">{t('settings.security.branchName')}</th>
                        <th className="px-4 py-3">{t('settings.security.coordinates')}</th>
                        <th className="px-4 py-3">{t('settings.security.radius')}</th>
                        <th className="px-4 py-3">{t('settings.security.maxAccuracy')}</th>
                        <th className="px-4 py-3">{t('settings.security.status')}</th>
                        {canEdit && (
                          <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {geofences.map((geo) => (
                        <tr key={geo.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{geo.name}</div>
                            {geo.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {geo.description}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {geo.branch_name || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-foreground">
                            {Number(geo.latitude).toFixed(6)}, {Number(geo.longitude).toFixed(6)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-foreground">
                            {geo.radius_meters} {t('settings.security.metersUnit')}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            ±{geo.max_accuracy_meters} {t('settings.security.metersUnit')}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={geo.status} />
                          </td>
                          {canEdit && (
                            <td className="px-4 py-3 text-right">
                              <RowActionGroup align="right">
                                <EditRowButton
                                  onClick={() => openEditGeofence(geo)}
                                  title={t('common.edit')}
                                />
                                <DeleteRowButton
                                  onClick={() => {
                                    confirmDelete({
                                      title: t('settings.security.deleteGeofenceTitle'),
                                      itemName: geo.name,
                                      confirmText: t('common.delete'),
                                      cancelText: t('common.cancel'),
                                      onConfirm: () => deleteGeofenceMutation.mutate(geo.id),
                                    });
                                  }}
                                  title={t('common.delete')}
                                />
                              </RowActionGroup>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ─── 3. Scan Audit Logs ─── */}
            <TabsContent value="scan_logs" className="space-y-4 mt-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={scanFilter.status}
                    onValueChange={(val) =>
                      setScanFilter((prev) => ({ ...prev, status: val, page: 1 }))
                    }
                  >
                    <SelectTrigger className="h-9 w-[160px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('settings.security.filterAllStatus')}</SelectItem>
                      <SelectItem value="success">{t('settings.security.resultPassed')}</SelectItem>
                      <SelectItem value="rejected">
                        {t('settings.security.resultRejected')}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={scanFilter.event_type}
                    onValueChange={(val) =>
                      setScanFilter((prev) => ({ ...prev, event_type: val, page: 1 }))
                    }
                  >
                    <SelectTrigger className="h-9 w-[160px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('settings.security.filterAllEvents')}</SelectItem>
                      <SelectItem value="check_in">
                        {t('settings.security.eventCheckIn')}
                      </SelectItem>
                      <SelectItem value="check_out">
                        {t('settings.security.eventCheckOut')}
                      </SelectItem>
                      <SelectItem value="rejected">
                        {t('settings.security.eventRejected')}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={scanFilter.date}
                    onChange={(e) =>
                      setScanFilter((prev) => ({ ...prev, date: e.target.value, page: 1 }))
                    }
                    className="h-9 w-[160px] text-xs"
                  />

                  {hasScanFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setScanFilter((prev) => ({
                          ...prev,
                          status: 'all',
                          event_type: 'all',
                          date: '',
                          page: 1,
                        }))
                      }
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{t('common.reset')}</span>
                    </Button>
                  )}
                </div>

                <span className="text-xs text-muted-foreground tabular-nums">
                  {scanLogsData?.total || 0} {t('common.records')}
                </span>
              </div>

              {isLogsError ? (
                <Alert variant="destructive">
                  <AlertTitle>{t('settings.common.loadErrorTitle')}</AlertTitle>
                  <AlertDescription className="mt-2 flex items-center justify-between gap-3">
                    <span>{t('settings.common.loadErrorDesc')}</span>
                    <Button variant="outline" size="sm" onClick={() => refetchLogs()}>
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>{t('common.retry')}</span>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : isLogsLoading ? (
                <LoadingState message={t('common.loading')} />
              ) : !scanLogsData?.data || scanLogsData.data.length === 0 ? (
                <EmptyState
                  icon={History}
                  title={t('settings.security.noScanLogsTitle')}
                  description={t('settings.security.noScanLogsDesc')}
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">{t('settings.security.colTimestamp')}</th>
                          <th className="px-4 py-3">{t('settings.security.colEmployee')}</th>
                          <th className="px-4 py-3">{t('settings.security.colEvent')}</th>
                          <th className="px-4 py-3">{t('settings.security.colSourceIp')}</th>
                          <th className="px-4 py-3">{t('settings.security.colDistance')}</th>
                          <th className="px-4 py-3">{t('settings.security.colResult')}</th>
                          <th className="px-4 py-3">{t('settings.security.colNotes')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {scanLogsData.data.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                              {formatDateTime(log.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              {log.employee ? (
                                <div>
                                  <div className="font-medium text-foreground">
                                    {log.employee.full_name ||
                                      `${log.employee.first_name} ${log.employee.last_name}`}
                                  </div>
                                  <div className="text-[11px] font-mono text-muted-foreground">
                                    {log.employee.employee_code}
                                  </div>
                                </div>
                              ) : log.user ? (
                                <span className="text-foreground">{log.user.name}</span>
                              ) : (
                                <span className="text-muted-foreground italic">
                                  {t('settings.security.anonymousUser')}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="font-normal text-xs">
                                {getEventLabel(log.event_type)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-foreground">
                              {log.source_ip || '—'}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-foreground whitespace-nowrap">
                              {log.geofence_distance !== null &&
                              log.geofence_distance !== undefined ? (
                                <span>
                                  {log.geofence_distance} {t('settings.security.metersUnit')}
                                  {log.accuracy ? ` (±${Math.round(log.accuracy)})` : ''}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {log.overall_status === 'success' ? (
                                <Badge variant="success" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>{t('settings.security.resultPassed')}</span>
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  <span>{t('settings.security.resultRejected')}</span>
                                </Badge>
                              )}
                            </td>
                            <td
                              className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate"
                              title={log.failure_reason || ''}
                            >
                              {log.failure_reason || t('settings.security.validationPassedNote')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={scanLogsData.current_page}
                    lastPage={scanLogsData.last_page}
                    total={scanLogsData.total}
                    perPage={scanFilter.per_page}
                    onPageChange={(page) => setScanFilter((prev) => ({ ...prev, page }))}
                    onPerPageChange={(per_page) =>
                      setScanFilter((prev) => ({ ...prev, per_page, page: 1 }))
                    }
                    isLoading={isLogsFetching}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ─── Add / Edit Network Modal ─── */}
      <GlobalModal
        open={networkModalOpen}
        onOpenChange={setNetworkModalOpen}
        preventClose={saveNetworkMutation.isPending}
        size="sm"
        icon={<Wifi size={20} />}
        title={
          editingNetwork
            ? t('settings.security.editNetwork')
            : t('settings.security.addNetworkTitle')
        }
        description={t('settings.security.networkModalDesc')}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNetworkModalOpen(false)}
              disabled={saveNetworkMutation.isPending}
              className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form="hospital-network-form"
              size="sm"
              disabled={saveNetworkMutation.isPending}
              className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
            >
              {saveNetworkMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              <span>{t('common.save')}</span>
            </Button>
          </>
        }
      >
        <form id="hospital-network-form" onSubmit={handleSaveNetwork} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="net-name" className="text-xs font-medium">
                {t('settings.security.networkName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="net-name"
                value={networkForm.network_name}
                onChange={(e) => {
                  setNetworkForm((prev) => ({ ...prev, network_name: e.target.value }));
                  if (networkErrors.network_name) {
                    setNetworkErrors((prev) => ({ ...prev, network_name: undefined }));
                  }
                }}
                placeholder={t('settings.security.networkNamePlaceholder')}
                className={
                  networkErrors.network_name
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }
              />
              {networkErrors.network_name && (
                <p className="text-xs text-destructive">{networkErrors.network_name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="net-branch" className="text-xs font-medium">
                {t('settings.security.branchName')}
              </Label>
              <Input
                id="net-branch"
                value={networkForm.branch_name}
                onChange={(e) =>
                  setNetworkForm((prev) => ({ ...prev, branch_name: e.target.value }))
                }
                placeholder={t('settings.security.branchNamePlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="net-ip" className="text-xs font-medium">
                  {t('settings.security.allowedIp')}
                </Label>
                <Input
                  id="net-ip"
                  value={networkForm.allowed_ip}
                  onChange={(e) => {
                    setNetworkForm((prev) => ({ ...prev, allowed_ip: e.target.value }));
                    if (networkErrors.ip_or_cidr) {
                      setNetworkErrors((prev) => ({ ...prev, ip_or_cidr: undefined }));
                    }
                  }}
                  placeholder={t('settings.security.allowedIpPlaceholder')}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="net-cidr" className="text-xs font-medium">
                  {t('settings.security.allowedCidr')}
                </Label>
                <Input
                  id="net-cidr"
                  value={networkForm.allowed_cidr}
                  onChange={(e) => {
                    setNetworkForm((prev) => ({ ...prev, allowed_cidr: e.target.value }));
                    if (networkErrors.ip_or_cidr) {
                      setNetworkErrors((prev) => ({ ...prev, ip_or_cidr: undefined }));
                    }
                  }}
                  placeholder={t('settings.security.allowedCidrPlaceholder')}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            {networkErrors.ip_or_cidr ? (
              <p className="text-xs text-destructive -mt-2">{networkErrors.ip_or_cidr}</p>
            ) : (
              <p className="text-xs text-muted-foreground -mt-2">
                {t('settings.security.ipOrCidrHint')}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="net-desc" className="text-xs font-medium">
                {t('settings.security.description')}
              </Label>
              <Input
                id="net-desc"
                value={networkForm.description}
                onChange={(e) =>
                  setNetworkForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder={t('settings.security.descriptionPlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="net-status" className="text-xs font-medium">
                {t('settings.security.status')}
              </Label>
              <Select
                value={networkForm.status}
                onValueChange={(val) =>
                  setNetworkForm((prev) => ({
                    ...prev,
                    status: val as 'active' | 'inactive',
                  }))
                }
              >
                <SelectTrigger id="net-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </form>
      </GlobalModal>

      {/* ─── Add / Edit Geofence Modal ─── */}
      <GlobalModal
        open={geofenceModalOpen}
        onOpenChange={setGeofenceModalOpen}
        preventClose={saveGeofenceMutation.isPending}
        size="sm"
        icon={<MapPin size={20} />}
        title={
          editingGeofence
            ? t('settings.security.editGeofence')
            : t('settings.security.addGeofenceTitle')
        }
        description={t('settings.security.geofenceModalDesc')}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setGeofenceModalOpen(false)}
              disabled={saveGeofenceMutation.isPending}
              className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form="hospital-geofence-form"
              size="sm"
              disabled={saveGeofenceMutation.isPending}
              className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
            >
              {saveGeofenceMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              <span>{t('common.save')}</span>
            </Button>
          </>
        }
      >
        <form id="hospital-geofence-form" onSubmit={handleSaveGeofence} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="geo-name" className="text-xs font-medium">
                {t('settings.security.zoneName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="geo-name"
                value={geofenceForm.name}
                onChange={(e) => {
                  setGeofenceForm((prev) => ({ ...prev, name: e.target.value }));
                  if (geofenceErrors.name) {
                    setGeofenceErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                placeholder={t('settings.security.zoneNamePlaceholder')}
                className={
                  geofenceErrors.name
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }
              />
              {geofenceErrors.name && (
                <p className="text-xs text-destructive">{geofenceErrors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="geo-branch" className="text-xs font-medium">
                {t('settings.security.branchName')}
              </Label>
              <Input
                id="geo-branch"
                value={geofenceForm.branch_name}
                onChange={(e) =>
                  setGeofenceForm((prev) => ({ ...prev, branch_name: e.target.value }))
                }
                placeholder={t('settings.security.branchNamePlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="geo-lat" className="text-xs font-medium">
                  {t('settings.security.latitude')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="geo-lat"
                  value={geofenceForm.latitude}
                  onChange={(e) => {
                    setGeofenceForm((prev) => ({ ...prev, latitude: e.target.value }));
                    if (geofenceErrors.latitude) {
                      setGeofenceErrors((prev) => ({ ...prev, latitude: undefined }));
                    }
                  }}
                  placeholder="11.8891000"
                  className={`font-mono text-xs ${
                    geofenceErrors.latitude
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                {geofenceErrors.latitude && (
                  <p className="text-xs text-destructive">{geofenceErrors.latitude}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="geo-lng" className="text-xs font-medium">
                  {t('settings.security.longitude')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="geo-lng"
                  value={geofenceForm.longitude}
                  onChange={(e) => {
                    setGeofenceForm((prev) => ({ ...prev, longitude: e.target.value }));
                    if (geofenceErrors.longitude) {
                      setGeofenceErrors((prev) => ({ ...prev, longitude: undefined }));
                    }
                  }}
                  placeholder="105.8762000"
                  className={`font-mono text-xs ${
                    geofenceErrors.longitude
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                {geofenceErrors.longitude && (
                  <p className="text-xs text-destructive">{geofenceErrors.longitude}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="geo-radius" className="text-xs font-medium">
                  {t('settings.security.radiusMeters')}
                </Label>
                <Input
                  id="geo-radius"
                  type="number"
                  min={10}
                  max={5000}
                  value={geofenceForm.radius_meters}
                  onChange={(e) => {
                    setGeofenceForm((prev) => ({ ...prev, radius_meters: e.target.value }));
                    if (geofenceErrors.radius_meters) {
                      setGeofenceErrors((prev) => ({ ...prev, radius_meters: undefined }));
                    }
                  }}
                  className={
                    geofenceErrors.radius_meters
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }
                />
                {geofenceErrors.radius_meters && (
                  <p className="text-xs text-destructive">{geofenceErrors.radius_meters}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="geo-acc" className="text-xs font-medium">
                  {t('settings.security.maxAccuracyMeters')}
                </Label>
                <Input
                  id="geo-acc"
                  type="number"
                  min={5}
                  max={500}
                  value={geofenceForm.max_accuracy_meters}
                  onChange={(e) => {
                    setGeofenceForm((prev) => ({
                      ...prev,
                      max_accuracy_meters: e.target.value,
                    }));
                    if (geofenceErrors.max_accuracy_meters) {
                      setGeofenceErrors((prev) => ({
                        ...prev,
                        max_accuracy_meters: undefined,
                      }));
                    }
                  }}
                  className={
                    geofenceErrors.max_accuracy_meters
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }
                />
                {geofenceErrors.max_accuracy_meters && (
                  <p className="text-xs text-destructive">
                    {geofenceErrors.max_accuracy_meters}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="geo-desc" className="text-xs font-medium">
                {t('settings.security.description')}
              </Label>
              <Textarea
                id="geo-desc"
                rows={2}
                value={geofenceForm.description}
                onChange={(e) =>
                  setGeofenceForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder={t('settings.security.descriptionPlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="geo-status" className="text-xs font-medium">
                {t('settings.security.status')}
              </Label>
              <Select
                value={geofenceForm.status}
                onValueChange={(val) =>
                  setGeofenceForm((prev) => ({
                    ...prev,
                    status: val as 'active' | 'inactive',
                  }))
                }
              >
                <SelectTrigger id="geo-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </form>
      </GlobalModal>
    </div>
  );
};

export default HospitalAttendanceSecurityTab;
