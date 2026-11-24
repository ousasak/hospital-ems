import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslation } from '@/i18n';

interface AttendanceDateNavigatorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const KHMER_MONTHS = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

function getIsoDate(val: string): string {
  if (!val) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }
  const tokens = val.split(/\s+/);
  if (tokens.length >= 3) {
    const d = parseInt(tokens[0], 10);
    const monthName = tokens[1];
    const y = parseInt(tokens[2], 10);
    const mIndex = KHMER_MONTHS.indexOf(monthName);
    if (!isNaN(d) && !isNaN(y) && mIndex !== -1) {
      return `${y}-${String(mIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return '2026-11-13';
}

function formatKhmerDisplayDate(val: string): string {
  if (!val) {
    const today = new Date();
    return `${today.getDate()} ${KHMER_MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  }
  if (val.includes('វិច្ឆិកា') || val.includes('មករា') || val.includes('កុម្ភៈ') || val.includes('មីនា')) {
    return val;
  }
  const parts = val.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12) {
      return `${d} ${KHMER_MONTHS[m - 1]} ${y}`;
    }
  }
  return val;
}

export const AttendanceDateNavigator: React.FC<AttendanceDateNavigatorProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const iso = useMemo(() => getIsoDate(selectedDate), [selectedDate]);
  const parsedDate = useMemo(() => new Date(iso), [iso]);

  // Today ISO
  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const isToday = iso === todayIso;

  // View state for month/year calendar
  const [viewYear, setViewYear] = useState(() => parsedDate.getFullYear() || 2026);
  const [viewMonth, setViewMonth] = useState(() => parsedDate.getMonth() || 10); // 0-indexed

  // Synchronize view month/year when popover opens or selectedDate changes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  };

  const handlePrevDay = () => {
    const d = new Date(iso);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(iso);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
  };

  const handleToday = () => {
    onDateChange(todayIso);
    setOpen(false);
  };

  const handleYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
    setOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build calendar matrix
  const { blanks, days } = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

    const blankArr = Array.from({ length: firstDayIndex });
    const dayArr = Array.from({ length: totalDays }, (_, i) => i + 1);

    return { blanks: blankArr, days: dayArr };
  }, [viewYear, viewMonth]);

  const handleSelectDay = (day: number) => {
    const y = viewYear;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onDateChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  return (
    <div className="flex items-center rounded-xl border border-border bg-card shadow-2xs overflow-hidden h-9">
      {/* 1. Prev Day Button */}
      <button
        type="button"
        onClick={handlePrevDay}
        title={t('common.prevDay', 'ថយក្រោយ ១ ថ្ងៃ')}
        className="h-full w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* 2. Popover Trigger Button */}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-full px-2.5 sm:px-3 border-x border-border flex items-center gap-2 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors select-none cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-none">
              {formatKhmerDisplayDate(selectedDate)}
            </span>
            {isToday ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 leading-none">
                ថ្ងៃនេះ
              </span>
            ) : null}
          </button>
        </PopoverTrigger>

        {/* 3. Popover Calendar Content */}
        <PopoverContent
          className="w-[280px] p-3 rounded-2xl border-border bg-card text-foreground shadow-xl"
          align="end"
          sideOffset={6}
        >
          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 pb-2.5 mb-2.5 border-b border-border text-xs">
            <button
              type="button"
              onClick={handleToday}
              className={`flex-1 py-1 px-2 rounded-lg font-semibold text-center transition-all cursor-pointer ${
                isToday
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              ថ្ងៃនេះ
            </button>
            <button
              type="button"
              onClick={handleYesterday}
              className="flex-1 py-1 px-2 rounded-lg font-semibold text-center bg-muted hover:bg-muted/80 text-foreground transition-all cursor-pointer"
            >
              ម្សិលមិញ
            </button>
          </div>

          {/* Month/Year Header */}
          <div className="flex items-center justify-between px-1 pb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="ខែមុន"
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-foreground">
              {KHMER_MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              title="ខែបន្ទាប់"
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground mb-1 select-none">
            <span>អា</span>
            <span>ច</span>
            <span>អ</span>
            <span>ព</span>
            <span>ព្រ</span>
            <span>សុ</span>
            <span>ស</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {blanks.map((_, i) => (
              <div key={`blank-${i}`} className="h-7 w-7" />
            ))}
            {days.map((d) => {
              const currentIso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = currentIso === iso;
              const isCurrentDay = currentIso === todayIso;

              return (
                <button
                  key={`day-${d}`}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : isCurrentDay
                      ? 'border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-50/50'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* 4. Next Day Button */}
      <button
        type="button"
        onClick={handleNextDay}
        title={t('common.nextDay', 'ទៅមុខ ១ ថ្ងៃ')}
        className="h-full w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AttendanceDateNavigator;

