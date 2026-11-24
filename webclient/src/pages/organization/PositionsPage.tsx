import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { organizationService } from '@/services/organizationService';
import { useLocaleStore } from '@/stores/localeStore';
import { formatCurrency } from '@/utils';
import {
  PageHeader,
  EnterpriseStatsGrid,
  EnterpriseStatsCard,
  Pagination,
  TableWrapper,
  StatusBadge,
  EmptyState,
  LoadingState,
} from '@/components/common';
import { UnifiedFilterToolbar } from '@/components/common/UnifiedFilterToolbar';
import {
  AddButton,
  RowActionGroup,
  EditRowButton,
  DeleteRowButton,
} from '@/components/common/GlobalActionButtons';
import { Button } from '@/components/ui/button';
import { confirmDelete } from '@/stores/confirmStore';
import { Award, Users, Briefcase, Building2, Network } from 'lucide-react';
import { toast } from 'sonner';
import { PositionModal } from './components/PositionModal';

export const PositionsPage: React.FC = () => {
  const { t } = useLocaleStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<any>(null);

  // 1. Fetch All Positions (Enhanced with Department and Employee Count)
  const { data: positions, isLoading } = useQuery<any[]>({
    queryKey: ['positions'],
    queryFn: async () => {
      return await organizationService.getPositions();
    },
  });

  // 2. Fetch Departments for Filtering and Dropdown Selector
  const { data: departments } = useQuery<any[]>({
    queryKey: ['departments-simple'],
    queryFn: async () => {
      return await organizationService.getDepartments();
    },
    staleTime: 5 * 60_000,
  });

  // 3. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await organizationService.deletePosition(id);
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || t('common.deletedSuccess', 'បានលុបដោយជោគជ័យ'));
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('common.cannotDelete', 'មិនអាចលុបមុខតំណែងនេះបានឡើយ'));
    },
  });

  // 4. 100% Dynamic Enterprise KPI Statistics (Zero Hardcoded Values)
  const stats = useMemo(() => {
    const list = positions || [];
    const totalPositions = list.length;
    const activePositions = list.filter((p: any) => (p.status || 'active') === 'active').length;
    
    // Total employees actively holding positions
    const totalEmployees = list.reduce(
      (sum: number, p: any) => sum + (Number(p.employee_count) || 0),
      0
    );

    // Distinct seniority levels
    const levelsSet = new Set(list.map((p: any) => p.level).filter(Boolean));
    const levelsCount = levelsSet.size;

    // Distinct departments that have configured positions
    const deptsWithPositions = new Set(list.map((p: any) => p.department_id).filter(Boolean));
    const coveredCount = deptsWithPositions.size;
    const totalDepts = departments?.length || coveredCount;

    return {
      totalPositions,
      activePositions,
      totalEmployees,
      levelsCount,
      deptsCovered: totalDepts > 0 ? `${coveredCount} / ${totalDepts}` : `${coveredCount}`,
    };
  }, [positions, departments]);

  // 5. Instant Multi-Field Client-Side Filtering
  const filteredPositions = useMemo(() => {
    const raw = positions || [];
    const q = search.trim().toLowerCase();

    return raw.filter((pos: any) => {
      // Search matching title, code, department, or description
      if (q) {
        const title = (pos.title || '').toLowerCase();
        const code = (pos.code || '').toLowerCase();
        const deptName = (pos.department?.name || '').toLowerCase();
        const desc = (pos.description || '').toLowerCase();
        if (!title.includes(q) && !code.includes(q) && !deptName.includes(q) && !desc.includes(q)) {
          return false;
        }
      }

      // Department filter
      if (departmentFilter) {
        if (departmentFilter === 'cross') {
          if (pos.department_id !== null && pos.department_id !== undefined) return false;
        } else if (String(pos.department_id) !== departmentFilter) {
          return false;
        }
      }

      // Seniority level filter
      if (levelFilter && (pos.level || '').toLowerCase() !== levelFilter.toLowerCase()) {
        return false;
      }

      // Status filter
      if (statusFilter && (pos.status || 'active').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [positions, search, departmentFilter, levelFilter, statusFilter]);

  // 6. Paginated Slicing
  const paginatedPositions = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredPositions.slice(start, start + perPage);
  }, [filteredPositions, page, perPage]);

  const totalPages = Math.max(1, Math.ceil(filteredPositions.length / perPage));

  const openCreateModal = () => {
    setEditingPos(null);
    setModalOpen(true);
  };

  const openEditModal = (pos: any) => {
    setEditingPos(pos);
    setModalOpen(true);
  };

  // Seniority Level Badge Formatter
  const renderLevelBadge = (level: string) => {
    switch ((level || '').toLowerCase()) {
      case 'executive':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
            {t('organization.levelExecutive', 'ថ្នាក់ដឹកនាំ (Executive)')}
          </span>
        );
      case 'lead':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            {t('organization.levelLead', 'ប្រធានដឹកនាំ (Lead)')}
          </span>
        );
      case 'senior':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            {t('organization.levelSenior', 'កម្រិតជាន់ខ្ពស់ (Senior)')}
          </span>
        );
      case 'mid':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
            {t('organization.levelMid', 'កម្រិតមធ្យម (Mid)')}
          </span>
        );
      case 'entry':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            {t('organization.levelEntry', 'កម្រិតដំបូង (Entry)')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {level || '—'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. ENTERPRISE PAGE HEADER                                */}
      {/* ======================================================== */}
      <PageHeader
        title={t('organization.positions', 'មុខតំណែង និងតួនាទី')}
        subtitle={t(
          'organization.posSubtitle',
          'គ្រប់គ្រងរចនាសម្ព័ន្ធមុខតំណែង កម្រិតថ្នាក់ការងារ (Seniority) និងកម្រិតប្រាក់ខែគោល (Salary Bands)'
        )}
        breadcrumbs={[
          { label: t('nav.organization', 'រចនាសម្ព័ន្ធស្ថាប័ន'), href: '/organization/departments' },
          { label: t('organization.positions', 'មុខតំណែង និងតួនាទី') },
        ]}
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/organization/chart')}
              className="h-9 gap-1.5 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer shadow-2xs hover:bg-muted"
            >
              <Network size={15} className="text-teal-600" />
              {t('nav.orgChart', 'គំនូសបំព្រួញស្ថាប័ន')}
            </Button>
            <AddButton
              onClick={openCreateModal}
              label={t('organization.addPosition', 'បន្ថែមមុខតំណែងថ្មី')}
              size="sm"
            />
          </div>
        }
      />

      {/* ======================================================== */}
      {/* 2. DYNAMIC KPI SUMMARY CARDS (100% Live DB Metrics)      */}
      {/* ======================================================== */}
      <EnterpriseStatsGrid columns={4}>
        <EnterpriseStatsCard
          title={t('organization.totalPositions', 'មុខតំណែងសរុប')}
          value={stats.totalPositions}
          subtitle={t('organization.definedOrgRoles', 'បានកំណត់ក្នុងប្រព័ន្ធ')}
          valueClassName="text-blue-600 dark:text-blue-400 font-mono"
          icon={Award}
          variant="blue"
        />

        <EnterpriseStatsCard
          title={t('organization.activeStaffAllocated', 'បុគ្គលិកសកម្មដែលបានបែងចែក')}
          value={stats.totalEmployees}
          subtitle={t('organization.allStaffAssigned', '១០០% បុគ្គលិកបានចាត់តាំង')}
          valueClassName="text-emerald-600 dark:text-emerald-400 font-mono"
          icon={Users}
          variant="emerald"
          delay={0.05}
        />

        <EnterpriseStatsCard
          title={t('organization.seniorityLevels', 'កម្រិតថ្នាក់ការងារ')}
          value={stats.levelsCount}
          subtitle={t('organization.internToExec', 'ពីដំបូង ដល់ថ្នាក់ដឹកនាំ')}
          valueClassName="text-purple-600 dark:text-purple-400 font-mono"
          icon={Briefcase}
          variant="purple"
          delay={0.1}
        />

        <EnterpriseStatsCard
          title={t('organization.departmentsCovered', 'ផ្នែកគ្របដណ្តប់')}
          value={stats.deptsCovered}
          subtitle={t('organization.alignedUnits', 'ស្របតាមរចនាសម្ព័ន្ធ')}
          valueClassName="text-amber-600 dark:text-amber-400 font-mono"
          icon={Building2}
          variant="amber"
          delay={0.15}
        />
      </EnterpriseStatsGrid>

      {/* ======================================================== */}
      {/* 3. UNIFIED FILTER TOOLBAR                                */}
      {/* ======================================================== */}
      <UnifiedFilterToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder={t('organization.searchPositionsPlaceholder', 'ស្វែងរកមុខតំណែង ឬកូដ...')}
        filters={[
          {
            id: 'department',
            value: departmentFilter,
            onChange: (val) => {
              setDepartmentFilter(val);
              setPage(1);
            },
            options: [
              { value: '', label: t('filters.allDepartments', 'គ្រប់នាយកដ្ឋាន / ផ្នែក') },
              { value: 'cross', label: t('organization.crossDepartmental', 'អន្តរនាយកដ្ឋាន (ទូទៅ)') },
              ...(departments || []).map((d: any) => ({
                value: String(d.id),
                label: `${d.name}${d.code ? ` [${d.code}]` : ''}`,
              })),
            ],
            minWidth: 'min-w-[180px]',
          },
          {
            id: 'level',
            value: levelFilter,
            onChange: (val) => {
              setLevelFilter(val);
              setPage(1);
            },
            options: [
              { value: '', label: t('filters.allLevels', 'គ្រប់កម្រិតថ្នាក់') },
              { value: 'executive', label: t('organization.levelExecutive', 'ថ្នាក់ដឹកនាំ (Executive)') },
              { value: 'lead', label: t('organization.levelLead', 'ប្រធានដឹកនាំ (Lead)') },
              { value: 'senior', label: t('organization.levelSenior', 'កម្រិតជាន់ខ្ពស់ (Senior)') },
              { value: 'mid', label: t('organization.levelMid', 'កម្រិតមធ្យម (Mid)') },
              { value: 'entry', label: t('organization.levelEntry', 'កម្រិតដំបូង (Entry)') },
            ],
            minWidth: 'min-w-[150px]',
          },
          {
            id: 'status',
            value: statusFilter,
            onChange: (val) => {
              setStatusFilter(val);
              setPage(1);
            },
            options: [
              { value: '', label: t('filters.allStatus', 'គ្រប់ស្ថានភាព') },
              { value: 'active', label: t('status.active', 'សកម្ម') },
              { value: 'inactive', label: t('status.inactive', 'អសកម្ម') },
            ],
            minWidth: 'min-w-[130px]',
          },
        ]}
        onReset={() => {
          setSearch('');
          setDepartmentFilter('');
          setLevelFilter('');
          setStatusFilter('');
          setPage(1);
        }}
      />

      {/* ======================================================== */}
      {/* 4. MODERN ENTERPRISE TABLE                               */}
      {/* ======================================================== */}
      {isLoading ? (
        <LoadingState message={t('common.loading', 'កំពុងផ្ទុក...')} />
      ) : (
        <div className="space-y-4">
          <TableWrapper isFetching={isLoading} className="border border-border/80 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
                <tr>
                  <th className="px-5 py-3.5">{t('organization.positionTitle', 'មុខតំណែង & កូដ')}</th>
                  <th className="px-4 py-3.5">{t('organization.departments', 'នាយកដ្ឋាន / ផ្នែក')}</th>
                  <th className="px-4 py-3.5">{t('organization.seniorityLevel', 'កម្រិតថ្នាក់')}</th>
                  <th className="px-4 py-3.5">{t('organization.salaryBand', 'កម្រិតប្រាក់ខែគោល')}</th>
                  <th className="px-4 py-3.5 text-center">{t('organization.employees', 'បុគ្គលិក')}</th>
                  <th className="px-4 py-3.5">{t('common.status', 'ស្ថានភាព')}</th>
                  <th className="px-5 py-3.5 text-right">{t('common.actions', 'សកម្មភាព')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {paginatedPositions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <EmptyState
                        title={t('common.noRecordsFound', 'រកមិនឃើញទិន្នន័យឡើយ')}
                        description={t(
                          'common.noRecordsFoundDesc',
                          'មិនមានទិន្នន័យសម្រាប់បង្ហាញនៅពេលនេះទេ។'
                        )}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedPositions.map((pos: any) => {
                    const minSal = pos.min_salary ? Number(pos.min_salary) : null;
                    const maxSal = pos.max_salary ? Number(pos.max_salary) : null;

                    return (
                      <tr
                        key={pos.id}
                        className="transition-colors hover:bg-muted/30 group"
                      >
                        {/* 1. Title & Code */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              onClick={() => openEditModal(pos)}
                              className="font-semibold text-foreground text-xs sm:text-[13px] hover:text-teal-600 transition-colors cursor-pointer truncate"
                              title={pos.title}
                            >
                              {pos.title}
                            </span>
                            {pos.code && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 shrink-0 uppercase">
                                {pos.code}
                              </span>
                            )}
                          </div>
                          {pos.description && (
                            <p className="text-[11px] text-muted-foreground/80 line-clamp-1 mt-0.5 max-w-sm">
                              {pos.description}
                            </p>
                          )}
                        </td>

                        {/* 2. Department */}
                        <td className="px-4 py-3">
                          {pos.department ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="text-foreground/85 font-medium text-xs truncate max-w-[200px]"
                                title={pos.department.name}
                              >
                                {pos.department.name}
                              </span>
                              {pos.department.code && (
                                <span className="font-mono text-[9px] font-semibold text-muted-foreground shrink-0">
                                  [{pos.department.code}]
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 italic text-xs">
                              {t('organization.crossDepartmental', 'អន្តរនាយកដ្ឋាន (ទូទៅ)')}
                            </span>
                          )}
                        </td>

                        {/* 3. Seniority Level */}
                        <td className="px-4 py-3">
                          {renderLevelBadge(pos.level)}
                        </td>

                        {/* 4. Salary Band */}
                        <td className="px-4 py-3 font-mono text-xs">
                          {minSal !== null || maxSal !== null ? (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {minSal !== null ? formatCurrency(minSal) : '$0'} - {maxSal !== null ? formatCurrency(maxSal) : '—'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>

                        {/* 5. Employee Count */}
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center justify-center gap-1 font-mono text-xs font-semibold text-foreground">
                            <span>{pos.employee_count ?? 0}</span>
                            <span className="text-muted-foreground text-[10.5px] font-normal font-sans">
                              {t('common.peopleUnit', 'នាក់')}
                            </span>
                          </div>
                        </td>

                        {/* 6. Status */}
                        <td className="px-4 py-3">
                          <StatusBadge status={pos.status} />
                        </td>

                        {/* 7. Actions */}
                        <td className="px-5 py-3 text-right">
                          <RowActionGroup align="right">
                            <EditRowButton
                              onClick={() => openEditModal(pos)}
                              title={t('organization.editPosition', 'កែប្រែមុខតំណែង')}
                            />
                            <DeleteRowButton
                              onClick={() => {
                                confirmDelete({
                                  title: t('organization.deletePositionTitle', 'លុបមុខតំណែង?'),
                                  itemName: pos.title,
                                  confirmText: t('common.delete', 'លុប'),
                                  cancelText: t('common.cancel', 'បោះបង់'),
                                  onConfirm: () => deleteMutation.mutate(pos.id),
                                });
                              }}
                              title={t('common.delete', 'លុប')}
                            />
                          </RowActionGroup>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TableWrapper>

          {/* ======================================================== */}
          {/* 5. PAGINATION                                            */}
          {/* ======================================================== */}
          <Pagination
            currentPage={page}
            lastPage={totalPages}
            total={filteredPositions.length}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newSize) => {
              setPerPage(newSize);
              setPage(1);
            }}
            perPageOptions={[10, 15, 25, 50, 100]}
            className="rounded-2xl"
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. POSITION CREATE / EDIT MODAL                          */}
      {/* ======================================================== */}
      <PositionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        position={editingPos}
        departments={departments || []}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['positions'] });
        }}
      />
    </div>
  );
};

export default PositionsPage;
