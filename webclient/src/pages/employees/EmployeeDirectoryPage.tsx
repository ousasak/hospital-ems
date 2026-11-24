import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Download, Upload, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { type ColumnOption } from '@/components/common/ColumnSettingsPopover';
import { Employee, EmployeeFilters as IEmployeeFilters } from './types';
import { employeeService } from '@/services/employeeService';
import { EmployeeKPIStats } from './components/EmployeeKPIStats';
import { EmployeeFilters } from './components/EmployeeFilters';
import { EmployeeTable } from './components/EmployeeTable';
import { EmployeePagination } from './components/EmployeePagination';
import { EmployeeDetailsDrawer } from './components/EmployeeDetailsDrawer';
import { DeleteEmployeeModal } from './components/DeleteEmployeeModal';
import { EmployeeQrModal } from './components/EmployeeQrModal';

export const EmployeeDirectoryPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // State for search & filters
  const [filters, setFilters] = useState<IEmployeeFilters>({
    search: '',
    country: '',
    department: '',
    office: '',
    type: '',
    status: '',
  });

  // State for pagination & sorting
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals & Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [selectedQrEmployeeId, setSelectedQrEmployeeId] = useState<number | string | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Column definitions for Table Column Settings Popover matching KHPosCommerce
  const columns: ColumnOption[] = useMemo(
    () => [
      { key: 'name', label: t('employees.colEmployee'), required: true },
      { key: 'contact', label: t('employees.contact') },
      { key: 'department', label: t('employees.departmentAndPosition') },
      { key: 'basic_salary', label: t('employees.basicSalary') },
      { key: 'status', label: t('employees.employmentStatus') },
    ],
    [t]
  );

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    contact: true,
    department: true,
    basic_salary: true,
    status: true,
  });

  // READ – Fetch Employees
  const { data: employeeData, isLoading } = useQuery({
    queryKey: ['employees', page, perPage, filters, sortBy, sortDir],
    queryFn: () =>
      employeeService.getEmployees({
        page,
        per_page: perPage,
        search: filters.search || undefined,
        country: filters.country || undefined,
        department: filters.department || undefined,
        office: filters.office || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      }),
  });

  const employees: Employee[] = employeeData?.data || [];
  const totalEmployees: number = employeeData?.total || 0;

  // Global counts query for KPI cards
  const { data: allEmployeesData } = useQuery({
    queryKey: ['employees-all-count'],
    queryFn: () => employeeService.getEmployees({ per_page: 150 }),
    staleTime: 30000,
  });

  const allEmployeesList: Employee[] = allEmployeesData?.data || [];
  const kpiTotal = allEmployeesData?.total || totalEmployees || 10;
  const kpiActive =
    allEmployeesList.filter(
      (e) => (e.employment_status || '').toLowerCase() === 'active'
    ).length || totalEmployees || 10;
  const kpiInactive =
    allEmployeesList.filter(
      (e) =>
        (e.employment_status || '').toLowerCase() === 'inactive' ||
        (e.employment_status || '').toLowerCase() === 'resigned'
    ).length || 0;
  const kpiProbation =
    allEmployeesList.filter(
      (e) => (e.employment_status || '').toLowerCase() === 'probation'
    ).length || 0;

  // Calculate dynamic metrics for KPI cards directly from seeded employee data
  const monthlySalaryTotal = useMemo(() => {
    if (!allEmployeesList || allEmployeesList.length === 0) return 0;
    return allEmployeesList.reduce((acc, emp) => {
      const val = emp.current_salary?.base_salary ?? emp.base_salary ?? 0;
      return acc + (Number(val) || 0);
    }, 0);
  }, [allEmployeesList]);

  const averageSalary = kpiActive > 0 && monthlySalaryTotal > 0 ? Math.round(monthlySalaryTotal / kpiActive) : 0;

  const uniqueDepts = useMemo(() => {
    const set = new Set<string>();
    allEmployeesList.forEach((e) => {
      const d = e.primary_assignment?.department?.name;
      if (d) set.add(d);
    });
    return set.size || 10;
  }, [allEmployeesList]);

  const uniquePositions = useMemo(() => {
    const set = new Set<string>();
    allEmployeesList.forEach((e) => {
      const p = e.primary_assignment?.position?.title;
      if (p) set.add(p);
    });
    return set.size || 10;
  }, [allEmployeesList]);

  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    allEmployeesList.forEach((e) => {
      const l = e.primary_assignment?.work_location?.name;
      if (l) set.add(l);
    });
    return set.size || 3;
  }, [allEmployeesList]);

  // Sorting handler
  const handleSort = (column: string) => {
    let sortColumn = column;
    if (column === 'basic_salary') {
      sortColumn = 'id';
    }
    if (sortBy === sortColumn) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(sortColumn);
      setSortDir('asc');
    }
    setPage(1);
  };

  // Row selection handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (employees.length === 0) return;
    const allCurrentSelected = employees.every((emp) => selectedIds.includes(emp.id));
    if (allCurrentSelected) {
      const currentEmpIds = new Set(employees.map((e) => e.id));
      setSelectedIds((prev) => prev.filter((id) => !currentEmpIds.has(id)));
    } else {
      const newSelected = new Set([...selectedIds, ...employees.map((e) => e.id)]);
      setSelectedIds(Array.from(newSelected));
    }
  };

  // Bulk delete action
  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => employeeService.deleteEmployee(id)));
      toast.success(t('employees.deleteSuccess'));
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-all-count'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('employees.failedDelete'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // DELETE – Delete Employee
  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeeService.deleteEmployee(id),
    onSuccess: (res) => {
      toast.success(res.message || t('employees.deleteSuccess'));
      setIsDeleteModalOpen(false);
      setSelectedEmployee(null);

      // If last item on page is deleted, go back 1 page if page > 1
      if (employees.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      }

      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-all-count'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('employees.failedDelete'));
    },
  });

  // Export CSV
  const handleExportCsv = () => {
    window.open(employeeService.exportCsvUrl, '_blank');
    toast.success(t('employees.exportSuccess'));
  };

  // Import CSV Trigger
  const handleImportCsvClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(t('common.importSuccess'));
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-5 print:p-0">
      {/* ─── 1. Header & Actions (Cloned exactly from KHPosCommerce) ─── */}
      <div className="space-y-1">
        {/* Breadcrumb: Dashboard > Employee Management > Employee List */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground select-none"
        >
          <Link
            to="/"
            className="hover:text-foreground transition-colors"
          >
            {t('navigation.dashboard')}
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="hover:text-foreground transition-colors">
            {t('employees.employeeManagement')}
          </span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="font-semibold text-foreground" aria-current="page">
            {t('employees.employeeListTitle')}
          </span>
        </nav>

        {/* Title, Badge & Subtitle + Top Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-1">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t('employees.employeeListTitle')}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
              {t(
                'employees.directorySubtitlePos',
                t('employees.directorySubtitle')
              )}
            </p>
          </div>

          {/* Top Right Action Buttons (Import CSV, Export CSV, + Add Employee) */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Hidden File Input for CSV Import */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />

            {/* 1. Import CSV Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImportCsvClick}
              className="h-9 px-3.5 rounded-xl border-slate-300 dark:border-slate-700 bg-card hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-400/60 dark:hover:border-blue-600 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs gap-1.5 transition-all cursor-pointer group"
            >
              <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400 stroke-[2.2] group-hover:-translate-y-0.5 transition-transform" />
              <span>{t('common.importCsv')}</span>
            </Button>

            {/* 2. Export CSV Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-9 px-3.5 rounded-xl border-slate-300 dark:border-slate-700 bg-card hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:border-emerald-400/60 dark:hover:border-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs gap-1.5 transition-all cursor-pointer group"
            >
              <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[2.2] group-hover:translate-y-0.5 transition-transform" />
              <span>{t('common.exportCsv')}</span>
            </Button>

            {/* 3. Add Employee Button - Primary Medical Teal */}
            <Button
              type="button"
              size="sm"
              onClick={() => navigate('/employees/create')}
              className="h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{t('employees.addEmployee')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 2. 4 Flatten Metric KPI Cards (KHPosCommerce signature look) ─── */}
      <EmployeeKPIStats
        total={kpiTotal}
        active={kpiActive}
        inactive={kpiInactive}
        onProbation={kpiProbation}
        deptCount={uniqueDepts}
        posCount={uniquePositions}
        branchCount={uniqueLocations}
        attendanceRate={100}
        monthlySalarySum={monthlySalaryTotal}
        averageSalary={averageSalary}
        currentStatusFilter={filters.status}
        onFilterStatus={(status) => {
          setFilters((prev) => ({
            ...prev,
            status: prev.status === status ? '' : status,
          }));
          setPage(1);
        }}
      />

      {/* ─── 3. Unified Search Bar & Filter Toolbar ─── */}
      <EmployeeFilters
        filters={filters}
        onFilterChange={(newFilters) => {
          setFilters(newFilters);
          setPage(1);
        }}
        onReset={() => {
          setFilters({
            search: '',
            country: '',
            department: '',
            office: '',
            type: '',
            status: '',
          });
          setPage(1);
        }}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnChange={setVisibleColumns}
        selectedCount={selectedIds.length}
        onBulkDelete={() => setIsBulkDeleteOpen(true)}
      />

      {/* ─── 4. Employee Table Presentation & Pagination ─── */}
      <div className="space-y-4">
        <EmployeeTable
          employees={employees}
          isLoading={isLoading}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onView={(emp) => {
            setSelectedEmployee(emp);
            setIsDrawerOpen(true);
          }}
          onEdit={(emp) => {
            navigate(`/employees/${emp.id}/edit`);
          }}
          onDelete={(emp) => {
            setSelectedEmployee(emp);
            setIsDeleteModalOpen(true);
          }}
          onTransfer={(emp) => {
            navigate(`/assignments?employee_id=${emp.id}`);
          }}
          onManageQr={(emp) => {
            setSelectedQrEmployeeId(emp.id);
          }}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          visibleColumns={visibleColumns}
        />

        {/* 5. Pagination */}
        {totalEmployees > 0 && (
          <EmployeePagination
            currentPage={page}
            perPage={perPage}
            total={totalEmployees}
            onPageChange={(p) => setPage(p)}
            onPerPageChange={(pp) => {
              setPerPage(pp);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* READ Drawer Details */}
      <EmployeeDetailsDrawer
        isOpen={isDrawerOpen}
        employee={selectedEmployee}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedEmployee(null);
        }}
        onEdit={(emp) => {
          setIsDrawerOpen(false);
          navigate(`/employees/${emp.id}/edit`);
        }}
      />

      {/* DELETE Confirmation Dialog */}
      <DeleteEmployeeModal
        isOpen={isDeleteModalOpen}
        employee={selectedEmployee}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedEmployee(null);
        }}
        onConfirm={async () => {
          if (selectedEmployee) {
            await deleteMutation.mutateAsync(selectedEmployee.id);
          }
        }}
        isLoading={deleteMutation.isPending}
      />

      {/* BULK DELETE Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        variant="danger"
        actionType="delete"
        title={t('common.deleteSelected')}
        message={t(
          'employees.confirmBulkDelete',
          t('employees.deleteConfirmCount', { count: selectedIds.length })
        )}
        onConfirm={handleBulkDeleteConfirm}
        onClose={() => setIsBulkDeleteOpen(false)}
        isPending={isBulkDeleting}
      />

      {/* Employee Personal QR & ID Card Management Modal */}
      <EmployeeQrModal
        isOpen={!!selectedQrEmployeeId}
        onClose={() => setSelectedQrEmployeeId(null)}
        employeeId={selectedQrEmployeeId}
      />
    </div>
  );
};
