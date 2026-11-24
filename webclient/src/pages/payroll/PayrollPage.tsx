import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '@/services/payrollService';
import { useLocaleStore } from '../../stores/localeStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  FileText,
  DollarSign,
  Printer,
  Eye,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { UnifiedFilterToolbar } from '@/components/common/UnifiedFilterToolbar';
import { AddButton } from '@/components/common/GlobalActionButtons';
import { EnterpriseStatsGrid, EnterpriseStatsCard, Pagination, TableWrapper } from '@/components/common';

export const PayrollPage: React.FC = () => {
  const { t, locale } = useLocaleStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    currency: 'USD',
    payment_date: new Date().toISOString().split('T')[0],
  });

  // Query batches
  const { data: batchesResponse, isLoading } = useQuery({
    queryKey: ['payroll-batches'],
    queryFn: async () => {
      return await payrollService.getBatches();
    },
  });

  // Query active batch detail
  const { data: batchDetail, isLoading: isBatchLoading } = useQuery({
    queryKey: ['payroll-batch-detail', selectedBatchId],
    queryFn: async () => {
      if (!selectedBatchId) return null;
      return await payrollService.getBatch(selectedBatchId);
    },
    enabled: !!selectedBatchId,
  });

  // Process payroll batch mutation
  const processBatchMutation = useMutation({
    mutationFn: async () => await payrollService.processBatch(form),
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Payroll processed successfully');
      setProcessModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['payroll-batches'] });
      if (data?.payroll?.id) {
        setSelectedBatchId(data.payroll.id);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Processing failed');
    },
  });

  // Update batch status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await payrollService.updateBatchStatus(id, status);
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Status updated');
      queryClient.invalidateQueries({ queryKey: ['payroll-batches'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-batch-detail', selectedBatchId] });
    },
  });

  const rawBatches = Array.isArray(batchesResponse)
    ? batchesResponse
    : Array.isArray(batchesResponse?.data)
    ? batchesResponse.data
    : [];
  const batches = rawBatches.filter((b: any) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        b.title?.toLowerCase().includes(q) ||
        String(b.id).includes(q) ||
        b.period_start?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter && (b.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.payroll.title}
        subtitle={t.payroll.subtitle}
        breadcrumbs={[{ label: t.nav.payroll }, { label: t.payroll.title }]}
        action={
          <AddButton
            onClick={() => setProcessModalOpen(true)}
            label={t.payroll.processPayroll}
            size="sm"
          />
        }
      />

      {/* Global 4 Summary KPI Cards */}
      <EnterpriseStatsGrid columns={4}>
        <EnterpriseStatsCard
          title={t('payroll.netTotal', 'ប្រាក់បៀវត្សរ៍សុទ្ធ')}
          value={formatCurrency(batches[0]?.total_net || 10500, batches[0]?.currency || 'USD')}
          subtitle={t('payroll.monthlyExpenditure', 'ការចំណាយប្រាក់បៀវត្សរ៍ប្រចាំខែ')}
          valueClassName="text-emerald-600 dark:text-emerald-400"
          icon={CreditCard}
          variant="emerald"
        />
        <EnterpriseStatsCard
          title={t('payroll.grossTotal', 'ប្រាក់បៀវត្សរ៍ដុលសរុប')}
          value={formatCurrency(batches[0]?.total_gross || 11600, batches[0]?.currency || 'USD')}
          subtitle={t('payroll.grossPay', 'ប្រាក់បៀវត្សរ៍មូលដ្ឋាន និងប្រាក់ឧបត្ថម្ភ')}
          icon={DollarSign}
          variant="blue"
          delay={0.05}
        />
        <EnterpriseStatsCard
          title={t('payroll.taxWithholding', 'ពន្ធកាត់ទុកលើប្រាក់បៀវត្សរ៍')}
          value={formatCurrency(batches[0]?.total_deductions || 1100, batches[0]?.currency || 'USD')}
          subtitle={t('payroll.deductions', 'ប្រាក់ពន្ធកាត់ទុក')}
          icon={ShieldCheck}
          variant="purple"
          delay={0.1}
        />
        <EnterpriseStatsCard
          title={t('payroll.payrollBatches', 'ដំណើរការបើកប្រាក់បៀវត្សរ៍')}
          value={batches.length}
          subtitle={t('payroll.cycles', 'វដ្តបើកប្រាក់បៀវត្សរ៍ប្រចាំខែ')}
          valueClassName="text-amber-600 dark:text-amber-400"
          icon={FileText}
          variant="amber"
          delay={0.15}
        />
      </EnterpriseStatsGrid>

      {/* Filter Toolbar */}
      <UnifiedFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('payroll.searchPlaceholder')}
        filters={[
          {
            id: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: '', label: t('filters.allStatus') },
              { value: 'paid', label: t('status.paid') },
              { value: 'approved', label: t('status.approved') },
              { value: 'processing', label: t('status.processing') },
              { value: 'draft', label: t('status.draft') },
            ],
            minWidth: 'min-w-[150px]',
          },
        ]}
        onReset={() => {
          setSearch('');
          setStatusFilter('');
        }}
      />

      {/* Batches Overview Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" /> {t('payroll.cycles', 'វដ្តបើកប្រាក់បៀវត្សរ៍ប្រចាំខែ')}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {t('payroll.totalBatches', 'កញ្ចប់សរុប')}: <strong>{batches.length}</strong>
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState message={t('common.loading', 'កំពុងផ្ទុក...')} />
          ) : (
            <TableWrapper>
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-3.5">{t('payroll.batchTitle', 'ចំណងជើងកញ្ចប់')}</th>
                    <th className="px-4 py-3.5">{t('payroll.paymentDate', 'ថ្ងៃបើកប្រាក់បៀវត្សរ៍')}</th>
                    <th className="px-4 py-3.5">{t('payroll.grossTotal', 'ប្រាក់បៀវត្សរ៍ដុលសរុប')}</th>
                    <th className="px-4 py-3.5">{t('payroll.totalDeductions', 'ប្រាក់កាត់សរុប')}</th>
                    <th className="px-4 py-3.5">{t('payroll.netTotal', 'ប្រាក់បៀវត្សរ៍សុទ្ធ')}</th>
                    <th className="px-4 py-3.5">{t('payroll.status', 'ស្ថានភាព')}</th>
                    <th className="px-5 py-3.5 text-right">{t('common.actions', 'សកម្មភាព')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        {t('payroll.noBatches', 'មិនទាន់មានទិន្នន័យកញ្ចប់បើកប្រាក់បៀវត្សរ៍នៅឡើយទេ។')}
                      </td>
                    </tr>
                  ) : (
                    batches.map((b: any) => (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBatchId(b.id)}
                        className={`cursor-pointer transition-colors ${
                          selectedBatchId === b.id ? 'bg-primary/5' : 'hover:bg-muted/30'
                        }`}
                      >
                        <td className="px-5 py-3">
                          <span className="font-semibold text-foreground text-sm">{b.title}</span>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {t('payroll.batch', 'កញ្ចប់')} #{b.id} • {b.items_count ?? 0} {t('payroll.employees', 'បុគ្គលិក')}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground font-mono">
                          {t('payroll.payDate', 'ថ្ងៃបើក')}: <strong className="text-foreground">{formatDate(b.payment_date, locale)}</strong>
                        </td>

                        <td className="px-4 py-3 font-semibold text-foreground">
                          {formatCurrency(b.total_gross, b.currency)}
                        </td>

                        <td className="px-4 py-3 text-rose-600 font-semibold">
                          -{formatCurrency(b.total_deductions, b.currency)}
                        </td>

                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatCurrency(b.total_net, b.currency)}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={b.status} />
                        </td>

                        <td className="px-5 py-3 text-right">
                          <Button
                            variant={selectedBatchId === b.id ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 text-xs"
                          >
                            {t('payroll.viewPayslip', 'មើលព័ត៌មានលម្អិត')}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrapper>
          )}
        </CardContent>
      </Card>

      {/* Selected Batch Line Items Breakdown */}
      {selectedBatchId && (
        <Card className="border-primary/40 shadow-md animate-in fade-in-50">
          <CardHeader className="border-b bg-muted/20 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{batchDetail?.title}</CardTitle>
                <StatusBadge status={batchDetail?.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Currency: <strong>{batchDetail?.currency}</strong> • Processed by: {batchDetail?.processor?.name || 'Accountant'}
              </p>
            </div>

            {/* Workflow Control Buttons */}
            <div className="flex items-center gap-2">
              {batchDetail?.status === 'draft' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate({ id: batchDetail.id, status: 'reviewed' })}
                  disabled={updateStatusMutation.isPending}
                >
                  Mark as Reviewed
                </Button>
              )}

              {batchDetail?.status === 'reviewed' && (
                <Button
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ id: batchDetail.id, status: 'approved' })}
                  disabled={updateStatusMutation.isPending}
                  className="bg-primary"
                >
                  Approve Payroll
                </Button>
              )}

              {batchDetail?.status === 'approved' && (
                <Button
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ id: batchDetail.id, status: 'paid' })}
                  disabled={updateStatusMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Execute & Mark as Paid
                </Button>
              )}

              <Button variant="ghost" size="sm" onClick={() => setSelectedBatchId(null)}>
                Close
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isBatchLoading ? (
              <LoadingState message="Loading payroll line items..." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase">
                    <tr>
                      <th className="px-5 py-3">Employee</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Base Salary</th>
                      <th className="px-4 py-3">Allowances</th>
                      <th className="px-4 py-3">Tax Deduction</th>
                      <th className="px-4 py-3">Net Pay</th>
                      <th className="px-5 py-3 text-right">Payslip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {batchDetail?.items?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-5 py-3">
                          <span className="font-semibold text-foreground">{item.employee?.full_name}</span>
                          <span className="block font-mono text-[11px] text-primary">{item.employee?.employee_code}</span>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {item.employee?.primary_assignment?.department?.name || 'Unassigned'}
                        </td>

                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(item.base_salary, item.currency)}
                        </td>

                        <td className="px-4 py-3 text-emerald-600 font-medium">
                          +{formatCurrency(item.allowance_total, item.currency)}
                        </td>

                        <td className="px-4 py-3 text-rose-600 font-medium">
                          -{formatCurrency(item.tax_amount, item.currency)}
                        </td>

                        <td className="px-4 py-3 font-bold text-sm text-foreground">
                          {formatCurrency(item.net_salary, item.currency)}
                        </td>

                        <td className="px-5 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPayslip({ ...item.payslip, item, batch: batchDetail })}
                            className="h-7 text-xs gap-1.5"
                          >
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            {t.payroll.viewPayslip}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Process Payroll Modal */}
      <Dialog open={processModalOpen} onOpenChange={setProcessModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Monthly Payroll Cycle</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              processBatchMutation.mutate();
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium">Month *</label>
                <select
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2026, m - 1, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium">Year *</label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium">Operating Currency *</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs"
                >
                  <option value="USD">USD ($) - US Dollars</option>
                  <option value="KHR">KHR (៛) - Khmer Riel</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium">Disbursement Pay Date *</label>
                <Input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-muted-foreground space-y-1 text-[11px]">
              <p>• Automatically snapshot active base salaries across all active employees.</p>
              <p>• Calculates standard allowances and applicable progressive tax withholding.</p>
              <p>• Generates individual payslips in Draft status ready for review.</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProcessModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processBatchMutation.isPending}>
                {processBatchMutation.isPending ? 'Calculating...' : 'Run Calculations'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Printable Payslip Modal */}
      {selectedPayslip && (
        <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
          <DialogContent className="max-w-xl">
            <div className="p-4 space-y-6 bg-card text-foreground" id="printable-payslip">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h3 className="font-extrabold text-lg tracking-tight">StaffStream Technologies Ltd.</h3>
                  <p className="text-xs text-muted-foreground">Canadia Tower, Preah Monivong, Phnom Penh</p>
                  <span className="text-[11px] text-primary font-mono mt-1 block">
                    Payslip Number: {selectedPayslip.payslip_number || selectedPayslip.payslip?.payslip_number}
                  </span>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="font-bold text-xs uppercase">
                    {selectedPayslip.batch?.title}
                  </Badge>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Pay Date: {formatDate(selectedPayslip.batch?.payment_date, locale)}
                  </p>
                </div>
              </div>

              {/* Employee Summary */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Employee Name:</span>
                  <strong className="text-sm">{selectedPayslip.item?.employee?.full_name}</strong>
                  <span className="text-muted-foreground block mt-1">Employee Code:</span>
                  <strong className="font-mono">{selectedPayslip.item?.employee?.employee_code}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Department:</span>
                  <strong>{selectedPayslip.item?.employee?.primary_assignment?.department?.name}</strong>
                  <span className="text-muted-foreground block mt-1">Position:</span>
                  <strong>{selectedPayslip.item?.employee?.primary_assignment?.position?.title}</strong>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 border-r pr-4">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-600">Earnings</span>
                  <div className="flex justify-between py-1 border-b">
                    <span>Base Salary:</span>
                    <strong>{formatCurrency(selectedPayslip.item?.base_salary, selectedPayslip.item?.currency)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>Allowances:</span>
                    <strong>{formatCurrency(selectedPayslip.item?.allowance_total, selectedPayslip.item?.currency)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>Overtime:</span>
                    <strong>{formatCurrency(selectedPayslip.item?.overtime_pay, selectedPayslip.item?.currency)}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-rose-600">Deductions</span>
                  <div className="flex justify-between py-1 border-b">
                    <span>Salary Tax Withholding:</span>
                    <strong className="text-rose-600">{formatCurrency(selectedPayslip.item?.tax_amount, selectedPayslip.item?.currency)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>Other Deductions:</span>
                    <strong>{formatCurrency(selectedPayslip.item?.deduction_total, selectedPayslip.item?.currency)}</strong>
                  </div>
                </div>
              </div>

              {/* Net Disbursed Footer */}
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">Net Disbursed Salary</span>
                  <h4 className="text-2xl font-black text-primary">
                    {formatCurrency(selectedPayslip.item?.net_salary, selectedPayslip.item?.currency)}
                  </h4>
                </div>
                <Badge variant="success">Confirmed Paid</Badge>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                <Printer className="h-4 w-4" /> Print Payslip
              </Button>
              <Button size="sm" onClick={() => setSelectedPayslip(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

