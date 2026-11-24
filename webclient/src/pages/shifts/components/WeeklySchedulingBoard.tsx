import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  Copy,
  Calendar,
} from 'lucide-react';
import {
  ShiftEmployee,
  WeeklyScheduleMap,
  ActiveShiftDetail,
} from '../types';
import {
  formatWeekRange,
  DAYS_ABBR_EN,
  DAYS_ABBR_KM,
  DAYS_SHORT_KM,
  MONTHS_EN,
  MONTHS_KM,
  getStartOfWeek,
} from '../utils/shiftCalculations';
import { getShiftTemplate, DEFAULT_REFERENCE_START } from '../mockData';
import { Button } from '../../../components/ui/button';
import { useLocaleStore } from '@/stores/localeStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface WeeklySchedulingBoardProps {
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday?: () => void;
  onDateJump?: (date: Date) => void;
  onCopyLastWeek?: () => void;
  onQuickAssign?: (employeeName: string, dayIndex: number, shiftKey: string | null) => void;
  onBatchAssign?: (employeeName: string, pattern: 'office' | 'morning' | 'evening' | 'night' | 'clear') => void;
  employees: ShiftEmployee[];
  schedule: WeeklyScheduleMap;
  onSelectShift: (detail: ActiveShiftDetail) => void;
  onClearFilters: () => void;
}

