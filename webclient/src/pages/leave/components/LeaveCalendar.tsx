import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Landmark,
  Users,
} from "lucide-react";
import { LeaveRequestItem, RegionalHoliday } from "../types";
import {
  generateMonthGrid,
  getRequestsOnDay,
} from "../utils/leaveCalculations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

interface LeaveCalendarProps {
  currentDate: { year: number; month: number };
  onNavigateMonth: (offset: number) => void;
  requests: LeaveRequestItem[];
  holidays?: RegionalHoliday[];
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
}

const khmerMonths = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

const khmerDaysOfWeek = [
  { name: "អាទិត្យ", isWeekend: true },
  { name: "ចន្ទ", isWeekend: false },
  { name: "អង្គារ", isWeekend: false },
  { name: "ពុធ", isWeekend: false },
  { name: "ព្រហស្បតិ៍", isWeekend: false },
  { name: "សុក្រ", isWeekend: false },
  { name: "សៅរ៍", isWeekend: true },
];

/**
 * Official Statutory Public Holidays in Cambodia
 */
const getCambodianHoliday = (month: number, day: number): string | null => {
  // month is 0-indexed (0 = Jan, 8 = Sep, 9 = Oct, 10 = Nov, 11 = Dec)
  switch (month) {
    case 0: // Jan
      if (day === 1) return "ទិវាចូលឆ្នាំសកល";
      if (day === 7) return "ទិវាជ័យជម្នះ ៧ មករា";
      return null;
    case 2: // Mar
      if (day === 8) return "ទិវានារីអន្តរជាតិ";
      return null;
    case 3: // Apr
      if (day >= 13 && day <= 16) return "ពិធីបុណ្យចូលឆ្នាំថ្មី";
      return null;
    case 4: // May
      if (day === 1) return "ទិវាពលកម្មអន្តរជាតិ";
      if (day === 14) return "ព្រះរាជពិធីចម្រើនព្រះជន្ម ព្រះមហាក្សត្រ";
      return null;
    case 5: // Jun
      if (day === 18) return "ព្រះរាជពិធីចម្រើនព្រះជន្ម សម្តេចម៉ែ";
      return null;
    case 8: // Sep
      if (day === 24) return "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ";
      return null;
    case 9: // Oct
      if (day >= 11 && day <= 13) return "ពិធីបុណ្យភ្ជុំបិណ្ឌ";
      if (day === 15) return "ទិវារំលឹកព្រះបរមរតនកោដ្ឋ";
      if (day === 29) return "ព្រះរាជពិធីគ្រងរាជ្យសម្បត្តិ";
      return null;
    case 10: // Nov
      if (day === 9) return "ពិធីបុណ្យឯករាជ្យជាតិ";
      if (day >= 24 && day <= 26) return "ព្រះរាជពិធីបុណ្យអុំទូក";
      return null;
    case 11: // Dec
      if (day === 29) return "ទិវាសន្តិភាពនៅកម្ពុជា";
      return null;
    default:
      return null;
  }
};

const getLeaveTypeStyle = (type: string) => {
  switch (type) {
    case "Annual Leave":
      return {
        bar: "border-l-teal-600 bg-teal-50/90 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 dark:border-l-teal-400",
        label: "ច្បាប់ប្រចាំឆ្នាំ",
      };
    case "Sick Leave":
      return {
        bar: "border-l-amber-500 bg-amber-50/90 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:border-l-amber-400",
        label: "ច្បាប់ឈឺ",
      };
    case "Personal Leave":
      return {
        bar: "border-l-indigo-500 bg-indigo-50/90 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-l-indigo-400",
        label: "ច្បាប់ផ្ទាល់ខ្លួន",
      };
    case "Unpaid Leave":
    default:
      return {
        bar: "border-l-slate-400 bg-slate-100/90 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-l-slate-500",
        label: "គ្មានប្រាក់ឈ្នួល",
      };
  }
};

