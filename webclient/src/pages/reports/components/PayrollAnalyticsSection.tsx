import React from 'react';
import { useLocaleStore } from '@/stores/localeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils';
import type { PayrollAnalyticsResponse } from '@/services/reportService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  CreditCard,
  ShieldCheck,
  DollarSign,
  Coins,
  PieChart,
  Building2,
} from 'lucide-react';

interface PayrollAnalyticsSectionProps {
  data?: PayrollAnalyticsResponse;
  isLoading?: boolean;
  canViewPayroll?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-popover/95 p-2.5 text-xs text-popover-foreground shadow-lg backdrop-blur-xs space-y-1">
        {label && <p className="font-semibold text-foreground">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const PayrollAnalyticsSection: React.FC<PayrollAnalyticsSectionProps> = ({
  data,
  isLoading = false,
  canViewPayroll = false,
}) => {
  const { t } = useLocaleStore();

  if (!canViewPayroll) {
    return null; // Strict privacy: do not render section for non-authorized roles
  }

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // When Payroll Module is not enabled in database schema or unavailable
  if (!data?.available) {
    return (
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              <span>{t('reports.sections.payroll', 'ការវិភាគប្រាក់បៀវត្សរ៍ និងហិរញ្ញវត្ថុ')}</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('reports.sections.payrollSubtitle', 'ការចំណាយប្រាក់បៀវត្សរ៍ ការកាត់កង និងចំណាយតាមផ្នែក')}
            </p>
          </div>

          <Badge
            variant="outline"
            className="self-start sm:self-auto text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 gap-1.5 shadow-2xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>{t('reports.payrollDisabled.status', 'មិនទាន់បើកដំណើរការ')}</span>
          </Badge>
        </div>

        {/* Clean Informative Card */}
        <Card className="rounded-2xl border border-border/70 shadow-xs bg-card overflow-hidden">
          <CardContent className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
              <Coins className="h-7 w-7 stroke-[1.8]" />
            </div>

            <div className="space-y-1.5 max-w-lg">
              <h3 className="text-base font-bold text-foreground">
                {t('reports.payrollDisabled.title', 'ការវិភាគប្រាក់បៀវត្សរ៍ និងហិរញ្ញវត្ថុ')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('reports.payrollDisabled.description', 'ម៉ូឌុលប្រាក់បៀវត្សរ៍មិនទាន់ត្រូវបានបើកដំណើរការ ឬកំណត់រចនាសម្ព័ន្ធក្នុងប្រព័ន្ធទិន្នន័យមន្ទីរពេទ្យនៅឡើយទេ។')}
              </p>
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed pt-1">
                {t('reports.payrollDisabled.subtext', 'នៅពេលដែលម៉ូឌុលនេះត្រូវបានដាក់ឱ្យដំណើរការ ទិន្នន័យចំណាយប្រាក់ខែសរុប ការកាត់កង និងនិន្នាការបើកផ្តល់ប្រចាំខែនឹងបង្ហាញនៅទីនេះដោយស្វ័យប្រវត្តិ។')}
              </p>
            </div>

            {/* Clean Dashed Feature Placeholders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl pt-2">
              <div className="p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center text-center space-y-1.5">
                <div className="p-2 rounded-lg bg-background text-muted-foreground shadow-2xs">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {t('reports.payrollDisabled.featureDisbursement', 'ការចំណាយប្រាក់បៀវត្សរ៍ប្រចាំខែ')}
                </span>
                <span className="text-[11px] text-muted-foreground/50 font-mono">—</span>
              </div>

              <div className="p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center text-center space-y-1.5">
                <div className="p-2 rounded-lg bg-background text-muted-foreground shadow-2xs">
                  <PieChart className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {t('reports.payrollDisabled.featureDeductions', 'ការកាត់កង និងពន្ធ')}
                </span>
                <span className="text-[11px] text-muted-foreground/50 font-mono">—</span>
              </div>

              <div className="p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center text-center space-y-1.5">
                <div className="p-2 rounded-lg bg-background text-muted-foreground shadow-2xs">
                  <Building2 className="h-4 w-4 text-purple-500" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {t('reports.payrollDisabled.featureDeptAnalysis', 'វិភាគចំណាយតាមផ្នែក')}
                </span>
                <span className="text-[11px] text-muted-foreground/50 font-mono">—</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const payrolls = data?.payrolls || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-500" />
            <span>{t('reports.sections.payroll')}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('reports.sections.payrollSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium text-xs"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            {t('reports.unauthorized.financeAuthorized')}
          </Badge>
        </div>
      </div>

      {/* Monthly Payroll Bar Chart */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span>{t('reports.charts.monthlyPayrollExp')} ({data?.year ?? 2026})</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t('reports.charts.monthlyPayrollDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {payrolls.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payrolls} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                  <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="gross"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name={t('reports.charts.grossSalary')}
                  />
                  <Bar
                    dataKey="net"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name={t('reports.charts.netSalary')}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">
              {t('reports.empty.noPayrollRecords', { year: data?.year ?? 2026 })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollAnalyticsSection;
