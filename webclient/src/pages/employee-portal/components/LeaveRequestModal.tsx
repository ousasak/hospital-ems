import React, { useState, useMemo } from 'react';
import { GlobalModal } from '@/components/common/GlobalModal';
import { SaveButton, CancelButton } from '@/components/common/GlobalActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarDays, Send } from 'lucide-react';
import { api } from '@/api/client';
import { toast } from 'sonner';

interface LeaveTypeItem {
  id: number;
  name: string;
  code?: string;
  default_days_per_year?: number;
}

interface LeaveBalanceItem {
  id: number;
  leave_type_id: number;
  allocated_days?: number;
  used_days?: number;
  pending_days?: number;
  remaining_days?: number;
  leave_type?: { id: number; name: string };
}

interface LeaveRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveTypes: LeaveTypeItem[];
  leaveBalances: LeaveBalanceItem[];
  onSubmitted: () => void;
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  open,
  onOpenChange,
  leaveTypes,
  leaveBalances,
  onSubmitted,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [halfDayType, setHalfDayType] = useState<'morning' | 'afternoon'>('morning');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedTypeId = leaveTypeId || (leaveTypes[0]?.id ? String(leaveTypes[0].id) : '');

  const selectedBalance = useMemo(() => {
    if (!selectedTypeId) return null;
    return leaveBalances.find((b) => String(b.leave_type_id) === String(selectedTypeId)) || null;
  }, [leaveBalances, selectedTypeId]);

  const estimatedDays = useMemo(() => {
    if (isHalfDay) return 0.5;
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e < s) return 0;
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count += 1;
      cur.setDate(cur.getDate() + 1);
    }
    return count === 0 ? 1 : count;
  }, [startDate, endDate, isHalfDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId) {
      setErrorMsg('សូមជ្រើសរើសប្រភេទច្បាប់ឈប់សម្រាក');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('សូមបញ្ជាក់មូលហេតុនៃការសុំច្បាប់ឈប់សម្រាក');
      return;
    }
    if (endDate < startDate) {
      setErrorMsg('ថ្ងៃបញ្ចប់ត្រូវតែធំជាង ឬស្មើថ្ងៃចាប់ផ្តើម');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post('/leaves/requests', {
        leave_type_id: Number(selectedTypeId),
        start_date: startDate,
        end_date: isHalfDay ? startDate : endDate,
        is_half_day: isHalfDay,
        half_day_type: isHalfDay ? halfDayType : null,
        reason: reason.trim(),
      });
      toast.success('បានដាក់សំណើសុំច្បាប់ឈប់សម្រាកដោយជោគជ័យ!');
      setReason('');
      setIsHalfDay(false);
      onSubmitted();
      onOpenChange(false);
    } catch (err: any) {
      const firstValidationError = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      const msg =
        (firstValidationError as string) ||
        err?.response?.data?.message ||
        'មិនអាចដាក់សំណើសុំច្បាប់បានទេ សូមពិនិត្យម្តងទៀត';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlobalModal
      open={open}
      onOpenChange={onOpenChange}
      title="ស្នើសុំច្បាប់ឈប់សម្រាក"
      description="បំពេញព័ត៌មានខាងក្រោមដើម្បីដាក់សំណើទៅប្រធានផ្នែក និងផ្នែកធនធានមនុស្ស"
      icon={<CalendarDays className="size-5" />}
      iconVariant="teal"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <CancelButton onClick={() => onOpenChange(false)} label="បោះបង់" />
          <SaveButton
            type="submit"
            form="leave-request-form"
            loading={submitting}
            label="ដាក់សំណើសុំច្បាប់"
            icon={<Send className="size-3.5" />}
            className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
          />
        </div>
      }
    >
      <form id="leave-request-form" onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <Alert variant="destructive">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

          {/* Leave Type */}
          <div className="space-y-2">
            <Label htmlFor="leave-type">ប្រភេទច្បាប់ឈប់សម្រាក *</Label>
            <Select value={selectedTypeId} onValueChange={setLeaveTypeId}>
              <SelectTrigger id="leave-type">
                <SelectValue placeholder="ជ្រើសរើសប្រភេទច្បាប់" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((lt) => (
                  <SelectItem key={lt.id} value={String(lt.id)}>
                    {lt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBalance && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                <span>
                  សមតុល្យនៅសល់:{' '}
                  <strong className="text-foreground">{selectedBalance.remaining_days ?? 0} ថ្ងៃ</strong>
                </span>
                <span>
                  បានប្រើ: {selectedBalance.used_days ?? 0} / {selectedBalance.allocated_days ?? 0} ថ្ងៃ
                </span>
              </div>
            )}
          </div>

          {/* Half day switch */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <Switch
                id="half-day-toggle"
                checked={isHalfDay}
                onCheckedChange={(checked) => {
                  setIsHalfDay(checked);
                  if (checked) setEndDate(startDate);
                }}
              />
              <Label htmlFor="half-day-toggle" className="text-xs font-medium cursor-pointer">
                សុំឈប់សម្រាកកន្លះថ្ងៃ
              </Label>
            </div>
            {isHalfDay && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={halfDayType === 'morning' ? 'default' : 'outline'}
                  onClick={() => setHalfDayType('morning')}
                  className="h-7 px-2.5 text-xs"
                >
                  ព្រឹក
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={halfDayType === 'afternoon' ? 'default' : 'outline'}
                  onClick={() => setHalfDayType('afternoon')}
                  className="h-7 px-2.5 text-xs"
                >
                  រសៀល
                </Button>
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="leave-start">ថ្ងៃចាប់ផ្តើម *</Label>
              <Input
                id="leave-start"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (isHalfDay || e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-end">ថ្ងៃបញ្ចប់ *</Label>
              <Input
                id="leave-end"
                type="date"
                value={isHalfDay ? startDate : endDate}
                min={startDate}
                disabled={isHalfDay}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
            <span className="text-muted-foreground">ចំនួនថ្ងៃធ្វើការប៉ាន់ស្មាន</span>
            <Badge variant="secondary" className="tabular-nums">
              {estimatedDays} ថ្ងៃ
            </Badge>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="leave-reason">មូលហេតុ *</Label>
            <Textarea
              id="leave-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="សូមបញ្ជាក់មូលហេតុនៃការសុំច្បាប់ឈប់សម្រាក..."
              className="resize-none"
              required
            />
          </div>

      </form>
    </GlobalModal>
  );
};
