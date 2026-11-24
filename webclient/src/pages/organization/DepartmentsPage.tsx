import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { organizationService } from '@/services/organizationService';
import { employeeService } from '@/services/employeeService';
import { useLocaleStore } from '@/stores/localeStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  GitFork,
  UserCheck,
  Network,
} from 'lucide-react';
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
  ViewRowButton,
} from '@/components/common/GlobalActionButtons';
import { confirmDelete } from '@/stores/confirmStore';
import { DeptDetailDialog } from './components/org-chart/DeptDetailDialog';
import { DepartmentModal } from './components/DepartmentModal';
import { DepartmentNode } from './components/org-chart/OrgNodeCard';
import { getAbsoluteImageUrl } from '@/utils/image';
import { cn } from '@/utils';

// Clean Avatar Palette for Managers
const avatarColorPalettes = [
  'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60',
  'bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60',
  'bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/60',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
  'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
  'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
  'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
];

const getAvatarColorClass = (id: number): string => {
  return avatarColorPalettes[Math.abs(id) % avatarColorPalettes.length];
};

const getInitials = (m?: any) => {
  if (!m) return '??';
  if (m.first_name && m.last_name) {
    return `${m.first_name[0]}.${m.last_name[0]}`;
  }
  const name = m.full_name || '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}.${parts[parts.length - 1][0]}`;
  }
  return name.slice(0, 2) || '??';
};

