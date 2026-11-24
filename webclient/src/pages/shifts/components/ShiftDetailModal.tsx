import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { ShiftEmployee, ActiveShiftDetail } from '../types';
import { getShiftTemplate } from '../mockData';
import { DAYS_ABBR } from '../utils/shiftCalculations';
import { useLocaleStore } from '@/stores/localeStore';

interface ShiftDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: ActiveShiftDetail | null;
  employees: ShiftEmployee[];
  weekStart: Date;
  onSaveShift: (shiftKey: string | null) => void;
  onClearShift: () => void;
}

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({
  isOpen,
  onClose,
  detail,
  employees,
  weekStart,
  onSaveShift,
  onClearShift,
}) => {
  const { t } = useLocaleStore();
  const [selectedKey, setSelectedKey] = useState<string>('UNASSIGNED');

  useEffect(() => {
    if (detail) {
      setSelectedKey(detail.key || 'UNASSIGNED');
    }
  }, [detail]);

  if (!isOpen || !detail) return null;

  const employee = employees.find((e) => e.name === detail.name) || {
    id: 'EMP-00',
    name: detail.name,
    office: 'London',
    tz: 'Europe/London',
    department: 'Operations',
    avatar: 'avatar-01.jpg',
  };

  const template = getShiftTemplate(detail.key);

  // Calculate the concrete date for this shift
  const shiftDate = new Date(weekStart);
  shiftDate.setDate(shiftDate.getDate() + detail.dayIndex);

  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const dateFormatted = `${DAYS_ABBR[detail.dayIndex]}, ${
    MONTHS[shiftDate.getMonth()]
  } ${String(shiftDate.getDate()).padStart(2, '0')}`;

  const statusBadge = template ? (
    <span
      id="sd-status-badge"
      className="rounded-full bg-teal-500/10 px-2.5 py-1 font-mono text-[11px] font-bold text-teal-700 dark:text-teal-300"
    >
      {template.label}
    </span>
  ) : detail.key === 'OFF' ? (
    <span
      id="sd-status-badge"
      className="rounded-full bg-slate-500/10 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300"
    >
      {t('shifts.shifts.offDuty')}
    </span>
  ) : (
    <span
      id="sd-status-badge"
      className="rounded-full bg-amber-500/10 px-2.5 py-1 font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300"
    >
      {t('shifts.shifts.unassigned')}
    </span>
  );

  const shiftTimingText = template
    ? `${template.start} – ${template.end} (${template.hours} hrs)`
    : detail.key === 'OFF'
    ? t('shifts.detail.restDay')
    : t('shifts.detail.noShift');

  const initials = employee.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleUpdate = () => {
    onSaveShift(selectedKey === 'UNASSIGNED' ? null : selectedKey);
    onClose();
  };

  const handleClear = () => {
    onClearShift();
    onClose();
  };

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      id="shift-detail-modal"
      onMouseDown={handleBackdropMouseDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e2b2d]/55 backdrop-blur-[2px] p-4"
    >
      <div className="w-full max-w-[480px] rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <span
              id="sd-icon-container"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-[#1f786f]"
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="text-base font-bold text-foreground">{t('shifts.detail.title')}</h3>
          </div>
          <button
            type="button"
            id="shift-detail-close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Employee Info Header Pill */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-slate-200 dark:ring-slate-700 bg-slate-200 font-bold text-slate-700">
              {employee.avatarUrl ? (
                <img
                  id="sd-avatar"
                  src={employee.avatarUrl}
                  alt={employee.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p id="sd-name" className="font-bold text-sm text-foreground">
                {employee.name}
              </p>
              <p
                id="sd-office-dept"
                className="font-mono text-xs text-muted-foreground truncate"
              >
                {employee.office} · {employee.department}
              </p>
            </div>
            {statusBadge}
          </div>

          {/* 2-Card Date & Timing Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/30 dark:bg-slate-800/20">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('shifts.detail.dateDay')}
              </span>
              <p id="sd-date" className="mt-1 font-mono text-xs font-bold text-[#1f786f]">
                {dateFormatted}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/30 dark:bg-slate-800/20">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('shifts.detail.shiftTiming')}
              </span>
              <p id="sd-time" className="mt-1 font-mono text-xs font-bold text-[#1f786f]">
                {shiftTimingText}
              </p>
            </div>
          </div>

          {/* Reassign or Change Shift Dropdown */}
          <div className="space-y-1.5">
            <label
              htmlFor="sd-change-select"
              className="block font-bold text-slate-700 dark:text-slate-300"
            >
              {t('shifts.detail.reassign')}
            </label>
            <select
              id="sd-change-select"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="select-arrow h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-card pl-3 pr-8 text-xs font-semibold outline-none transition-colors focus:border-[#1f786f]"
            >
              <option value="Morning">{t('shifts.shifts.morning')} (07:00–15:00)</option>
              <option value="Day">{t('shifts.shifts.day')} (08:00–17:00)</option>
              <option value="Evening">{t('shifts.shifts.evening')} (14:00–21:00)</option>
              <option value="Night">{t('shifts.shifts.night')} (20:00–08:00)</option>
              <option value="OFF">{t('shifts.shifts.off')} (Off Duty)</option>
              <option value="UNASSIGNED">{t('shifts.shifts.unassigned')}</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-slate-50/30 dark:bg-slate-800/30">
          <button
            type="button"
            id="sd-delete-btn"
            onClick={handleClear}
            className="text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer"
          >
            {t('shifts.detail.clearShift')}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="sd-cancel-btn"
              onClick={onClose}
              className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-card px-3.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t('shifts.detail.cancel')}
            </button>
            <button
              type="button"
              id="sd-save-btn"
              onClick={handleUpdate}
              className="h-9 rounded-xl bg-[#1f786f] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#195e58] cursor-pointer"
            >
              {t('shifts.detail.updateShift')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
