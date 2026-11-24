import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Calendar,
  Layers,
  BarChart3,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  LeaveRequestItem,
  LeaveCategoryBalance,
  RegionalHoliday,
  LeaveEmployee,
  LeaveCategoryType,
} from "./types";
import { leaveService } from "@/services/leaveService";
import { formatLeaveDate } from "./utils/leaveCalculations";
import { downloadCsv } from "@/utils/export";
import { LeaveHeader } from "./components/LeaveHeader";
import { LeaveSummaryCards } from "./components/LeaveSummaryCards";
import { LeaveCalendar } from "./components/LeaveCalendar";
import { RegionalHolidays } from "./components/RegionalHolidays";
import { LeaveBalanceGrid } from "./components/LeaveBalanceGrid";
import { LeaveTableToolbar } from "./components/LeaveTableToolbar";
import { LeaveTable } from "./components/LeaveTable";
import { LeavePagination } from "./components/LeavePagination";
import { LeaveAnalyticsView } from "./components/LeaveAnalyticsView";
import { RequestLeaveModal } from "./components/RequestLeaveModal";
import { LeaveDetailModal } from "./components/LeaveDetailModal";
import { ColumnVisibilityState } from "./components/DataTableViewOptions";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { TableWrapper } from "@/components/common/TableWrapper";