export const DepartmentsPage: React.FC = () => {
  const { t } = useLocaleStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [parentFilter, setParentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [selectedDetailDept, setSelectedDetailDept] = useState<DepartmentNode | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Fetch departments from live API (enhanced with parent, manager, positions, and counts)
  const { data: departments, isLoading } = useQuery<any[]>({
    queryKey: ['departments', search],
    queryFn: async () => {
      return await organizationService.getDepartments({ search });
    },
  });

  // Fetch employees for manager dropdown selector
  const { data: employeesData } = useQuery({
    queryKey: ['employees-list-all'],
    queryFn: async () => {
      const res = await employeeService.getEmployees({ per_page: 250 });
      return res.data;
    },
    staleTime: 5 * 60_000,
  });

  const openCreateModal = () => {
    setEditingDept(null);
    setModalOpen(true);
  };

  const openEditModal = (dept: any) => {
    setEditingDept(dept);
    setModalOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await organizationService.deleteDepartment(id);
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || t('common.success', 'ប្រតិបត្តិការបានជោគជ័យ'));
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['org-chart-tree'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('common.error', 'មិនអាចលុបបានទេ'));
    },
  });

  const rawDeptList = useMemo(() => departments || [], [departments]);

  // 100% Dynamic Enterprise KPI Statistics
  const stats = useMemo(() => {
    const totalDepts = rawDeptList.length;
    let totalEmployees = 0;
    let assignedLeads = 0;
    let subUnitsCount = 0;

    rawDeptList.forEach((d: any) => {
      totalEmployees += (d.employee_count ?? 0);
      if (d.manager_id || d.manager) {
        assignedLeads += 1;
      }
      if (d.parent_id) {
        subUnitsCount += 1;
      }
    });

    return {
      totalDepts,
      totalEmployees,
      assignedLeads,
      subUnitsCount,
    };
  }, [rawDeptList]);

  // Filtered department list
  const filteredDepts = useMemo(() => {
    return rawDeptList.filter((d: any) => {
      if (parentFilter) {
        if (parentFilter === 'root') {
          if (d.parent_id !== null) return false;
        } else if (String(d.parent_id) !== parentFilter) {
          return false;
        }
      }
      if (statusFilter && (d.status || 'active').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [rawDeptList, parentFilter, statusFilter]);

  const paginatedDepts = useMemo(() => {
    return filteredDepts.slice((page - 1) * perPage, page * perPage);
  }, [filteredDepts, page, perPage]);

  // Unique parent options for filtering
  const parentFilterOptions = useMemo(() => {
    const parentMap = new Map<number, string>();
    rawDeptList.forEach((d: any) => {
      if (d.parent && !parentMap.has(d.parent.id)) {
        parentMap.set(d.parent.id, d.parent.name);
      }
    });

    return [
      { value: '', label: t('filters.allParents', 'គ្រប់ផ្នែកមេ') },
      { value: 'root', label: t('organization.executiveUnit', 'ថ្នាក់ដឹកនាំកំពូល (Root)') },
      ...Array.from(parentMap.entries()).map(([id, name]) => ({
        value: String(id),
        label: name,
      })),
    ];
  }, [rawDeptList, t]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. ENTERPRISE HEADER BAR                                 */}
      {/* ======================================================== */}
      <PageHeader
        title={t('organization.departments', 'នាយកដ្ឋាន')}
        subtitle={t(
          'organization.deptSubtitle',
          'រចនាសម្ព័ន្ធអង្គភាព ប្រធានផ្នែក និងចំនួនបុគ្គលិក'
        )}
        breadcrumbs={[
          { label: t('nav.orgStructure', 'រចនាសម្ព័ន្ធស្ថាប័ន'), href: '/organization/departments' },
          { label: t('organization.departments', 'នាយកដ្ឋាន') },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/organization/chart')}
              className="h-9 gap-1.5 text-xs font-semibold rounded-xl border-border/80 shadow-2xs hover:bg-muted"
            >
              <Network className="size-3.5 text-sky-600 dark:text-sky-400" />
              <span>{t('organization.orgChart', 'គំនូសបំព្រួញស្ថាប័ន')}</span>
            </Button>

            <AddButton
              size="sm"
              onClick={openCreateModal}
              label={t('organization.addDepartment', 'បន្ថែមនាយកដ្ឋាន')}
            />
          </div>
        }
      />

      {/* ======================================================== */}
      {/* 2. DYNAMIC KPI SUMMARY CARDS                             */}
      {/* ======================================================== */}
      <EnterpriseStatsGrid columns={4}>
        <EnterpriseStatsCard
          title={t('organization.totalDepts', 'ផ្នែកសរុប')}
          value={stats.totalDepts}
          subtitle={t('organization.campusesAndOffices', 'អង្គភាព និងផ្នែកទាំងអស់')}
          icon={Building2}
          variant="blue"
        />

        <EnterpriseStatsCard
          title={t('organization.activeStaffAllocated', 'បុគ្គលិកបំពេញការងារ')}
          value={stats.totalEmployees}
          subtitle={t('organization.allStaffAssigned', '១០០% បុគ្គលិកបានចាត់តាំង')}
          valueClassName="text-emerald-600 dark:text-emerald-400 font-mono"
          icon={Users}
          variant="emerald"
          delay={0.05}
        />

        <EnterpriseStatsCard
          title={t('organization.assignedLeads', 'ប្រធានផ្នែក')}
          value={`${stats.assignedLeads} / ${stats.totalDepts}`}
          subtitle={t('organization.definedOrgRoles', 'មានអ្នកទទួលខុសត្រូវពេញលេញ')}
          valueClassName="text-purple-600 dark:text-purple-400 font-mono"
          icon={UserCheck}
          variant="purple"
          delay={0.1}
        />

        <EnterpriseStatsCard
          title={t('organization.subUnits', 'ផ្នែករង')}
          value={stats.subUnitsCount}
          subtitle={t('organization.alignedUnits', 'អង្គភាពកម្រិតក្រោម')}
          valueClassName="text-amber-600 dark:text-amber-400 font-mono"
          icon={GitFork}
          variant="amber"
          delay={0.15}
        />
      </EnterpriseStatsGrid>

      {/* ======================================================== */}
      {/* 3. UNIFIED SEARCH & FILTER TOOLBAR                       */}
      {/* ======================================================== */}
      <UnifiedFilterToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder={t(
          'organization.searchDepartmentsPlaceholder',
          'ស្វែងរកឈ្មោះ ឬកូដនាយកដ្ឋាន...'
        )}
        filters={[
          {
            id: 'parent',
            value: parentFilter,
            onChange: (val) => {
              setParentFilter(val);
              setPage(1);
            },
            options: parentFilterOptions,
            minWidth: 'min-w-[170px]',
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
          setParentFilter('');
          setStatusFilter('');
          setPage(1);
        }}
      />

      {/* ======================================================== */}
      {/* 4. CLEAN ENTERPRISE DATA TABLE                           */}
      {/* ======================================================== */}
      {isLoading ? (
        <LoadingState message={t('common.loading', 'កំពុងផ្ទុក...')} />
      ) : (
        <div className="space-y-4">
          <TableWrapper isFetching={isLoading} className="border border-border/80 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
                <tr>
                  <th className="px-5 py-3.5">{t('organization.deptName', 'ឈ្មោះនាយកដ្ឋាន')}</th>
                  <th className="px-4 py-3.5">{t('organization.parentDept', 'នាយកដ្ឋានមេ')}</th>
                  <th className="px-4 py-3.5">{t('organization.manager', 'ប្រធានផ្នែក')}</th>
                  <th className="px-4 py-3.5 text-center">{t('organization.positions', 'មុខតំណែង')}</th>
                  <th className="px-4 py-3.5 text-center">{t('organization.directStaff', 'បុគ្គលិក')}</th>
                  <th className="px-4 py-3.5 text-center">{t('organization.subUnits', 'ផ្នែករង')}</th>
                  <th className="px-4 py-3.5">{t('common.status', 'ស្ថានភាព')}</th>
                  <th className="px-5 py-3.5 text-right">{t('common.actions', 'សកម្មភាព')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {paginatedDepts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
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
                  paginatedDepts.map((dept: any) => {
                    const manager = dept.manager;
                    const avatarSrc = manager?.avatar_url
                      ? getAbsoluteImageUrl(manager.avatar_url)
                      : null;

                    return (
                      <tr
                        key={dept.id}
                        className="transition-colors hover:bg-muted/30 group"
                      >
                        {/* 1. Department Name & Code (Clean & Minimal) */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              onClick={() => setSelectedDetailDept(dept)}
                              className="font-semibold text-foreground text-xs sm:text-[13px] hover:text-primary transition-colors cursor-pointer truncate"
                              title={dept.name}
                            >
                              {dept.name}
                            </span>
                            {dept.code && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 shrink-0">
                                {dept.code}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Parent Department */}
                        <td className="px-4 py-3">
                          {dept.parent ? (
                            <span
                              className="text-foreground/80 font-medium text-xs truncate max-w-[170px] block"
                              title={dept.parent.name}
                            >
                              {dept.parent.name}
                            </span>
                          ) : (
                            <span className="text-sky-700 dark:text-sky-400 font-semibold text-xs">
                              {t('organization.executiveUnit', 'ថ្នាក់ដឹកនាំកំពូល')}
                            </span>
                          )}
                        </td>

                        {/* 3. Department Head (Photo / Initials + Name + Title) */}
                        <td className="px-4 py-3">
                          {manager ? (
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={cn(
                                  'size-8 min-w-[32px] min-h-[32px] rounded-lg overflow-hidden flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 select-none border',
                                  getAvatarColorClass(manager.id)
                                )}
                              >
                                {avatarSrc ? (
                                  <img
                                    src={avatarSrc}
                                    alt={manager.full_name}
                                    className="size-full object-cover shrink-0"
                                    loading="lazy"
                                  />
                                ) : (
                                  <span>{getInitials(manager)}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <span
                                  className="font-bold text-foreground text-xs block truncate leading-tight"
                                  title={manager.full_name}
                                >
                                  {manager.full_name}
                                </span>
                                <span className="text-[10.5px] text-muted-foreground truncate block font-mono mt-0.5">
                                  {manager.primary_assignment?.position?.title || manager.employee_code || '—'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50 italic text-[11px]">
                              {t('organization.unassignedLead', 'មិនទាន់ចាត់តាំង')}
                            </span>
                          )}
                        </td>

                        {/* 4. Positions Count */}
                        <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                          {dept.positions?.length || 0}
                        </td>

                        {/* 5. Direct Employee Count */}
                        <td className="px-4 py-3 text-center font-mono text-xs font-semibold text-foreground">
                          {dept.employee_count ?? 0}
                        </td>

                        {/* 6. Sub-Units Count */}
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {(dept.children_count ?? 0) > 0 ? (
                            <span className="text-sky-600 dark:text-sky-400 font-semibold">
                              {dept.children_count}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* 7. Status Badge */}
                        <td className="px-4 py-3">
                          <StatusBadge status={dept.status || 'active'} />
                        </td>

                        {/* 8. Row Action Buttons */}
                        <td className="px-5 py-3 text-right">
                          <RowActionGroup align="right">
                            <ViewRowButton
                              onClick={() => setSelectedDetailDept(dept)}
                              title={t('organization.viewDetails', 'មើលព័ត៌មានលម្អិត')}
                            />
                            <EditRowButton
                              onClick={() => openEditModal(dept)}
                              title={t('organization.editDepartment', 'កែប្រែនាយកដ្ឋាន')}
                            />
                            <DeleteRowButton
                              onClick={() => {
                                confirmDelete({
                                  title: t('confirm.deleteTitle', 'បញ្ជាក់ការលុប'),
                                  itemName: dept.name,
                                  confirmText: t('common.delete', 'លុប'),
                                  cancelText: t('common.cancel', 'បោះបង់'),
                                  onConfirm: () => deleteMutation.mutate(dept.id),
                                });
                              }}
                              title={t('organization.removeDepartment', 'លុបនាយកដ្ឋាន')}
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

          {/* Pagination */}
          <Pagination
            currentPage={page}
            lastPage={Math.max(1, Math.ceil(filteredDepts.length / perPage))}
            total={filteredDepts.length}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newSize) => {
              setPerPage(newSize);
              setPage(1);
            }}
            perPageOptions={[10, 20, 50, 100]}
            className="rounded-2xl"
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. ADD / EDIT DEPARTMENT MODAL (GLOBAL STANDARD)         */}
      {/* ======================================================== */}
      <DepartmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dept={editingDept}
        departments={rawDeptList}
        employees={employeesData || []}
      />

      {/* ======================================================== */}
      {/* 6. DEPARTMENT DETAIL DIALOG POPUP                        */}
      {/* ======================================================== */}
      <DeptDetailDialog
        dept={selectedDetailDept}
        open={Boolean(selectedDetailDept)}
        onOpenChange={(open) => !open && setSelectedDetailDept(null)}
      />
    </div>
  );
};

export default DepartmentsPage;
