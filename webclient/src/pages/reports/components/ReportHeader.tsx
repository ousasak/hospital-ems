import React from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  Building2,
  Download,
  Printer,
  RotateCw,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/utils';

export interface ReportHeaderProps {
  dateRangeKey: string;
  setDateRangeKey: (key: string) => void;
  customStartDate: string;
  setCustomStartDate: (d: string) => void;
  customEndDate: string;
  setCustomEndDate: (d: string) => void;
  selectedDepartment: string | number;
  setSelectedDepartment: (id: string | number) => void;
  departments: Array<{ id: number; name: string; code?: string }>;
  isDepartmentScoped: boolean;
  scopedDepartmentNames: string[];
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExport: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  dateRangeKey,
  setDateRangeKey,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  selectedDepartment,
  setSelectedDepartment,
  departments,
  isDepartmentScoped,
  scopedDepartmentNames,
  onRefresh,
  isRefreshing = false,
  onExport,
}) => {
  const { t } = useLocaleStore();

  const dateRangeLabels: Record<string, string> = {
    today: t('reports.ranges.today'),
    last7Days: t('reports.ranges.last7Days'),
    thisMonth: t('reports.ranges.thisMonth'),
    last30Days: t('reports.ranges.last30Days'),
    thisYear: t('reports.ranges.thisYear'),
    custom: t('reports.ranges.custom'),
  };

  const selectedDeptName =
    selectedDepartment === 'all'
      ? t('reports.allDepartments')
      : departments.find((d) => String(d.id) === String(selectedDepartment))?.name ??
        t('reports.allDepartments');

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        breadcrumbs={[
          { label: t('nav.main'), href: '/' },
          { label: t('reports.title') },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Refresh Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-9 px-3 rounded-xl border-border/80 bg-card hover:bg-muted/80 text-foreground text-xs font-medium gap-1.5 transition-all shadow-2xs"
              title={t('reports.refreshData')}
            >
              <RotateCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-primary')} />
              <span className="hidden sm:inline">{t('reports.refreshData')}</span>
            </Button>

            {/* Print Action */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-9 px-3.5 rounded-xl border-border/80 bg-card hover:bg-muted/80 text-foreground text-xs font-medium gap-1.5 transition-all shadow-2xs"
            >
              <Printer className="h-4 w-4 text-muted-foreground" />
              <span>{t('reports.printReport')}</span>
            </Button>

            {/* Export Master CSV */}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onExport}
              className="h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="h-4 w-4 stroke-[2.2]" />
              <span>{t('reports.exportMasterCsv')}</span>
            </Button>
          </div>
        }
      />

      {/* Global Interactive Toolbar: Date Range + Department Scope */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Date Range Dropdown Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl border border-border/80 bg-card text-xs font-semibold gap-2 hover:bg-muted/80 transition-all shadow-2xs"
              >
                <CalendarDays className="h-4 w-4 text-primary" />
                <span>{dateRangeLabels[dateRangeKey] || dateRangeLabels.thisMonth}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 rounded-xl p-1 shadow-md">
              <DropdownMenuItem onClick={() => setDateRangeKey('today')}>
                {dateRangeLabels.today}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRangeKey('last7Days')}>
                {dateRangeLabels.last7Days}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRangeKey('thisMonth')}>
                {dateRangeLabels.thisMonth}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRangeKey('last30Days')}>
                {dateRangeLabels.last30Days}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRangeKey('thisYear')}>
                {dateRangeLabels.thisYear}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRangeKey('custom')}>
                {dateRangeLabels.custom}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Custom Date Pickers when 'custom' is active */}
          {dateRangeKey === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-9 px-2.5 rounded-xl border border-border/80 bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              />
              <span className="text-muted-foreground">—</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-9 px-2.5 rounded-xl border border-border/80 bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>
          )}

          {/* 2. Department Selector / Department Scope Restriction */}
          {isDepartmentScoped ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-semibold shadow-2xs">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                {t('reports.scopedTo', { name: scopedDepartmentNames.join(', ') })}
              </span>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl border border-border/80 bg-card text-xs font-semibold gap-2 hover:bg-muted/80 transition-all shadow-2xs max-w-[260px] truncate"
                >
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{selectedDeptName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 max-h-72 overflow-y-auto rounded-xl p-1 shadow-md">
                <DropdownMenuItem onClick={() => setSelectedDepartment('all')}>
                  {t('reports.allDepartments')}
                </DropdownMenuItem>
                {departments.map((dept) => (
                  <DropdownMenuItem
                    key={dept.id}
                    onClick={() => setSelectedDepartment(dept.id)}
                    className="truncate"
                  >
                    {dept.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right side active scope label */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Badge
            variant="outline"
            className="text-xs font-semibold px-3 py-1 rounded-xl border border-border/80 bg-muted/60 text-foreground/80 shadow-2xs"
          >
            {isDepartmentScoped
              ? t('reports.departmentScope')
              : t('reports.hospitalWide')}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ReportHeader;