export const LeavePage: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. Calendar View Date (Defaults to current month)
  const [calendarDate, setCalendarDate] = useState<{
    year: number;
    month: number;
  }>(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
    };
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(
    null,
  );

  // 2. Active Tab
  const [activeTab, setActiveTab] = useState<
    "requests" | "calendar" | "balances" | "analytics"
  >("requests");

  // 3. Filters & Sorting
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [officeFilter, setOfficeFilter] = useState("");
  const [sortKey, setSortKey] = useState<
    "employee" | "start" | "duration" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // 4. Row Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 5. Column Visibility
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({
      employee: true,
      location: true,
      leaveType: true,
      dates: true,
      duration: true,
      status: true,
      reason: true,
      actions: true,
    });

  // 6. Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 7. Modals State
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalRequest, setDetailModalRequest] =
    useState<LeaveRequestItem | null>(null);

  // 8. Data Queries
  const { data: employees = [] } = useQuery<LeaveEmployee[]>({
    queryKey: ["leave-employees"],
    queryFn: () => leaveService.getEmployees(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: requests = [] } = useQuery<LeaveRequestItem[]>({
    queryKey: ["leave-requests"],
    queryFn: () => leaveService.getRequests(),
    staleTime: 60 * 1000,
  });

  const { data: balances = [] } = useQuery<LeaveCategoryBalance[]>({
    queryKey: ["leave-balances"],
    queryFn: () => leaveService.getBalances(),
    staleTime: 60 * 1000,
  });

  const { data: holidays = [] } = useQuery<RegionalHoliday[]>({
    queryKey: ["leave-holidays"],
    queryFn: () => leaveService.getHolidays(),
    staleTime: 10 * 60 * 1000,
  });

  // Extract unique offices for filtering
  const uniqueOffices = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      if (r.office) set.add(r.office);
    });
    return Array.from(set).sort();
  }, [requests]);

  // 9. Approve / Reject Single Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "Approved" | "Rejected";
    }) => {
      return leaveService.updateRequestStatus(id, status);
    },
    onSuccess: (updated) => {
      toast.success(
        `${updated.employee}'s leave request marked as ${updated.status.toLowerCase()}`,
      );
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
    onError: () => {
      toast.error("Failed to update leave request status");
    },
  });

  // 10. Bulk Approve / Reject Mutation
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[];
      status: "Approved" | "Rejected";
    }) => {
      await Promise.all(
        ids.map((id) => leaveService.updateRequestStatus(id, status)),
      );
      return { count: ids.length, status };
    },
    onSuccess: ({ count, status }) => {
      toast.success(`${count} request(s) successfully ${status.toLowerCase()}`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
    onError: () => {
      toast.error("Failed to process bulk status update");
    },
  });

  // 11. Create Request Mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: {
      employee: string;
      employeeId?: string | number;
      type: LeaveCategoryType;
      start: Date;
      end: Date;
      reason: string;
      isHalfDay: boolean;
    }) => {
      return leaveService.createRequest(data);
    },
    onSuccess: (newReq) => {
      toast.success(`Leave request submitted for ${newReq.employee}`);
      setModalOpen(false);
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit leave request";
      toast.error(msg);
    },
  });

  // 12. Dynamic KPI Summary
  const kpiSummary = useMemo(() => {
    return leaveService.getKPISummary(requests);
  }, [requests, balances]);

  // Status counts for faceted filter badges
  const statusCounts = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "Pending").length,
      approved: requests.filter((r) => r.status === "Approved").length,
      rejected: requests.filter((r) => r.status === "Rejected").length,
    };
  }, [requests]);

  // 13. Month Navigation
  const handleNavigateMonth = (offset: number) => {
    setSelectedCalendarDay(null);
    setCalendarDate((prev) => {
      const d = new Date(prev.year, prev.month + offset, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  // 14. Sorting Handler
  const handleSort = (key: "employee" | "start" | "duration") => {
    if (sortKey === key) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir("asc");
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // 15. Filtered Requests
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // Status filter
    if (statusFilters.length > 0) {
      result = result.filter((r) => statusFilters.includes(r.status));
    }

    // Leave type filter
    if (typeFilters.length > 0) {
      result = result.filter((r) => typeFilters.includes(r.type));
    }

    // Office filter
    if (officeFilter) {
      result = result.filter((r) => r.office === officeFilter);
    }

    // Date filter (active leaves covering selected date)
    if (dateFilter) {
      const targetDate = new Date(dateFilter);
      if (!isNaN(targetDate.getTime())) {
        const targetTime = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
        ).getTime();

        result = result.filter((r) => {
          const sTime = new Date(
            r.start.getFullYear(),
            r.start.getMonth(),
            r.start.getDate(),
          ).getTime();
          const eTime = new Date(
            r.end.getFullYear(),
            r.end.getMonth(),
            r.end.getDate(),
          ).getTime();
          return targetTime >= sTime && targetTime <= eTime;
        });
      }
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.employee.toLowerCase().includes(q) ||
          r.office.toLowerCase().includes(q) ||
          r.country.toLowerCase().includes(q) ||
          (r.reason && r.reason.toLowerCase().includes(q)),
      );
    }

    // Sorting
    if (sortKey) {
      result.sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";

        if (sortKey === "employee") {
          valA = a.employee.toLowerCase();
          valB = b.employee.toLowerCase();
        } else if (sortKey === "start") {
          valA = a.start.getTime();
          valB = b.start.getTime();
        } else if (sortKey === "duration") {
          valA = a.duration;
          valB = b.duration;
        }

        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [
    requests,
    search,
    dateFilter,
    statusFilters,
    typeFilters,
    officeFilter,
    sortKey,
    sortDir,
  ]);

  // 16. Paginated Requests
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, page, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, dateFilter, statusFilters, typeFilters, officeFilter, pageSize]);

  // Row selection helpers
  const handleToggleSelectAll = () => {
    const pageIds = paginatedRequests.map((r) => r.id);
    const allSelectedOnPage = pageIds.every((id) => selectedIds.includes(id));

    if (allSelectedOnPage) {
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      const newSelected = Array.from(new Set([...selectedIds, ...pageIds]));
      setSelectedIds(newSelected);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const isFiltered =
    Boolean(search.trim()) ||
    Boolean(dateFilter) ||
    statusFilters.length > 0 ||
    typeFilters.length > 0 ||
    Boolean(officeFilter);

  const handleResetFilters = () => {
    setSearch("");
    setDateFilter("");
    setStatusFilters([]);
    setTypeFilters([]);
    setOfficeFilter("");
    setSortKey(null);
  };

  const handleFilterStatusCard = (status: string) => {
    if (!status || statusFilters.includes(status)) {
      setStatusFilters([]);
    } else {
      setStatusFilters([status]);
    }
    setPage(1);
  };

  // 17. Real CSV / Excel Export with UTF-8 BOM
  const handleExportCsv = () => {
    if (filteredRequests.length === 0) {
      toast.error("គ្មានទិន្នន័យច្បាប់សម្រាប់នាំចេញឡើយ");
      return;
    }

    const headers = [
      "លេខកូដសំណើ (Request ID)",
      "ឈ្មោះបុគ្គលិក (Employee Name)",
      "សាខា / ការិយាល័យ (Office)",
      "ប្រទេស / តំបន់ (Country)",
      "ប្រភេទច្បាប់ (Leave Type)",
      "កាលបរិច្ឆេទចាប់ផ្ដើម (Start Date)",
      "កាលបរិច្ឆេទបញ្ចប់ (End Date)",
      "រយៈពេល / ថ្ងៃ (Duration)",
      "ស្ថានភាព (Status)",
      "កាលបរិច្ឆេទស្នើ (Applied Date)",
      "មូលហេតុ (Reason)",
    ];

    const statusLabelKhmer: Record<string, string> = {
      Approved: "បានអនុម័ត (Approved)",
      Pending: "រង់ចាំពិនិត្យ (Pending)",
      Rejected: "បានបដិសេធ (Rejected)",
      Cancelled: "បានបោះបង់ (Cancelled)",
    };

    const typeLabelKhmer: Record<string, string> = {
      "Annual Leave": "ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)",
      "Sick Leave": "ច្បាប់ឈឺ (Sick Leave)",
      "Personal Leave": "ច្បាប់ផ្ទាល់ខ្លួន (Personal Leave)",
      "Unpaid Leave": "គ្មានប្រាក់ឈ្នួល (Unpaid Leave)",
    };

    const rows = filteredRequests.map((r) => [
      r.id,
      r.employee,
      r.office,
      r.country,
      typeLabelKhmer[r.type] || r.type,
      formatLeaveDate(r.start),
      formatLeaveDate(r.end),
      r.duration,
      statusLabelKhmer[r.status] || r.status,
      r.appliedDate || "—",
      r.reason || "—",
    ]);

    downloadCsv("Leave_Management_Report", headers, rows);
    toast.success(
      `បានទាញយកទិន្នន័យច្បាប់ឈប់សម្រាកចំនួន ${filteredRequests.length} កំណត់ត្រាជាឯកសារ Excel/CSV ដោយជោគជ័យ!`,
    );
  };

  return (
    <div className="space-y-5 print:p-0">
      {/* 1. Header with Breadcrumbs & Action Buttons (Export CSV Only) */}
      <LeaveHeader
        onExport={handleExportCsv}
        pendingCount={statusCounts.pending}
        totalRecords={filteredRequests.length}
      />

      {/* 2. Top Metric KPI Cards (4 Flatten Cards matching EmployeeKPIStats) */}
      <LeaveSummaryCards
        summary={kpiSummary}
        totalRequests={requests.length}
        activeStatusFilter={statusFilters[0] || ""}
        onFilterStatus={handleFilterStatusCard}
      />

      {/* 3. Main Content Views (Modern Underline Tabs - SaaS Stripe/GitHub/Linear standard) */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className="space-y-4"
      >
        <div className="border-b border-slate-200 dark:border-slate-800">
          <TabsList className="h-auto p-0 bg-transparent rounded-none border-0 w-full justify-start gap-4 sm:gap-8 flex-nowrap overflow-x-auto scrollbar-none">
            <TabsTrigger
              value="requests"
              className="relative pb-3 pt-1 px-1 rounded-none border-b-2 border-transparent bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:border-teal-600 dark:data-[state=active]:border-teal-400 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold text-xs sm:text-sm font-medium gap-2 transition-all shrink-0 -mb-px"
            >
              <FileText className="h-4 w-4" />
              <span>សំណើសុំច្បាប់</span>
              {statusCounts.pending > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
                  {statusCounts.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="relative pb-3 pt-1 px-1 rounded-none border-b-2 border-transparent bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:border-teal-600 dark:data-[state=active]:border-teal-400 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold text-xs sm:text-sm font-medium gap-2 transition-all shrink-0 -mb-px"
            >
              <Calendar className="h-4 w-4" />
              <span>ប្រតិទិនច្បាប់</span>
            </TabsTrigger>
            <TabsTrigger
              value="balances"
              className="relative pb-3 pt-1 px-1 rounded-none border-b-2 border-transparent bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:border-teal-600 dark:data-[state=active]:border-teal-400 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold text-xs sm:text-sm font-medium gap-2 transition-all shrink-0 -mb-px"
            >
              <Layers className="h-4 w-4" />
              <span>សមតុល្យច្បាប់</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="relative pb-3 pt-1 px-1 rounded-none border-b-2 border-transparent bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:border-teal-600 dark:data-[state=active]:border-teal-400 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold text-xs sm:text-sm font-medium gap-2 transition-all shrink-0 -mb-px"
            >
              <BarChart3 className="h-4 w-4" />
              <span>ស្ថិតិ & វិភាគ</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Leave Requests Pipeline (Data Table) */}
        <TabsContent value="requests" className="space-y-4 pt-1">
          {/* shadcn Data Table Toolbar */}
          <LeaveTableToolbar
            search={search}
            onSearchChange={setSearch}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            statusFilters={statusFilters}
            onStatusFilterChange={setStatusFilters}
            typeFilters={typeFilters}
            onTypeFilterChange={setTypeFilters}
            officeFilter={officeFilter}
            onOfficeFilterChange={setOfficeFilter}
            offices={uniqueOffices}
            onResetFilters={handleResetFilters}
            isFiltered={isFiltered}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            selectedCount={selectedIds.length}
            onBulkApprove={() =>
              bulkUpdateStatusMutation.mutate({
                ids: selectedIds,
                status: "Approved",
              })
            }
            onBulkReject={() =>
              bulkUpdateStatusMutation.mutate({
                ids: selectedIds,
                status: "Rejected",
              })
            }
            onClearSelection={() => setSelectedIds([])}
            statusCounts={statusCounts}
          />

          {/* shadcn Data Table Component & Pagination */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-card overflow-hidden shadow-2xs">
              <LeaveTable
                requests={paginatedRequests}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onApprove={(id) =>
                  updateStatusMutation.mutate({ id, status: "Approved" })
                }
                onReject={(id) =>
                  updateStatusMutation.mutate({ id, status: "Rejected" })
                }
                onViewDetails={(req) => setDetailModalRequest(req)}
                selectedIds={selectedIds}
                onToggleSelectAll={handleToggleSelectAll}
                onToggleSelectRow={handleToggleSelectRow}
                columnVisibility={columnVisibility}
              />
            </div>

            {/* Pagination */}
            {filteredRequests.length > 0 && (
              <LeavePagination
                total={filteredRequests.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                selectedCount={selectedIds.length}
              />
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Calendar & Schedule (Full-Width Clean View with Integrated Cambodian Holidays) */}
        <TabsContent value="calendar" className="space-y-4 pt-1">
          <LeaveCalendar
            currentDate={calendarDate}
            onNavigateMonth={handleNavigateMonth}
            requests={requests}
            holidays={holidays}
            selectedDay={selectedCalendarDay}
            onSelectDay={setSelectedCalendarDay}
          />
        </TabsContent>

        {/* Tab 3: Entitlements & Balances (Option 1: Compact Quota Bar + Employee Balance Ledger Table) */}
        <TabsContent value="balances" className="space-y-4 pt-1">
          <LeaveBalanceGrid
            balances={balances}
            employees={employees}
            requests={requests}
          />
        </TabsContent>

        {/* Tab 4: Analytics & Trends */}
        <TabsContent value="analytics" className="space-y-4 pt-1">
          <LeaveAnalyticsView
            requests={requests}
            employees={employees}
            balances={balances}
          />
        </TabsContent>
      </Tabs>

      {/* 4. Request Leave Modal (shadcn Dialog) */}
      <RequestLeaveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        employees={employees}
        onSubmit={(data) => createRequestMutation.mutate(data)}
      />

      {/* 5. Leave Request Details Modal (shadcn Dialog) */}
      <LeaveDetailModal
        request={detailModalRequest}
        onClose={() => setDetailModalRequest(null)}
        onApprove={(id) =>
          updateStatusMutation.mutate({ id, status: "Approved" })
        }
        onReject={(id) =>
          updateStatusMutation.mutate({ id, status: "Rejected" })
        }
      />
    </div>
  );
};

export default LeavePage;