export const WeeklySchedulingBoard: React.FC<WeeklySchedulingBoardProps> = ({
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  onDateJump,
  onCopyLastWeek,
  onQuickAssign,
  onBatchAssign,
  employees,
  schedule,
  onSelectShift,
  onClearFilters,
}) => {
  const { t, locale } = useLocaleStore();
  const weekLabel = formatWeekRange(weekStart, locale);

  // Calendar popover state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [popoverMonth, setPopoverMonth] = useState(() => weekStart.getMonth());
  const [popoverYear, setPopoverYear] = useState(() => weekStart.getFullYear());

  const handleCalendarOpenChange = (open: boolean) => {
    setCalendarOpen(open);
    if (open) {
      setPopoverMonth(weekStart.getMonth());
      setPopoverYear(weekStart.getFullYear());
    }
  };

  const handlePrevMonth = () => {
    setPopoverMonth((prev) => {
      if (prev === 0) {
        setPopoverYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setPopoverMonth((prev) => {
      if (prev === 11) {
        setPopoverYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Quick cell assignment popover state
  const [popover, setPopover] = useState<{
    empName: string;
    dayIdx: number;
    currentKey: string | null;
    top: number;
    left: number;
  } | null>(null);

  // Quick batch menu state per employee
  const [batchMenuEmp, setBatchMenuEmp] = useState<string | null>(null);

  // Listen to outside clicks to dismiss popovers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.shift-popover') && !target.closest('.shift-cell-btn')) {
        setPopover(null);
      }
      if (!target.closest('.batch-menu') && !target.closest('.batch-menu-trigger')) {
        setBatchMenuEmp(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Compute the 7 date objects for this week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const now = new Date();
  const isCurrentWeek =
    getStartOfWeek(now).getTime() === getStartOfWeek(weekStart).getTime();

  // Helper for popover month days grid
  const calendarDays = useMemo(() => {
    const year = popoverYear;
    const month = popoverMonth;
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const selectedWeekStartMs = getStartOfWeek(weekStart).getTime();
    const selectedWeekEndMs = selectedWeekStartMs + 6 * 24 * 60 * 60 * 1000;

    const todayDate = new Date();
    const todayY = todayDate.getFullYear();
    const todayM = todayDate.getMonth();
    const todayD = todayDate.getDate();

    const result = [];

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateObj = new Date(year, month - 1, d);
      const ms = dateObj.getTime();
      result.push({
        day: d,
        date: dateObj,
        isCurrentMonth: false,
        isToday: dateObj.getFullYear() === todayY && dateObj.getMonth() === todayM && d === todayD,
        inSelectedWeek: ms >= selectedWeekStartMs && ms <= selectedWeekEndMs,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const ms = dateObj.getTime();
      result.push({
        day: d,
        date: dateObj,
        isCurrentMonth: true,
        isToday: year === todayY && month === todayM && d === todayD,
        inSelectedWeek: ms >= selectedWeekStartMs && ms <= selectedWeekEndMs,
      });
    }

    // Next month padding to fill full weeks (35 or 42 slots)
    const totalSlots = result.length <= 35 ? 35 : 42;
    const remaining = totalSlots - result.length;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month + 1, d);
      const ms = dateObj.getTime();
      result.push({
        day: d,
        date: dateObj,
        isCurrentMonth: false,
        isToday: dateObj.getFullYear() === todayY && dateObj.getMonth() === todayM && d === todayD,
        inSelectedWeek: ms >= selectedWeekStartMs && ms <= selectedWeekEndMs,
      });
    }

    return result;
  }, [popoverYear, popoverMonth, weekStart]);

  // Highlight Friday (day 5) on reference week (matching reference app demo state), or real current day on active week
  const isReferenceWeek =
    weekStart.getTime() === DEFAULT_REFERENCE_START.getTime();
  const highlightedDayIdx = isReferenceWeek ? 5 : isCurrentWeek ? now.getDay() : -1;

  // Helper to calculate weekly hours and shift count for an employee
  const calculateEmployeeStats = (empSchedule: (string | null)[]) => {
    let hours = 0;
    let count = 0;
    empSchedule.forEach((key) => {
      const template = getShiftTemplate(key);
      if (template) {
        hours += template.hours;
        count++;
      }
    });
    return { hours, count };
  };

  const handleCellClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    empName: string,
    dayIdx: number,
    currentKey: string | null
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 320;
    const popoverHeight = 330;

    let top = rect.bottom + 6;
    if (top + popoverHeight > window.innerHeight) {
      top = Math.max(10, rect.top - popoverHeight - 6);
    }

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    setPopover({
      empName,
      dayIdx,
      currentKey,
      top,
      left,
    });
  };

  return (
    <section
      aria-label="Weekly scheduling board"
      className="panel mb-6 overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-card p-4 sm:p-5 shadow-xs relative"
    >
      {/* 1. Clean Header with Title & Structured Week Navigation */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            {t('shifts.board.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('shifts.board.subtitle')}
          </p>
        </div>

        {/* Clean, Compact Date Navigation Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Segmented Week Navigator Pill */}
          <div className="inline-flex items-center rounded-xl border border-border bg-card shadow-2xs h-8 overflow-hidden">
            <button
              type="button"
              id="week-prev"
              onClick={onPrevWeek}
              title={locale === 'km' ? 'សប្តាហ៍មុន' : 'Previous week'}
              aria-label="Previous week"
              className="h-full px-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <div className="h-3.5 w-px bg-border/70" />

            {/* Date Range Popover Trigger */}
            <Popover open={calendarOpen} onOpenChange={handleCalendarOpenChange}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  id="week-label"
                  className="h-full px-2.5 flex items-center gap-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors select-none cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" aria-hidden="true" />
                  <span className="tracking-tight">{weekLabel}</span>
                </button>
              </PopoverTrigger>

              <PopoverContent
                className="w-[280px] p-3 rounded-2xl border-border bg-card text-foreground shadow-xl"
                align="end"
                sideOffset={6}
              >
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pb-2.5 mb-2.5 border-b border-border text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (onToday) {
                        onToday();
                      } else if (onDateJump) {
                        onDateJump(new Date());
                      }
                      setCalendarOpen(false);
                    }}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                      isCurrentWeek
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    {t('common.today', 'ថ្ងៃនេះ')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onPrevWeek();
                    }}
                    className="flex-1 py-1 px-1.5 rounded-lg text-xs font-semibold text-center bg-muted hover:bg-muted/80 text-foreground transition-all cursor-pointer"
                  >
                    {locale === 'km' ? 'សប្តាហ៍មុន' : 'Prev Week'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onNextWeek();
                    }}
                    className="flex-1 py-1 px-1.5 rounded-lg text-xs font-semibold text-center bg-muted hover:bg-muted/80 text-foreground transition-all cursor-pointer"
                  >
                    {locale === 'km' ? 'សប្តាហ៍ក្រោយ' : 'Next Week'}
                  </button>
                </div>

                {/* Month/Year Navigation */}
                <div className="flex items-center justify-between px-1 pb-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold text-foreground">
                    {locale === 'km' ? MONTHS_KM[popoverMonth] : MONTHS_EN[popoverMonth]} {popoverYear}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground mb-1 select-none">
                  {(locale === 'km' ? DAYS_SHORT_KM : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']).map((d, idx) => (
                    <span key={idx}>{d}</span>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {calendarDays.map((item, idx) => {
                    const isSelected = item.inSelectedWeek;
                    const isTodayDate = item.isToday;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (onDateJump) {
                            onDateJump(item.date);
                          } else if (onToday) {
                            onToday();
                          }
                          setCalendarOpen(false);
                        }}
                        className={`h-7 w-7 mx-auto rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
                          !item.isCurrentMonth
                            ? 'text-muted-foreground/40'
                            : isTodayDate
                            ? 'font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/30'
                            : isSelected
                            ? 'bg-teal-600 text-white font-semibold shadow-2xs'
                            : 'text-foreground hover:bg-muted font-medium'
                        }`}
                      >
                        {item.day}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <div className="h-3.5 w-px bg-border/70" />

            <button
              type="button"
              id="week-next"
              onClick={onNextWeek}
              title={locale === 'km' ? 'សប្តាហ៍បន្ទាប់' : 'Next week'}
              aria-label="Next week"
              className="h-full px-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Minimal Clean Legend Strip (No chunky pill boxes) */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal-500" />
          <span className="font-medium text-foreground">{t('shifts.legend.morning')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          <span className="font-medium text-foreground">{t('shifts.legend.day')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="font-medium text-foreground">{t('shifts.legend.evening')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          <span className="font-medium text-foreground">{t('shifts.legend.night')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-dashed border-slate-400 bg-slate-200 dark:bg-slate-700" />
          <span className="font-medium text-muted-foreground">{t('shifts.legend.offUnassigned')}</span>
        </div>
      </div>

      {/* 3. Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full min-w-[960px] text-left">
          <caption className="sr-only">Weekly scheduling board</caption>
          <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-xs tracking-wide text-muted-foreground">
            <tr id="board-head-row" className="border-b border-slate-200 dark:border-slate-800">
              <th scope="col" className="px-4 py-3 font-semibold text-foreground min-w-[210px]">
                {t('shifts.board.employeeDuty')}
              </th>
              {weekDates.map((d, dayIdx) => {
                const isHighlighted = dayIdx === highlightedDayIdx;
                const dayName = locale === 'km' ? DAYS_ABBR_KM[dayIdx] : DAYS_ABBR_EN[dayIdx];
                return (
                  <th
                    key={dayIdx}
                    scope="col"
                    className={`px-2 py-2.5 text-center min-w-[105px] transition-colors ${
                      isHighlighted ? 'bg-teal-500/10 dark:bg-teal-950/30' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-[11px] font-semibold ${
                          isHighlighted ? 'text-teal-700 dark:text-teal-400' : 'text-muted-foreground'
                        }`}
                      >
                        {dayName}
                      </span>
                      <span
                        className={`mt-1 inline-flex items-center justify-center text-xs font-semibold transition-all ${
                          isHighlighted
                            ? 'h-6 w-6 rounded-full bg-[#1f786f] text-white shadow-2xs'
                            : 'text-foreground'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody id="board-body" className="text-xs divide-y divide-slate-100 dark:divide-slate-800/80">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                    <Search className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-foreground">
                    {t('shifts.board.noEmployees')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('shifts.board.noEmployeesDesc')}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    id="board-reset-btn"
                    onClick={onClearFilters}
                    className="mt-4 gap-1.5 text-xs font-medium"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('shifts.board.clearFilters')}</span>
                  </Button>
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const empSchedule = schedule[emp.name] ?? [];
                const stats = calculateEmployeeStats(empSchedule);
                const initials = emp.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <tr
                    key={emp.id}
                    className="group border-b border-slate-100 dark:border-slate-800/80 last:border-0 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                  >
                    {/* Employee Profile Cell */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-300">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs sm:text-[13px] font-semibold text-foreground leading-tight">
                            {emp.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                            {emp.department}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="inline-block font-mono text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
                              {stats.hours}h · {stats.count} {t('shifts.board.shifts')}
                            </span>
                            {onBatchAssign && (
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBatchMenuEmp(batchMenuEmp === emp.name ? null : emp.name);
                                  }}
                                  className="batch-menu-trigger text-[10.5px] font-medium text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 opacity-60 hover:opacity-100 transition-opacity underline decoration-dotted"
                                  title={t('shifts.board.batchFill')}
                                >
                                  {t('shifts.board.batchFill')}
                                </button>
                                {batchMenuEmp === emp.name && (
                                  <div className="batch-menu absolute left-0 top-full mt-1 z-40 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-popover p-1.5 shadow-xl text-xs divide-y divide-border/40 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="px-2 py-1 font-semibold text-[10.5px] text-muted-foreground">
                                      {t('shifts.board.autoFillWeek')}
                                    </div>
                                    <div className="py-1 space-y-0.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onBatchAssign(emp.name, 'office');
                                          setBatchMenuEmp(null);
                                        }}
                                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-2 text-slate-700 dark:text-slate-200"
                                      >
                                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                                        <span>{t('shifts.board.officeHours')}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onBatchAssign(emp.name, 'morning');
                                          setBatchMenuEmp(null);
                                        }}
                                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-2 text-slate-700 dark:text-slate-200"
                                      >
                                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                                        <span>{t('shifts.board.morningRotation')}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onBatchAssign(emp.name, 'night');
                                          setBatchMenuEmp(null);
                                        }}
                                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-2 text-slate-700 dark:text-slate-200"
                                      >
                                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                        <span>{t('shifts.board.nightRotation')}</span>
                                      </button>
                                    </div>
                                    <div className="pt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onBatchAssign(emp.name, 'clear');
                                          setBatchMenuEmp(null);
                                        }}
                                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium flex items-center gap-2 text-rose-600 dark:text-rose-400"
                                      >
                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                        <span>{t('shifts.board.clearWeek')}</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 7 Daily Shift Schedule Cells */}
                    {Array.from({ length: 7 }, (_, dayIdx) => {
                      const shiftKey = empSchedule[dayIdx] ?? null;
                      const isHighlighted = dayIdx === highlightedDayIdx;
                      const template = getShiftTemplate(shiftKey);

                      return (
                        <td
                          key={dayIdx}
                          className={`px-1.5 py-1.5 text-center transition-colors ${
                            isHighlighted ? 'bg-[#dbeee5]/15 dark:bg-teal-950/20' : ''
                          }`}
                        >
                          {shiftKey === 'OFF' ? (
                            <button
                              type="button"
                              onClick={(e) => handleCellClick(e, emp.name, dayIdx, 'OFF')}
                              data-emp={emp.name}
                              data-day={dayIdx}
                              data-key="OFF"
                              className="shift-cell-btn flex h-10 w-full flex-col items-center justify-center rounded-lg border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-[10.5px] font-medium text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 focus:outline-none cursor-pointer"
                            >
                              <span>{t('shifts.shifts.off')}</span>
                            </button>
                          ) : shiftKey && template ? (
                            <button
                              type="button"
                              onClick={(e) => handleCellClick(e, emp.name, dayIdx, shiftKey)}
                              data-emp={emp.name}
                              data-day={dayIdx}
                              data-key={shiftKey}
                              className={`shift-cell-btn flex h-10 w-full flex-col items-center justify-center rounded-lg border ${template.cls} px-1.5 py-1 text-center shadow-2xs transition-all duration-150 hover:opacity-90 active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#1f786f] cursor-pointer`}
                            >
                              <span className="text-[11px] font-semibold leading-tight truncate w-full">
                                {template.label}
                              </span>
                              <span className="mt-0.5 font-mono text-[9px] font-medium opacity-80 leading-none">
                                {template.start}–{template.end}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleCellClick(e, emp.name, dayIdx, null)}
                              data-emp={emp.name}
                              data-day={dayIdx}
                              className="shift-cell-btn group/cell flex h-10 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-transparent text-slate-300 dark:text-slate-600 transition-all hover:border-[#1f786f]/50 hover:bg-[#dbeee5]/15 active:scale-95 focus:outline-none cursor-pointer"
                            >
                              <span className="text-xs group-hover/cell:hidden">—</span>
                              <span className="hidden group-hover/cell:inline text-[10.5px] font-semibold text-[#1f786f] dark:text-teal-400">
                                + {t('shifts.board.assignShift')}
                              </span>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Clean Quick Shift Assignment Popover (No excessive icons) */}
      {popover && (
        <div
          className="shift-popover fixed z-50 w-[310px] rounded-xl border border-slate-200 dark:border-slate-700 bg-popover/98 backdrop-blur-xl p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 dark:ring-white/10"
          style={{
            top: `${popover.top}px`,
            left: `${popover.left}px`,
          }}
        >
          {/* Popover Header */}
          <div className="mb-2.5 flex items-center justify-between border-b border-border/60 pb-2">
            <div className="min-w-0">
              <span className="font-bold text-xs truncate block text-foreground leading-tight">
                {popover.empName}
              </span>
              <span className="text-[10px] text-muted-foreground block truncate">
                {t('shifts.popover.assignShift')}
              </span>
            </div>
            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10.5px] font-semibold text-slate-700 dark:text-slate-300">
              {locale === 'km' ? DAYS_ABBR_KM[popover.dayIdx] : DAYS_ABBR_EN[popover.dayIdx]}, {weekDates[popover.dayIdx].getDate()} {locale === 'km' ? MONTHS_KM[weekDates[popover.dayIdx].getMonth()] : MONTHS_EN[weekDates[popover.dayIdx].getMonth()]}
            </span>
          </div>

          {/* Clean Shift Options (Using colored indicator dots instead of cartoon icons) */}
          <div className="space-y-1">
            {[
              {
                key: 'Morning',
                title: t('shifts.shifts.morning'),
                time: t('shifts.shifts.morningTime'),
                dotCls: 'bg-teal-500',
                activeCls: 'border-teal-500/40 bg-teal-500/10 text-teal-950 dark:text-teal-100',
              },
              {
                key: 'Day',
                title: t('shifts.shifts.day'),
                time: t('shifts.shifts.dayTime'),
                dotCls: 'bg-sky-500',
                activeCls: 'border-sky-500/40 bg-sky-500/10 text-sky-950 dark:text-sky-100',
              },
              {
                key: 'Evening',
                title: t('shifts.shifts.evening'),
                time: t('shifts.shifts.eveningTime'),
                dotCls: 'bg-amber-500',
                activeCls: 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100',
              },
              {
                key: 'Night',
                title: t('shifts.shifts.night'),
                time: t('shifts.shifts.nightTime'),
                dotCls: 'bg-indigo-500',
                activeCls: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-950 dark:text-indigo-100',
              },
            ].map((opt) => {
              const isSelected = popover.currentKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    onQuickAssign?.(popover.empName, popover.dayIdx, opt.key);
                    setPopover(null);
                  }}
                  className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? opt.activeCls
                      : 'border-transparent hover:bg-muted text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${opt.dotCls}`} />
                    <span className="text-xs font-medium">{opt.title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {opt.time}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Actions (Off & Clear) */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 mt-2 border-t border-border/50">
            <button
              type="button"
              onClick={() => {
                onQuickAssign?.(popover.empName, popover.dayIdx, 'OFF');
                setPopover(null);
              }}
              className={`py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors ${
                popover.currentKey === 'OFF' ? 'ring-1 ring-[#1f786f]' : ''
              }`}
            >
              {t('shifts.shifts.off')}
            </button>
            <button
              type="button"
              onClick={() => {
                onQuickAssign?.(popover.empName, popover.dayIdx, null);
                setPopover(null);
              }}
              className="py-1.5 px-2 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/70 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors"
            >
              {t('shifts.shifts.clear')}
            </button>
          </div>

          {/* Footer */}
          <div className="pt-2 mt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                onSelectShift({
                  name: popover.empName,
                  dayIndex: popover.dayIdx,
                  key: popover.currentKey,
                });
                setPopover(null);
              }}
              className="text-muted-foreground hover:text-foreground font-medium hover:underline"
            >
              {t('shifts.board.advancedEdit')}
            </button>
            <button
              type="button"
              onClick={() => setPopover(null)}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