export const LeaveCalendar: React.FC<LeaveCalendarProps> = ({
  currentDate,
  onNavigateMonth,
  requests,
  holidays = [],
  selectedDay,
  onSelectDay,
}) => {
  const { year, month } = currentDate;
  const monthKhmer = khmerMonths[month] || "";
  const gridCells = generateMonthGrid(year, month);

  // Selected day details
  const selectedEntries =
    selectedDay !== null
      ? getRequestsOnDay(requests, year, month, selectedDay)
      : [];

  const selectedHoliday =
    selectedDay !== null ? getCambodianHoliday(month, selectedDay) : null;

  // Reset to today
  const handleToday = () => {
    const now = new Date();
    const diffMonth =
      (now.getFullYear() - year) * 12 + (now.getMonth() - month);
    if (diffMonth !== 0) {
      onNavigateMonth(diffMonth);
    }
    onSelectDay(now.getDate());
  };

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  return (
    <Card className="min-w-0 shadow-2xs border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
      {/* Calendar Header with Navigation */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            កាលវិភាគច្បាប់ & វត្តមានបុគ្គលិក
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            តាមដានវត្តមានការងារ កម្លាំងពលកម្មប្រចាំថ្ងៃ និងថ្ងៃឈប់សម្រាកបុណ្យជាតិផ្លូវការ
          </CardDescription>

          {/* Clean Legend */}
          <div className="flex flex-wrap items-center gap-3.5 text-xs text-muted-foreground pt-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                បុណ្យជាតិ
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              <span>ច្បាប់ប្រចាំឆ្នាំ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>ច្បាប់ឈឺ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>ច្បាប់ផ្ទាល់ខ្លួន</span>
            </div>
          </div>
        </div>

        {/* Month Toolbar */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToday}
            className={`h-8 px-3 text-xs font-medium rounded-lg transition-colors border shadow-2xs ${
              isCurrentMonth
                ? "bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            ថ្ងៃនេះ
          </Button>

          <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onNavigateMonth(-1)}
              className="h-8 w-8 rounded-l-lg rounded-r-none text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="ខែមុន"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

            <span className="min-w-[124px] text-center text-xs font-semibold text-slate-800 dark:text-slate-100 px-3 select-none tracking-tight">
              ខែ{monthKhmer} {year}
            </span>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onNavigateMonth(1)}
              className="h-8 w-8 rounded-r-lg rounded-l-none text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="ខែបន្ទាប់"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Calendar Grid (Full Width) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-200/60 dark:bg-slate-800/80">
          {/* Days of Week Header */}
          <div className="grid min-w-[680px] grid-cols-7 gap-px text-center text-xs bg-slate-200/60 dark:bg-slate-800">
            {khmerDaysOfWeek.map((d) => (
              <div
                key={d.name}
                className={`py-3 bg-slate-50 dark:bg-slate-900/90 ${
                  d.isWeekend
                    ? "text-rose-500 dark:text-rose-400 font-semibold"
                    : "text-slate-600 dark:text-slate-300 font-medium"
                }`}
              >
                {d.name}
              </div>
            ))}
          </div>

          {/* Days Cells */}
          <div className="grid min-w-[680px] grid-cols-7 gap-px bg-slate-200/60 dark:bg-slate-800">
            {gridCells.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={`blank-${idx}`}
                    className="min-h-[96px] bg-slate-50/40 dark:bg-slate-950/30"
                  />
                );
              }

              const dayRequests = getRequestsOnDay(requests, year, month, day);
              const holiday = getCambodianHoliday(month, day);
              const isSelected = selectedDay === day;
              const isToday = isCurrentMonth && day === todayDate;
              const isSunday = idx % 7 === 0;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  className={`flex min-h-[96px] flex-col gap-1.5 p-2 text-left transition-colors cursor-pointer select-none ${
                    isSelected
                      ? "bg-teal-50/90 dark:bg-teal-950/50 ring-2 ring-teal-600 ring-inset"
                      : holiday
                        ? "bg-rose-50/30 dark:bg-rose-950/15 hover:bg-rose-50/60 dark:hover:bg-rose-950/30"
                        : isToday
                          ? "bg-teal-50/30 dark:bg-teal-950/20 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                          : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                  onClick={() => onSelectDay(isSelected ? null : day)}
                >
                  {/* Top Bar: Date Number + Holiday tag or count */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono ${
                        isToday
                          ? "h-5 w-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[11px]"
                          : isSunday
                            ? "text-rose-500 dark:text-rose-400 font-semibold"
                            : "text-slate-800 dark:text-slate-200 font-medium"
                      }`}
                    >
                      {day}
                    </span>

                    {dayRequests.length > 0 && !isToday && (
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {dayRequests.length} នាក់
                      </span>
                    )}
                  </div>

                  {/* Cambodian Holiday Banner (Integrated directly into the cell) */}
                  {holiday && (
                    <div
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 truncate flex items-center shadow-2xs"
                      title={`បុណ្យជាតិ៖ ${holiday}`}
                    >
                      <span className="truncate">{holiday}</span>
                    </div>
                  )}

                  {/* Employee Leave Event Bars */}
                  <div className="space-y-1 w-full">
                    {dayRequests.slice(0, holiday ? 2 : 3).map((req) => {
                      const style = getLeaveTypeStyle(req.type);
                      return (
                        <div
                          key={req.id}
                          className={`truncate rounded border-l-2 px-1.5 py-0.5 text-[10px] font-medium leading-tight shadow-2xs ${style.bar}`}
                          title={`${req.employee} — ${style.label} (${req.office})`}
                        >
                          <span className="font-semibold">
                            {req.employee.split(" ")[0]}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            {req.isHalfDay ? "(កន្លះថ្ងៃ)" : `• ${style.label}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Overflow Indicator */}
                  {dayRequests.length > (holiday ? 2 : 3) && (
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-600 pl-0.5 mt-auto">
                      +{dayRequests.length - (holiday ? 2 : 3)} នាក់ទៀត
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail Panel */}
        {selectedDay !== null && (
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 p-4 text-xs animate-in fade-in shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  កាលវិភាគថ្ងៃទី{" "}
                  <span className="font-mono text-teal-700 dark:text-teal-300">
                    {selectedDay}
                  </span>{" "}
                  ខែ
                  {monthKhmer} ឆ្នាំ{year}
                </span>
                {selectedHoliday && (
                  <Badge
                    variant="destructive"
                    className="gap-1 text-[11px] px-2 py-0.5"
                  >
                    {selectedHoliday}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectDay(null)}
                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {selectedHoliday && (
              <div className="p-2.5 my-2.5 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 flex items-center gap-2 text-xs">
                <Landmark className="h-4 w-4 text-rose-600 shrink-0" />
                <span>
                  <strong>ថ្ងៃឈប់សម្រាកបុណ្យជាតិផ្លូវការ៖</strong>{" "}
                  និយោជិតទទួលបានការឈប់សម្រាកដោយមានប្រាក់បៀវត្សរ៍ពេញលេញ
                  តាមអនុក្រឹត្យរាជរដ្ឋាភិបាលកម្ពុជា។
                </span>
              </div>
            )}

            {selectedEntries.length === 0 ? (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 pt-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  គ្មានបុគ្គលិកសុំច្បាប់នៅថ្ងៃនេះឡើយ។{" "}
                  <strong>កម្លាំងពលកម្មប្រចាំការពេញលេញ ១០០%</strong>។
                </span>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <p className="text-muted-foreground text-xs">
                  បុគ្គលិកសុំច្បាប់ឈប់សម្រាក (សរុប {selectedEntries.length}{" "}
                  នាក់) ៖
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {selectedEntries.map((e) => {
                    const style = getLeaveTypeStyle(e.type);
                    return (
                      <div
                        key={e.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {e.employee}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {e.office}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border-l-2 ${style.bar} shrink-0`}
                        >
                          {style.label} {e.isHalfDay ? "(កន្លះថ្ងៃ)" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
