import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@/services/assignmentService';
import { employeeService } from '@/services/employeeService';
import { organizationService } from '@/services/organizationService';
import { useLocaleStore } from '../../stores/localeStore';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { formatDate } from '@/utils';
import {
  GitFork,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  MapPin,
  UserCheck,
  CalendarDays,
  Info,
} from 'lucide-react';
import { UnifiedFilterToolbar } from '@/components/common/UnifiedFilterToolbar';
import { AddButton } from '@/components/common/GlobalActionButtons';
import {
  EnterpriseStatsGrid,
  EnterpriseStatsCard,
  TableWrapper,
  Pagination,
  EmptyState,
} from '@/components/common';
import {
  RecordTransferModal,
  RecordTransferFormValues,
} from './components/RecordTransferModal';

export const AssignmentsPage: React.FC = () => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // ─── Server-side paginated assignments ───────────────────────────────────
  const { data: assignmentsResponse, isLoading } = useQuery({
    queryKey: ['assignments-list', page, perPage, departmentFilter, statusFilter, search],
    queryFn: () =>
      assignmentService.getAssignments({
        page,
        per_page: perPage,
        department_id: departmentFilter || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      }),
  });

  // ─── Summary counts — fetch all with large per_page for KPI accuracy ─────
  const { data: summaryResponse } = useQuery({
    queryKey: ['assignments-summary'],
    queryFn: () =>
      assignmentService.getAssignments({ per_page: 500 }),
    staleTime: 60_000,
  });

  // ─── Auxiliary data ───────────────────────────────────────────────────────
  const { data: employeesData } = useQuery({
    queryKey: ['employees-assignments-dropdown'],
    queryFn: async () => {
      const res = await employeeService.getEmployees({ per_page: 250 });
      return Array.isArray(res) ? res : res.data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-assignments-dropdown'],
    queryFn: async () => {
      const res = await organizationService.getDepartments();
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: positionsData } = useQuery({
    queryKey: ['positions-assignments-dropdown'],
    queryFn: async () => {
      const res = await organizationService.getPositions();
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: locations } = useQuery({
    queryKey: ['locations-all'],
    queryFn: () => organizationService.getWorkLocations(),
  });

  // ─── Normalized Auxiliary Lists ──────────────────────────────────────────
  const employeesList: any[] = Array.isArray(employeesData)
    ? employeesData
    : Array.isArray((employeesData as any)?.data)
    ? (employeesData as any).data
    : [];

  const departmentsList: any[] = Array.isArray(departmentsData)
    ? departmentsData
    : Array.isArray((departmentsData as any)?.data)
    ? (departmentsData as any).data
    : [];

  const positionsList: any[] = Array.isArray(positionsData)
    ? positionsData
    : Array.isArray((positionsData as any)?.data)
    ? (positionsData as any).data
    : [];

  // ─── Derived values ───────────────────────────────────────────────────────
  const assignments: any[] = Array.isArray(assignmentsResponse)
    ? assignmentsResponse
    : Array.isArray(assignmentsResponse?.data)
    ? assignmentsResponse.data
    : [];
  const paginationMeta = assignmentsResponse?.meta;
  const totalRecords = assignmentsResponse?.total ?? paginationMeta?.total ?? assignments.length;
  const lastPage = assignmentsResponse?.last_page ?? paginationMeta?.last_page ?? Math.max(1, Math.ceil(totalRecords / perPage));

  const displayedAssignments = assignments;

  // KPI from summary data
  const allAssignments: any[] = Array.isArray(summaryResponse)
    ? summaryResponse
    : Array.isArray(summaryResponse?.data)
    ? summaryResponse.data
    : [];
  const kpiTotal = summaryResponse?.total ?? summaryResponse?.meta?.total ?? allAssignments.length;
  const kpiActive = allAssignments.filter((a: any) => a.is_primary && a.status === 'active').length;
  const kpiTransfers = allAssignments.filter((a: any) => !a.is_primary || a.status === 'ended').length;
  const kpiDepts = departmentsList.length;

  // ─── Transfer mutation ────────────────────────────────────────────────────
  const transferMutation = useMutation({
    mutationFn: (values: RecordTransferFormValues) => {
      const payload: any = {
        employee_id: Number(values.employee_id),
        department_id: Number(values.department_id),
        position_id: Number(values.position_id),
        supervisor_id: values.supervisor_id ? Number(values.supervisor_id) : null,
        start_date: values.start_date,
        is_primary: values.is_primary,
        status: values.status,
        notes: values.notes,
      };
      return assignmentService.createAssignment(payload);
    },
    onSuccess: (res: any) => {
      toast.success(res?.message ?? 'កត់ត្រាការផ្ទេរការងារដោយជោគជ័យ');
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['assignments-list'] });
      queryClient.invalidateQueries({ queryKey: ['assignments-summary'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'មិនអាចកត់ត្រាការផ្ទេរការងារបានទេ');
    },
  });

  // ─── Locale helper ────────────────────────────────────────────────────────
  const locale = (useLocaleStore.getState?.() as any)?.locale ?? 'km';

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title={t('assignments.title')}
        subtitle={t('assignments.subtitle')}
        breadcrumbs={[
          { label: t('nav.employees') },
          { label: t('assignments.title') },
        ]}
        action={
          <AddButton
            onClick={() => setModalOpen(true)}
            label={t('assignments.recordTransfer')}
            size="sm"
          />
        }
      />

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <EnterpriseStatsGrid columns={4}>
        <EnterpriseStatsCard
          title={t('assignments.totalAssignments')}
          value={kpiTotal}
          subtitle={t('assignments.allAssignments')}
          icon={GitFork}
          variant="blue"
        />
        <EnterpriseStatsCard
          title={t('assignments.activePlacements')}
          value={kpiActive}
          subtitle={t('assignments.primaryOperational')}
          icon={ShieldCheck}
          variant="emerald"
          delay={0.05}
        />
        <EnterpriseStatsCard
          title={t('assignments.internalTransfers')}
          value={kpiTransfers}
          subtitle={t('assignments.historicalMobility')}
          icon={ArrowRight}
          variant="purple"
          delay={0.1}
        />
        <EnterpriseStatsCard
          title={t('assignments.activeDepartments')}
          value={kpiDepts}
          subtitle={t('assignments.businessUnits')}
          icon={Building2}
          variant="amber"
          delay={0.15}
        />
      </EnterpriseStatsGrid>

      {/* ── Info Notice ───────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <p className="leading-relaxed">{t('assignments.transferNotice')}</p>
      </div>

      {/* ── Filter Toolbar ────────────────────────────────────────────────── */}
      <UnifiedFilterToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder={t('assignments.searchPlaceholder')}
        filters={[
          {
            id: 'department',
            value: departmentFilter,
            onChange: (val) => {
              setDepartmentFilter(val);
              setPage(1);
            },
            options: [
              { value: '', label: t('filters.allDepartments') },
              ...departmentsList.map((d: any) => ({
                value: String(d.id),
                label: d.name,
              })),
            ],
            minWidth: 'min-w-[160px]',
          },
          {
            id: 'status',
            value: statusFilter,
            onChange: (val) => {
              setStatusFilter(val);
              setPage(1);
            },
            options: [
              { value: '', label: t('filters.allStatus') },
              { value: 'active', label: t('status.active') },
              { value: 'ended', label: t('status.ended') },
              { value: 'pending', label: t('status.pending') },
            ],
            minWidth: 'min-w-[140px]',
          },
        ]}
        onReset={() => {
          setSearch('');
          setDepartmentFilter('');
          setStatusFilter('');
          setPage(1);
        }}
      />

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingState message={t('common.loading')} />
      ) : (
        <div className="space-y-3">
          <TableWrapper>
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      {t('assignments.employee')}
                    </div>
                  </th>
                  <th className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" />
                      {t('assignments.department')}
                    </div>
                  </th>
                  <th className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3 w-3" />
                      {t('assignments.position')}
                    </div>
                  </th>
                  <th className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {t('assignments.workLocation')}
                    </div>
                  </th>
                  <th className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <GitFork className="h-3 w-3" />
                      {t('assignments.supervisor')}
                    </div>
                  </th>
                  <th className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3" />
                      {t('assignments.effectiveDuration')}
                    </div>
                  </th>
                  <th className="px-4 py-3.5">{t('assignments.typeStatus')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {displayedAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <EmptyState
                        title={t('assignments.noAssignments')}
                        description={t('assignments.noAssignmentsDesc')}
                      />
                    </td>
                  </tr>
                ) : (
                  displayedAssignments.map((asg: any) => (
                    <tr
                      key={asg.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      {/* Employee */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                            {(asg.employee?.full_name ?? asg.employee?.first_name ?? '?')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {asg.employee?.full_name ??
                                `${asg.employee?.first_name ?? ''} ${asg.employee?.last_name ?? ''}`.trim()}
                            </div>
                            <span className="font-mono text-[10px] text-primary">
                              {asg.employee?.employee_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-foreground">
                          {asg.department?.name ?? '—'}
                        </span>
                      </td>

                      {/* Position */}
                      <td className="px-4 py-3.5">
                        <div>
                          <div className="font-medium text-foreground">
                            {asg.position?.title ?? '—'}
                          </div>
                          {asg.position?.level && (
                            <span className="text-[10px] text-muted-foreground">
                              {asg.position.level}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Work Location */}
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {asg.work_location?.name ?? t('assignments.headquarters')}
                      </td>

                      {/* Supervisor */}
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {(() => {
                          const name = asg.supervisor?.full_name
                            ?? `${asg.supervisor?.first_name ?? ''} ${asg.supervisor?.last_name ?? ''}`.trim();
                          return name || t('assignments.ceoBoard');
                        })()}
                      </td>

                      {/* Effective Duration */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {formatDate(asg.start_date, locale)}
                          <span className="mx-1 text-muted-foreground/50">→</span>
                          {asg.end_date
                            ? formatDate(asg.end_date, locale)
                            : <span className="text-emerald-600 dark:text-emerald-400">{t('assignments.present')}</span>}
                        </div>
                      </td>

                      {/* Type & Status */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {asg.is_primary ? (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">
                              {t('assignments.primary')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {t('assignments.historical')}
                            </Badge>
                          )}
                          <StatusBadge status={asg.status} />
                        </div>
                        {asg.notes && (
                          <p className="mt-0.5 max-w-[160px] truncate text-[10px] italic text-muted-foreground">
                            {asg.notes}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrapper>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            lastPage={lastPage}
            total={totalRecords}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newSize) => {
              setPerPage(newSize);
              setPage(1);
            }}
            perPageOptions={[10, 20, 50]}
            className="rounded-2xl"
          />
        </div>
      )}

      {/* ── Record Transfer Modal (Standard Global Enterprise Style) ───── */}
      <RecordTransferModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        employees={employeesList}
        departments={departmentsList}
        positions={positionsList}
        onSubmit={(values) => transferMutation.mutate(values)}
        isPending={transferMutation.isPending}
      />
    </div>
  );
};
