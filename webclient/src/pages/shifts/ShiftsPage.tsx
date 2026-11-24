import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  ShiftFilterState,
  ActiveShiftDetail,
  ShiftConflict,
  WeeklyScheduleMap,
} from './types';
import { shiftService } from '@/services/shiftService';
import { getStartOfWeek } from './utils/shiftCalculations';
import { ShiftsHeader } from './components/ShiftsHeader';
import { ShiftsSummaryKPI } from './components/ShiftsSummaryKPI';
import { ShiftsFilterToolbar } from './components/ShiftsFilterToolbar';
import { WeeklySchedulingBoard } from './components/WeeklySchedulingBoard';
import { AddShiftModal } from './components/AddShiftModal';
import { ShiftDetailModal } from './components/ShiftDetailModal';

const STORAGE_ACTIVE_WEEK = 'staffstream_shifts_active_week';

export const ShiftsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. Auto default to today's week or load remembered week from localStorage
  const [weekStart, setWeekStart] = useState<Date>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_WEEK);
      if (saved) {
        const parsed = new Date(saved);
        if (!isNaN(parsed.getTime())) {
          return getStartOfWeek(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return getStartOfWeek(new Date());
  });

  // Remember active week across reloads
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_WEEK, weekStart.toISOString());
    } catch (e) {
      // ignore
    }
  }, [weekStart]);

  // 2. Filter State
  const initialFilters: ShiftFilterState = {
    search: '',
    office: '',
    department: '',
    status: '',
  };
  const [filters, setFilters] = useState<ShiftFilterState>(initialFilters);

  // 3. Conflicts State
  const [conflicts, setConflicts] = useState<ShiftConflict[]>(() =>
    shiftService.getInitialConflicts()
  );

  // 4. Modals State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<ActiveShiftDetail | null>(null);
  const [scheduleVersion, setScheduleVersion] = useState(0);

  // 5. Query Employees & Schedule
  const { data: employees = [] } = useQuery({
    queryKey: ['shifts-employees'],
    queryFn: () => shiftService.getEmployees(),
    staleTime: 5 * 60 * 1000,
  });

  // Schedule for current week
  const schedule: WeeklyScheduleMap = useMemo(() => {
    // scheduleVersion forces re-evaluation when shifts are updated
    if (scheduleVersion < 0) return {};
    return shiftService.getWeeklyRoster(weekStart, employees);
  }, [weekStart, scheduleVersion, employees]);

  // 6. Dynamic KPI Metrics
  const kpiStats = useMemo(() => {
    return shiftService.computeKPIStats(
      schedule,
      weekStart,
      conflicts.length,
      employees
    );
  }, [schedule, weekStart, conflicts.length, employees]);

  // 7. Filtering Logic
  const filteredEmployees = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return employees.filter((emp) => {
      // Office match
      if (filters.office && emp.office !== filters.office) {
        return false;
      }
      // Department match
      if (filters.department && emp.department !== filters.department) {
        return false;
      }
      // Search match
      if (term) {
        const matchesName = emp.name.toLowerCase().includes(term);
        const matchesDept = emp.department.toLowerCase().includes(term);
        const matchesOffice = emp.office.toLowerCase().includes(term);
        if (!matchesName && !matchesDept && !matchesOffice) {
          return false;
        }
      }
      // Status match
      if (filters.status) {
        const empDays = schedule[emp.name] ?? [];
        if (
          filters.status === 'Scheduled' &&
          !empDays.some((k) => k && k !== 'OFF')
        ) {
          return false;
        }
        if (filters.status === 'Unassigned' && !empDays.some((k) => !k)) {
          return false;
        }
        if (filters.status === 'Off' && !empDays.some((k) => k === 'OFF')) {
          return false;
        }
      }

      return true;
    });
  }, [employees, filters, schedule]);

  // 8. Navigation Handlers
  const handlePrevWeek = () => {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleToday = () => {
    setWeekStart(getStartOfWeek(new Date()));
  };

  const handleDateJump = (dateStr: string) => {
    const picked = new Date(dateStr);
    if (!isNaN(picked.getTime())) {
      setWeekStart(getStartOfWeek(picked));
    }
  };

  const handleResetFilters = () => {
    try {
      localStorage.removeItem(STORAGE_ACTIVE_WEEK);
    } catch (e) {
      // ignore
    }
    setFilters(initialFilters);
    setWeekStart(getStartOfWeek(new Date()));
    queryClient.invalidateQueries({ queryKey: ['shifts-employees'] });
    setScheduleVersion((v) => v + 1);
  };

  // 9. Shift Actions (Add, Update, Clear, Quick Assign, Copy, Batch)
  const handleQuickAssign = (
    employeeName: string,
    dayIndex: number,
    shiftKey: string | null
  ) => {
    shiftService.assignShift(weekStart, employeeName, dayIndex, shiftKey);
    setScheduleVersion((v) => v + 1);

    const shiftLabels: Record<string, string> = {
      Morning: '«វេនព្រឹក (07:00-15:00)»',
      Day: '«វេនថ្ងៃ/រដ្ឋបាល (08:00-17:00)»',
      Evening: '«វេនរសៀល (14:00-21:00)»',
      Night: '«វេនយប់ប្រចាំការ (20:00-08:00)»',
      OFF: '«សម្រាក (Off Duty)»',
    };

    if (shiftKey && shiftLabels[shiftKey]) {
      toast.success(`បានចាត់តាំង ${shiftLabels[shiftKey]} ជូន ${employeeName}`);
    } else if (shiftKey) {
      toast.success(`បានចាត់តាំង «${shiftKey}» ជូន ${employeeName}`);
    } else {
      toast.info(`បានសម្អាតវេនសម្រាប់ ${employeeName}`);
    }
  };

  const handleCopyLastWeek = () => {
    const prevWeek = new Date(weekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    shiftService.copyWeek(prevWeek, weekStart);
    setScheduleVersion((v) => v + 1);
    toast.success('បានចម្លងកាលវិភាគពីសប្តាហ៍មុនដោយជោគជ័យ!');
  };

  const handleBatchAssign = (
    employeeName: string,
    pattern: 'office' | 'morning' | 'evening' | 'night' | 'clear'
  ) => {
    shiftService.batchAssignEmployee(weekStart, employeeName, pattern);
    setScheduleVersion((v) => v + 1);
    const patternLabels: Record<string, string> = {
      office: 'ម៉ោងរដ្ឋបាល (ច័ន្ទ-សុក្រ)',
      morning: 'វេនព្រឹក (ច័ន្ទ-សុក្រ)',
      evening: 'វេនរសៀល (ច័ន្ទ-សុក្រ)',
      night: 'វេនយប់ឆ្លាស់ (Rotation)',
      clear: 'សម្អាតវេនសប្តាហ៍នេះ',
    };
    toast.success(`បានកំណត់ ${patternLabels[pattern] || 'កាលវិភាគ'} ជូន ${employeeName}`);
  };

  const handleAddShift = (
    employeeName: string,
    shiftKey: string,
    dateStr: string
  ) => {
    let targetWeek = weekStart;
    let dayIndex = 1; // Default Monday

    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        dayIndex = d.getDay();
        targetWeek = getStartOfWeek(d);
        setWeekStart(targetWeek);
      }
    }

    shiftService.assignShift(targetWeek, employeeName, dayIndex, shiftKey);
    setScheduleVersion((v) => v + 1);
    toast.success(`Shift successfully assigned to ${employeeName}`);
  };

  const handleSaveShift = (newKey: string | null) => {
    if (!activeDetail) return;
    shiftService.assignShift(
      weekStart,
      activeDetail.name,
      activeDetail.dayIndex,
      newKey
    );
    setScheduleVersion((v) => v + 1);
    setActiveDetail(null);
    toast.success(`Updated shift for ${activeDetail.name}`);
  };

  const handleClearShift = () => {
    if (!activeDetail) return;
    shiftService.assignShift(
      weekStart,
      activeDetail.name,
      activeDetail.dayIndex,
      null
    );
    setScheduleVersion((v) => v + 1);
    setActiveDetail(null);
    toast.info(`Cleared shift for ${activeDetail.name}`);
  };

  // 10. Export Handler
  const handleExport = () => {
    toast.info('Generating shift roster export...');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <main className="p-4 sm:p-6 min-h-screen">
      {/* 1. Header with Breadcrumbs, Title, Multi-TZ badge & Actions */}
      <ShiftsHeader
        onOpenAddModal={() => setAddModalOpen(true)}
        onExport={handleExport}
      />

      {/* 2. 5-Card KPI Metric Overview */}
      <ShiftsSummaryKPI stats={kpiStats} />

      {/* 3. Inline Search & Multi-field Filter Toolbar */}
      <ShiftsFilterToolbar
        filters={filters}
        onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
        onReset={handleResetFilters}
        onDateJump={handleDateJump}
        totalEmployees={employees.length}
        filteredEmployeesCount={filteredEmployees.length}
      />

      {/* 4. Weekly Scheduling Board (Roster Table) */}
      <WeeklySchedulingBoard
        weekStart={weekStart}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        onDateJump={(date) => setWeekStart(getStartOfWeek(date))}
        onCopyLastWeek={handleCopyLastWeek}
        onQuickAssign={handleQuickAssign}
        onBatchAssign={handleBatchAssign}
        employees={filteredEmployees}
        schedule={schedule}
        onSelectShift={(detail) => setActiveDetail(detail)}
        onClearFilters={handleResetFilters}
      />

      {/* 5. Schedule New Shift Modal */}
      <AddShiftModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        employees={employees}
        onAddShift={handleAddShift}
      />

      {/* 8. Shift Details / Manage Shift Modal */}
      <ShiftDetailModal
        isOpen={!!activeDetail}
        onClose={() => setActiveDetail(null)}
        detail={activeDetail}
        employees={employees}
        weekStart={weekStart}
        onSaveShift={handleSaveShift}
        onClearShift={handleClearShift}
      />
    </main>
  );
};

export default ShiftsPage;

