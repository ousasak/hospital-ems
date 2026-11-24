import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileX,
  Download,
  Eye,
  Trash2,
  Home,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useLocaleStore } from '@/stores/localeStore';
import { formatDate } from '@/utils';
import {
  UnifiedFilterToolbar,
  HeaderActionsGroup,
  ExportButton,
  ImportButton,
  EnterpriseStatsCard,
  EnterpriseStatsGrid,
  Pagination,
  TableWrapper,
  EmptyState,
  StatusBadge,
  TableActionMenu,
} from '@/components/common';
import {
  documentService,
  DocumentItem,
  DocumentFilters,
} from '@/services/documentService';
import { employeeService } from '@/services/employeeService';
import { organizationService } from '@/services/organizationService';
import { confirmDelete } from '@/stores/confirmStore';
import { AddDocumentModal, AddDocumentFormValues } from './components/AddDocumentModal';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';

const CATEGORIES = [
  'Identity',
  'Employment',
  'Contracts',
  'Certifications',
  'Payroll',
  'Tax',
  'Policy',
  'Other HR Documents',
];

export const DocumentsPage: React.FC = () => {
  const { locale, t } = useLocaleStore();
  const queryClient = useQueryClient();

  // Filter & Pagination States
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // 1. Fetch Paginated Documents
  const {
    data: documentsResponse,
    isLoading: isDocsLoading,
  } = useQuery({
    queryKey: [
      'documents-list',
      page,
      perPage,
      departmentFilter,
      categoryFilter,
      statusFilter,
      search,
      sortKey,
      sortDir,
    ],
    queryFn: () =>
      documentService.getDocuments({
        page,
        per_page: perPage,
        department_id: departmentFilter ? departmentFilter : undefined,
        category: categoryFilter ? categoryFilter : undefined,
        status: statusFilter ? statusFilter : undefined,
        search: search.trim() ? search.trim() : undefined,
        sort_by: sortKey,
        sort_dir: sortDir,
      }),
  });

  // 2. Fetch Document Stats & Metrics
  const { data: stats } = useQuery({
    queryKey: ['documents-stats'],
    queryFn: () => documentService.getStats(),
    staleTime: 30_000,
  });

  // 3. Auxiliary Data: Departments & Employees
  const { data: departments } = useQuery({
    queryKey: ['departments-select'],
    queryFn: () => organizationService.getDepartments(),
  });

  const { data: employeesResponse } = useQuery({
    queryKey: ['employees-select-all'],
    queryFn: () => employeeService.getEmployees({ per_page: 250 }),
  });

  const employees = employeesResponse?.data || [];

  // Mutations
  const createDocumentMutation = useMutation({
    mutationFn: (values: AddDocumentFormValues) => {
      const formData = new FormData();
      formData.append('employee_id', values.employee_id);
      formData.append('title', values.title);
      formData.append('category', values.category);
      if (values.issue_date) formData.append('issue_date', values.issue_date);
      if (values.expiry_date) formData.append('expiry_date', values.expiry_date);
      if (values.status) formData.append('status', values.status);
      if (values.file) formData.append('file', values.file);

      return documentService.createDocument(formData);
    },
    onSuccess: () => {
      toast.success(
        t('documents.messages.uploadSuccess')
      );
      setUploadModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
      queryClient.invalidateQueries({ queryKey: ['documents-stats'] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          t('documents.messages.uploadFailed')
      );
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: number) => documentService.deleteDocument(id),
    onSuccess: () => {
      toast.success(t('documents.messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
      queryClient.invalidateQueries({ queryKey: ['documents-stats'] });
    },
    onError: () => {
      toast.error(t('documents.messages.deleteFailed'));
    },
  });

  const verifyDocumentMutation = useMutation({
    mutationFn: (id: number) => documentService.verifyDocument(id),
    onSuccess: () => {
      toast.success(t('documents.messages.verifySuccess'));
      if (previewDoc) {
        setPreviewDoc((prev) => (prev ? { ...prev, status: 'Verified' } : null));
      }
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
      queryClient.invalidateQueries({ queryKey: ['documents-stats'] });
    },
    onError: () => {
      toast.error(t('documents.messages.verifyFailed'));
    },
  });

  // Table Sorting handler
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setDepartmentFilter('');
    setCategoryFilter('');
    setStatusFilter('');
    setPage(1);
    toast.info(t('documents.toolbar.filtersReset'));
  };

  // Dynamic categories combined from backend stats + standard list
  const availableCategories = React.useMemo(() => {
    const fromStats = (stats?.categories || []).map((c) => c.name);
    return Array.from(new Set([...CATEGORIES, ...fromStats])).filter(Boolean);
  }, [stats?.categories]);

  // Dynamic audit readiness percentage
  const auditPercent =
    stats?.audit_ready_percent !== undefined
      ? stats.audit_ready_percent
      : stats?.total
      ? Math.round(((stats.verified || 0) / stats.total) * 1000) / 10
      : 0;

  // Handle Dynamic File Download
  const handleDownloadDoc = (doc: DocumentItem | null) => {
    if (!doc) return;
    const isImage = Boolean(
      doc.mime_type?.includes('image') || doc.file_path?.match(/\.(jpg|jpeg|png|webp)$/i)
    );
    const fileUrl =
      doc.file_url ||
      (doc.file_path
        ? doc.file_path.startsWith('http')
          ? doc.file_path
          : `/storage/${doc.file_path.replace(/^\/+/, '')}`
        : `/api/v1/documents/${doc.id}/download`);

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${doc.title.replace(/[/\\?%*:|"<>]/g, '_')}.${isImage ? 'jpg' : 'pdf'}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(
      t('documents.messages.downloading', {
        title: doc.title,
      })
    );
  };

  // Dynamic CSV Export for entire audit registry
  const handleExportAudit = async () => {
    try {
      toast.info(
        t('documents.messages.exportingAudit')
      );
      const allDocsResponse = await documentService.getDocuments({
        per_page: 500,
        department_id: departmentFilter || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });

      const list = allDocsResponse.data || [];
      if (list.length === 0) {
        toast.error(t('documents.messages.noDataToExport'));
        return;
      }

      const rows = list.map((d) => ({
        ID: d.id,
        Title: d.title,
        Category: d.category,
        Employee:
          d.employee?.full_name ||
          `${d.employee?.first_name || ''} ${d.employee?.last_name || ''}`.trim(),
        Code: d.employee?.employee_code || '',
        Department: d.employee?.primary_assignment?.department?.name || '',
        Status: d.status,
        IssueDate: d.issue_date || '',
        ExpiryDate: d.expiry_date || '',
      }));

      const headers = Object.keys(rows[0]).join(',');
      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers, ...rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Hospital_Documents_Audit_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(
        t('documents.messages.exportSuccess', {
          count: list.length,
        })
      );
    } catch {
      toast.error(t('documents.messages.exportFailed'));
    }
  };

  // Render Status Badge
  const renderDocumentStatus = (status: string) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {t('documents.statuses.Verified')}
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
            <span className="size-1.5 rounded-full bg-amber-500" />
            {t('documents.statuses.Pending')}
          </span>
        );
      case 'Expiring Soon':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            {t('documents.statuses.Expiring Soon')}
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-300">
            <span className="size-1.5 rounded-full bg-rose-500" />
            {t('documents.statuses.Expired')}
          </span>
        );
      default:
        return <StatusBadge status={status} />;
    }
  };

  return (
    <div className="space-y-6 p-1 sm:p-2 lg:p-4 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* 1. BREADCRUMB & HEADER                                   */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <span className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
              <Home className="size-3.5" />
              <span>{t('documents.home')}</span>
            </span>
            <span className="opacity-40">/</span>
            <span>{t('documents.hrManagement')}</span>
            <span className="opacity-40">/</span>
            <span className="text-foreground font-semibold">
              {t('documents.documents')}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t('documents.title')}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
              <span className="size-1.5 rounded-full bg-teal-500 animate-pulse" />
              {t('documents.soc2Certified')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {t('documents.auditReady', {
                percent: auditPercent,
              })}
            </span>
          </div>

          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {t('documents.subtitle')}
          </p>
        </div>

        {/* Action Buttons */}
        <HeaderActionsGroup>
          <ExportButton
            onClick={handleExportAudit}
            label={t('documents.actions.exportAudit')}
            size="md"
          />

          <ImportButton
            onClick={() => setUploadModalOpen(true)}
            label={t('documents.actions.uploadDocument')}
            size="md"
          />
        </HeaderActionsGroup>
      </div>

      {/* ======================================================== */}
      {/* 2. 5 DYNAMIC KPI METRIC CARDS (CLEAN DISPLAY, NON-CLICKABLE) */}
      {/* ======================================================== */}
      <EnterpriseStatsGrid columns={5}>
        <EnterpriseStatsCard
          title={t('documents.stats.totalDocs')}
          value={stats?.total ?? 0}
          subtitle={t('documents.stats.totalDocsSubtitle')}
          variant="slate"
          icon={FileText}
        />
        <EnterpriseStatsCard
          title={t('documents.stats.verifiedCompliant')}
          value={stats?.verified ?? 0}
          subtitle={t('documents.stats.verifiedSubtitle')}
          variant="emerald"
          icon={ShieldCheck}
        />
        <EnterpriseStatsCard
          title={t('documents.stats.pendingVerification')}
          value={stats?.pending ?? 0}
          subtitle={t('documents.stats.pendingSubtitle')}
          variant="amber"
          icon={Clock}
        />
        <EnterpriseStatsCard
          title={t('documents.stats.expiringSoon')}
          value={stats?.expiring ?? 0}
          subtitle={t('documents.stats.expiringSubtitle')}
          variant="rose"
          icon={AlertTriangle}
        />
        <EnterpriseStatsCard
          title={t('documents.stats.expiredLapsed')}
          value={stats?.expired ?? 0}
          subtitle={t('documents.stats.expiredSubtitle')}
          variant="rose"
          icon={FileX}
        />
      </EnterpriseStatsGrid>

      {/* ======================================================== */}
      {/* 3. DYNAMIC SEARCH & FILTER TOOLBAR                       */}
      {/* ======================================================== */}
      <UnifiedFilterToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder={t(
          'documents.toolbar.searchPlaceholder',
          t('documents.toolbar.searchPlaceholder')
        )}
        filters={[
          {
            id: 'department',
            value: departmentFilter,
            onChange: (dept) => {
              setDepartmentFilter(dept);
              setPage(1);
            },
            options: [
              { value: '', label: t('documents.toolbar.allDepartments') },
              ...(departments || []).map((d: any) => ({
                value: String(d.id),
                label: d.name,
              })),
            ],
            minWidth: 'min-w-[170px]',
          },
          {
            id: 'category',
            value: categoryFilter,
            onChange: (cat) => {
              setCategoryFilter(cat);
              setPage(1);
            },
            options: [
              { value: '', label: t('documents.toolbar.allCategories') },
              ...availableCategories.map((cat) => ({
                value: cat,
                label: t(`documents.categories.${cat}`, cat),
              })),
            ],
            minWidth: 'min-w-[155px]',
          },
          {
            id: 'status',
            value: statusFilter,
            onChange: (stat) => {
              setStatusFilter(stat);
              setPage(1);
            },
            options: [
              { value: '', label: t('documents.toolbar.allStatus') },
              {
                value: 'Verified',
                label: t('documents.statuses.Verified'),
              },
              {
                value: 'Pending',
                label: t('documents.statuses.Pending'),
              },
              {
                value: 'Expiring Soon',
                label: t('documents.statuses.Expiring Soon'),
              },
              {
                value: 'Expired',
                label: t('documents.statuses.Expired'),
              },
            ],
            minWidth: 'min-w-[150px]',
          },
        ]}
        onApply={() => setPage(1)}
        onReset={handleResetFilters}
      />

      {/* ======================================================== */}
      {/* 6. CLEAN ENTERPRISE DOCUMENTS TABLE                      */}
      {/* ======================================================== */}
      <TableWrapper className="p-0 border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4 sm:p-5 bg-card">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              {t('documents.registry.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t(
                'documents.registry.description',
                t('documents.docArchiveRegistryDesc')
              )}
            </p>
          </div>
          <p className="font-mono text-xs font-semibold text-muted-foreground">
            {t('documents.registry.showingRecords', {
              count: documentsResponse?.data?.length || 0,
              total: documentsResponse?.total || 0,
            })}
          </p>
        </div>

        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-xs">
            <thead className="border-b border-border/80 bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {/* Employee */}
                <th scope="col" className="px-5 py-3.5 font-semibold">
                  {t('documents.table.employee')}
                </th>

                {/* Document Name */}
                <th
                  scope="col"
                  onClick={() => handleSort('title')}
                  className="cursor-pointer px-4 py-3.5 font-semibold hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t('documents.table.documentName')}</span>
                    {sortKey === 'title' && (
                      <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>

                {/* Department */}
                <th scope="col" className="px-4 py-3.5 font-semibold">
                  {t('documents.table.department')}
                </th>

                {/* Category */}
                <th
                  scope="col"
                  onClick={() => handleSort('category')}
                  className="cursor-pointer px-4 py-3.5 font-semibold hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t('documents.table.category')}</span>
                    {sortKey === 'category' && (
                      <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>

                {/* Issue Date */}
                <th
                  scope="col"
                  onClick={() => handleSort('issue_date')}
                  className="cursor-pointer px-4 py-3.5 font-semibold hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t('documents.table.issueDate')}</span>
                    {sortKey === 'issue_date' && (
                      <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>

                {/* Expiry Date */}
                <th
                  scope="col"
                  onClick={() => handleSort('expiry_date')}
                  className="cursor-pointer px-4 py-3.5 font-semibold hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t('documents.table.expiryDate')}</span>
                    {sortKey === 'expiry_date' && (
                      <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>

                {/* Status */}
                <th scope="col" className="px-4 py-3.5 font-semibold">
                  {t('documents.table.status')}
                </th>

                {/* Actions */}
                <th scope="col" className="px-4 py-3.5 font-semibold text-right">
                  {t('documents.table.actions')}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 bg-card">
              {isDocsLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                      <span className="text-xs">
                        {t('documents.table.loading')}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : !documentsResponse?.data || documentsResponse.data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <EmptyState
                      title={t('documents.table.emptyTitle')}
                      description={t(
                        'documents.table.emptyDesc',
                        t('documents.table.emptyDesc')
                      )}
                    />
                  </td>
                </tr>
              ) : (
                documentsResponse.data.map((doc: DocumentItem) => {
                  const empName =
                    doc.employee?.full_name ||
                    `${doc.employee?.first_name || ''} ${doc.employee?.last_name || ''}`.trim() ||
                    t('documents.previewModal.hospitalStaff');

                  const empCode = doc.employee?.employee_code || `EMP-${doc.employee_id}`;
                  const department = doc.employee?.primary_assignment?.department?.name || '—';
                  const isImage = Boolean(
                    doc.mime_type?.includes('image') ||
                      doc.file_path?.match(/\.(jpg|jpeg|png|webp)$/i)
                  );
                  const formattedSize =
                    doc.file_size > 0
                      ? doc.file_size < 1024 * 1024
                        ? `${(doc.file_size / 1024).toFixed(1)} KB`
                        : `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB`
                      : '1.20 MB';

                  return (
                    <tr
                      key={doc.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      {/* Employee */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8 ring-1 ring-border">
                            <AvatarFallback className="text-[11px] font-bold bg-teal-500/10 text-teal-700">
                              {empName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="block font-semibold text-foreground text-xs">
                              {empName}
                            </span>
                            <span className="block font-mono text-[10.5px] text-teal-700 dark:text-teal-400">
                              {empCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Document Name */}
                      <td className="max-w-[280px] px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700 ring-1 ring-border/80 dark:text-teal-300">
                            {isImage ? (
                              <ImageIcon className="size-3.5" />
                            ) : (
                              <FileText className="size-3.5" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <span
                              className="block truncate font-semibold text-foreground hover:text-teal-600 transition-colors cursor-pointer"
                              title={doc.title}
                              onClick={() => setPreviewDoc(doc)}
                            >
                              {doc.title}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {isImage ? 'JPG' : 'PDF'} • {formattedSize}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 text-muted-foreground">
                        <span className="font-medium text-foreground/90">{department}</span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground/80 ring-1 ring-border/80">
                          {t(`documents.categories.${doc.category}`, doc.category)}
                        </span>
                      </td>

                      {/* Issue Date */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
                        {formatDate(doc.issue_date, locale)}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        {doc.expiry_date ? (
                          <span
                            className={
                              doc.status === 'Expired'
                                ? 'text-rose-600 font-bold'
                                : doc.status === 'Expiring Soon'
                                ? 'text-amber-600 font-bold'
                                : 'text-muted-foreground'
                            }
                          >
                            {formatDate(doc.expiry_date, locale)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">{renderDocumentStatus(doc.status)}</td>

                      {/* Actions (Global TableActionMenu - Direct 1-Click Inline Buttons) */}
                      <td className="px-4 py-3.5 text-right">
                        <TableActionMenu
                          variant="inline"
                          buttonSize="sm"
                          align="right"
                          onView={() => setPreviewDoc(doc)}
                          viewLabel={t('documents.table.viewDetails')}
                          items={[
                            {
                              label: t('documents.table.download'),
                              icon: Download,
                              onClick: () => handleDownloadDoc(doc),
                              variant: 'info',
                            },
                          ]}
                          onDelete={() => {
                            confirmDelete({
                              title: t('documents.actions.deleteTitle'),
                              itemName: doc.title,
                              confirmText: t('documents.actions.confirmDelete'),
                              cancelText: t('documents.actions.cancelDelete'),
                              onConfirm: () => deleteDocumentMutation.mutate(doc.id),
                            });
                          }}
                          deleteLabel={t('documents.table.delete')}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Global Pagination */}
        <Pagination
          currentPage={page}
          lastPage={documentsResponse?.last_page || 1}
          total={documentsResponse?.total || 0}
          perPage={perPage}
          onPageChange={(p) => setPage(p)}
          onPerPageChange={(pp) => {
            setPerPage(pp);
            setPage(1);
          }}
          perPageOptions={[10, 20, 50]}
        />
      </TableWrapper>

      {/* ======================================================== */}
      {/* 4. MODALS                                                */}
      {/* ======================================================== */}
      <AddDocumentModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        employees={employees}
        onSubmit={(values) => createDocumentMutation.mutate(values)}
        isPending={createDocumentMutation.isPending}
      />

      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        onVerify={(id) => verifyDocumentMutation.mutate(id)}
        isVerifying={verifyDocumentMutation.isPending}
        onDownload={handleDownloadDoc}
      />
    </div>
  );
};

export default DocumentsPage;
