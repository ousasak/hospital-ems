import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { reportService } from "@/services/reportService";
import { organizationService } from "@/services/organizationService";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { ReportHeader } from "./components/ReportHeader";
import { ReportOverviewTab } from "./components/ReportOverviewTab";
import { WorkforceAnalyticsSection } from "./components/WorkforceAnalyticsSection";
import { AttendanceAnalyticsSection } from "./components/AttendanceAnalyticsSection";
import { LeaveAnalyticsSection } from "./components/LeaveAnalyticsSection";
import { ShiftAnalyticsSection } from "./components/ShiftAnalyticsSection";
import { PayrollAnalyticsSection } from "./components/PayrollAnalyticsSection";
import { DetailedReportsSection } from "./components/DetailedReportsSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ShieldAlert,
  AlertCircle,
  ArrowUp,
  LayoutDashboard,
  CalendarCheck,
  Users2,
  CalendarDays,
  Clock,
  Table,
  CreditCard,
} from "lucide-react";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";

export const ReportsPage: React.FC = () => {
  const { t, locale } = useLocaleStore();
  const { hasRole, hasPermission } = useAuthStore();
  const queryClient = useQueryClient();

  // Role permissions
  const canViewPayroll = Boolean(
    hasRole("Super Admin") ||
    hasRole("Accountant") ||
    hasPermission("view payroll"),
  );

  const canAccessReports = Boolean(
    hasRole([
      "Super Admin",
      "HR Manager",
      "HR Staff",
      "Department Manager",
      "Accountant",
    ]) || hasPermission("view reports"),
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "overview") {
          next.delete("tab");
        } else {
          next.set("tab", tab);
        }
        return next;
      },
      { replace: true }
    );
  };

  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Filter States
  const [dateRangeKey, setDateRangeKey] = useState<string>("thisMonth");
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string | number>(
    "all",
  );

  // Detailed Table States
  const [detailedCategory, setDetailedCategory] = useState<
    "attendance" | "leave" | "employee" | "shift" | "department" | "payroll"
  >("attendance");
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(15);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Compute actual date range bounds
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    switch (dateRangeKey) {
      case "today":
        return { startDate: todayStr, endDate: todayStr };
      case "last7Days":
        return {
          startDate: format(subDays(today, 6), "yyyy-MM-dd"),
          endDate: todayStr,
        };
      case "thisMonth":
        return {
          startDate: format(startOfMonth(today), "yyyy-MM-dd"),
          endDate: todayStr,
        };
      case "last30Days":
        return {
          startDate: format(subDays(today, 29), "yyyy-MM-dd"),
          endDate: todayStr,
        };
      case "thisYear":
        return {
          startDate: format(startOfYear(today), "yyyy-MM-dd"),
          endDate: todayStr,
        };
      case "custom":
        return { startDate: customStartDate, endDate: customEndDate };
      default:
        return {
          startDate: format(startOfMonth(today), "yyyy-MM-dd"),
          endDate: todayStr,
        };
    }
  }, [dateRangeKey, customStartDate, customEndDate]);

  // Query 0: Departments List for Filter
  const { data: deptResponse } = useQuery({
    queryKey: ["organization-departments"],
    queryFn: async () => await organizationService.getDepartments(),
  });
  const departments = useMemo(() => {
    if (Array.isArray(deptResponse)) return deptResponse;
    if (Array.isArray((deptResponse as any)?.data))
      return (deptResponse as any).data;
    return [];
  }, [deptResponse]);

  // Query 1: Summary KPIs
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
    isRefetching: isSummaryRefetching,
  } = useQuery({
    queryKey: ["reports-summary", startDate, endDate, selectedDepartment],
    queryFn: () =>
      reportService.getSummary({
        start_date: startDate,
        end_date: endDate,
        department_id:
          selectedDepartment !== "all" ? selectedDepartment : undefined,
      }),
    enabled: canAccessReports,
  });

  // Query 2: Workforce Analytics
  const { data: workforceData, isLoading: isWorkforceLoading } = useQuery({
    queryKey: ["reports-workforce", selectedDepartment],
    queryFn: () =>
      reportService.getWorkforce({
        department_id:
          selectedDepartment !== "all" ? selectedDepartment : undefined,
      }),
    enabled: canAccessReports,
  });

  // Query 3: Attendance Analytics
  const { data: attendanceData, isLoading: isAttendanceLoading } = useQuery({
    queryKey: [
      "reports-attendance",
      startDate,
      endDate,
      selectedDepartment,
    ],
    queryFn: () =>
      reportService.getAttendance({
        start_date: startDate,
        end_date: endDate,
        department_id:
          selectedDepartment !== "all" ? selectedDepartment : undefined,
      }),
    enabled: canAccessReports,
  });

  // Query 4: Leave Analytics
  const { data: leaveData, isLoading: isLeaveLoading } = useQuery({
    queryKey: [
      "reports-leaves",
      selectedDepartment,
      new Date().getFullYear(),
    ],
    queryFn: () =>
      reportService.getLeaves({
        year: new Date().getFullYear(),
        department_id:
          selectedDepartment !== "all" ? selectedDepartment : undefined,
      }),
    enabled: canAccessReports,
  });

  // Query 5: Shift Analytics
  const { data: shiftData, isLoading: isShiftLoading } = useQuery({
    queryKey: ["reports-shifts", startDate, endDate, selectedDepartment],
    queryFn: () =>
      reportService.getShifts({
        start_date: startDate,
        end_date: endDate,
        department_id:
          selectedDepartment !== "all" ? selectedDepartment : undefined,
      }),
    enabled: canAccessReports,
  });

  // Query 6: Payroll Analytics (only if authorized)
  const { data: payrollData, isLoading: isPayrollLoading } = useQuery({
    queryKey: [
      "reports-payroll",
      selectedDepartment,
      new Date().getFullYear(),
    ],
    queryFn: () =>
      reportService.getPayroll({
        year: new Date().getFullYear(),
        department_id:
          selectedDepartment !== "all" ? selectedDepartment : undefined,
      }),
    enabled: canAccessReports && canViewPayroll,
  });

  // Query 7: Detailed Records Table
  const { data: detailedRecordsData, isLoading: isDetailedLoading } = useQuery({
    queryKey: [
      "reports-detailed",
      detailedCategory,
      startDate,
      endDate,
      selectedDepartment,
      search,
      statusFilter,
      page,
      perPage,
      sortBy,
      sortDir,
    ],
    queryFn: () =>
      reportService.getDetailedRecords({
        category: detailedCategory,
        start_date: startDate,
        end_date: endDate,
        department_id:
          selectedDepartment !== "all" ? selectedDepartment : undefined,
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_dir: sortDir,
      }),
    enabled: canAccessReports && activeTab === "detailed",
  });

  // Refresh handler
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["reports-summary"] });
    await queryClient.invalidateQueries({ queryKey: ["reports-workforce"] });
    await queryClient.invalidateQueries({ queryKey: ["reports-attendance"] });
    await queryClient.invalidateQueries({ queryKey: ["reports-leaves"] });
    await queryClient.invalidateQueries({ queryKey: ["reports-shifts"] });
    if (canViewPayroll) {
      await queryClient.invalidateQueries({ queryKey: ["reports-payroll"] });
    }
    await queryClient.invalidateQueries({ queryKey: ["reports-detailed"] });
  };

  // Export CSV handler
  const handleExport = () => {
    reportService.exportCsv({
      category: detailedCategory,
      start_date: startDate,
      end_date: endDate,
      department_id:
        selectedDepartment !== "all" ? selectedDepartment : undefined,
      search: search || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      lang: locale === "en" ? "en" : "kh",
    });
  };

  // Smooth scroll to section helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -30;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Scroll listener for floating Back-to-Top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Permission Denied View for Unauthorized Users
  if (!canAccessReports) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <Card className="max-w-md w-full p-6 rounded-2xl border-border/70 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">
              {t("reports.unauthorized.title")}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("reports.unauthorized.desc")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="rounded-xl w-full"
          >
            {t("common.back", "Go Back")}
          </Button>
        </Card>
      </div>
    );
  }

  // API Error View
  if (isSummaryError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            {t("reports.error.unableToLoad")}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md">
            {t("reports.error.networkErrorDesc")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchSummary()}
          className="rounded-xl"
        >
          {t("reports.error.retry")}
        </Button>
      </div>
    );
  }

  const isDeptScoped = Boolean(summaryData?.scope?.is_department_scoped);
  const deptScopeNames = summaryData?.scope?.department_names || [];

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Toolbar (Filter, Dates, Department Scope, Actions) */}
      <ReportHeader
        dateRangeKey={dateRangeKey}
        setDateRangeKey={setDateRangeKey}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        departments={departments}
        isDepartmentScoped={isDeptScoped}
        scopedDepartmentNames={deptScopeNames}
        onRefresh={handleRefresh}
        isRefreshing={isSummaryRefetching}
        onExport={handleExport}
      />

      {/* ── 2. Structured Tabbed Analytics View (Progressive Disclosure) ─────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="h-11 p-1 bg-muted/60 dark:bg-slate-900/60 border border-border/60 rounded-xl inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger
              value="overview"
              className="gap-2 rounded-lg text-xs font-semibold px-3.5 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{t("reports.tabs.overview", "ទិដ្ឋភាពទូទៅ")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="gap-2 rounded-lg text-xs font-semibold px-3.5 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs cursor-pointer"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>{t("reports.tabs.attendance", "វត្តមាន & ភាពទៀងទាត់")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="workforce"
              className="gap-2 rounded-lg text-xs font-semibold px-3.5 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs cursor-pointer"
            >
              <Users2 className="h-4 w-4" />
              <span>{t("reports.tabs.workforce", "កម្លាំងពលកម្ម")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="leaves"
              className="gap-2 rounded-lg text-xs font-semibold px-3.5 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs cursor-pointer"
            >
              <CalendarDays className="h-4 w-4" />
              <span>{t("reports.tabs.leaves", "ច្បាប់ឈប់សម្រាក")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="shifts"
              className="gap-2 rounded-lg text-xs font-semibold px-3.5 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs cursor-pointer"
            >
              <Clock className="h-4 w-4" />
              <span>{t("reports.tabs.shifts", "វេនការងារ")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="detailed"
              className="gap-2 rounded-lg text-xs font-semibold px-3.5 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs cursor-pointer"
            >
              <Table className="h-4 w-4" />
              <span>{t("reports.tabs.detailed", "កំណត់ត្រាលម្អិត")}</span>
            </TabsTrigger>
            {canViewPayroll && (
              <TabsTrigger
                value="payroll"
                className="gap-2 rounded-lg text-xs font-semibold px-3.5 py-1.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs cursor-pointer"
              >
                <CreditCard className="h-4 w-4" />
                <span>{t("reports.tabs.payroll", "ប្រាក់បៀវត្សរ៍")}</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Tab 1: Executive Overview */}
        <TabsContent value="overview" className="mt-0 focus-visible:ring-0">
          <ReportOverviewTab
            summaryData={summaryData}
            isSummaryLoading={isSummaryLoading}
            workforceData={workforceData}
            isWorkforceLoading={isWorkforceLoading}
            attendanceData={attendanceData}
            isAttendanceLoading={isAttendanceLoading}
            leaveData={leaveData}
            isLeaveLoading={isLeaveLoading}
            shiftData={shiftData}
            isShiftLoading={isShiftLoading}
            onNavigateTab={setActiveTab}
            canViewPayroll={canViewPayroll}
          />
        </TabsContent>

        {/* Tab 2: Attendance & Punctuality Analytics */}
        <TabsContent value="attendance" className="mt-0 focus-visible:ring-0">
          <AttendanceAnalyticsSection
            data={attendanceData}
            isLoading={isAttendanceLoading}
          />
        </TabsContent>

        {/* Tab 3: Workforce & Department Distribution */}
        <TabsContent value="workforce" className="mt-0 focus-visible:ring-0">
          <WorkforceAnalyticsSection
            data={workforceData}
            isLoading={isWorkforceLoading}
          />
        </TabsContent>

        {/* Tab 4: Leave Management Analytics */}
        <TabsContent value="leaves" className="mt-0 focus-visible:ring-0">
          <LeaveAnalyticsSection
            data={leaveData}
            isLoading={isLeaveLoading}
          />
        </TabsContent>

        {/* Tab 5: Duty Shift Scheduling Analytics */}
        <TabsContent value="shifts" className="mt-0 focus-visible:ring-0">
          <ShiftAnalyticsSection
            data={shiftData}
            isLoading={isShiftLoading}
          />
        </TabsContent>

        {/* Tab 6: Detailed Records Data Table */}
        <TabsContent value="detailed" className="mt-0 focus-visible:ring-0">
          <DetailedReportsSection
            category={detailedCategory}
            setCategory={setDetailedCategory}
            recordsData={detailedRecordsData}
            isLoading={isDetailedLoading}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            page={page}
            setPage={setPage}
            perPage={perPage}
            setPerPage={setPerPage}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={(key, dir) => {
              setSortBy(key);
              setSortDir(dir);
            }}
            onExport={handleExport}
            canViewPayroll={canViewPayroll}
          />
        </TabsContent>

        {/* Tab 7: Payroll Analytics (Authorized users only) */}
        {canViewPayroll && (
          <TabsContent value="payroll" className="mt-0 focus-visible:ring-0">
            <PayrollAnalyticsSection
              data={payrollData}
              isLoading={isPayrollLoading}
              canViewPayroll={canViewPayroll}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-30 h-10 w-10 p-0 rounded-full shadow-lg bg-card/90 backdrop-blur-md border-border/80 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
          title="ត្រឡប់ទៅលើបង្អស់"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ReportsPage;
