import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import { attendanceService } from '@/services/attendanceService';
import { organizationService } from '@/services/organizationService';

import { type ColumnOption } from '@/components/common/ColumnSettingsPopover';
import {
  AttendanceRecordItem,
  AttendanceFilterState,
  AttendanceSnapshotItem,
  AttendanceStatus,
} from './types';
import {
  DEPARTMENTS,
  HOSPITAL_SHIFTS,
} from './mockData';
import { AttendanceHeader } from './components/AttendanceHeader';
import { AttendanceSnapshot } from './components/AttendanceSnapshot';
import { AttendanceFilters } from './components/AttendanceFilters';
import { AttendanceTable } from './components/AttendanceTable';
import { AttendancePagination } from './components/AttendancePagination';
import { AttendanceDetailDrawer } from './components/AttendanceDetailDrawer';
import { AdminAttendanceEntryModal } from './components/AdminAttendanceEntryModal';

export const AttendancePage: React.FC = () => {
  const { t } = useTranslation();

  // 1. Date state: Default to today (e.g. '2026-11-13')
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const isoSelectedDate = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) return selectedDate;
    const tokens = selectedDate.split(/\s+/);
    if (tokens.length >= 3) {
      const khmerMonths = [
        'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
        'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
      ];
      const d = parseInt(tokens[0], 10);
      const mIdx = khmerMonths.indexOf(tokens[1]);
      const y = parseInt(tokens[2], 10);
      if (!isNaN(d) && !isNaN(y) && mIdx !== -1) {
        return `${y}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
    return selectedDate || '2026-11-13';
  }, [selectedDate]);

  // 2. Fetch attendance records from backend for selectedDate
  const { data: attendanceResponse, isLoading } = useQuery({
    queryKey: ['attendance-records', isoSelectedDate],
    queryFn: () => attendanceService.getRecords({ date: isoSelectedDate, per_page: 50 }),
    staleTime: 10000,
  });

  // 3. Base dataset: fetched directly from backend API (source of truth)
  const baseRecords: AttendanceRecordItem[] = useMemo(() => {
    if (!attendanceResponse) return [];
    if (Array.isArray(attendanceResponse)) {
      return attendanceResponse;
    }
    if (Array.isArray((attendanceResponse as any)?.data)) {
      return (attendanceResponse as any).data;
    }
    return [];
  }, [attendanceResponse]);

  // 4. State for filters
  const [filters, setFilters] = useState<AttendanceFilterState>({
    search: '',
    country: '',
    region: '',
    office: '',
    department: '',
    shift: '',
    status: '',
  });

  // 3. State for sorting & pagination
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // 4. Modal & Drawer States
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAdminEntryModalOpen, setIsAdminEntryModalOpen] = useState(false);

  // 5. Active Essential Columns (6 essential columns)
  const DEFAULT_ATTENDANCE_COLUMNS = useMemo(
    () => ({
      name: true,
      department: true,
      check_in: true,
      check_out: true,
      working_hours: true,
      status: true,
    }),
    []
  );

  const columns: ColumnOption[] = useMemo(
    () => [
      { key: 'name', label: t('employees.colEmployee', 'បុគ្គលិក'), required: true },
      { key: 'department', label: t('attendance.deptAndShift', 'ផ្នែក & វេនការងារ') },
      { key: 'check_in', label: t('attendance.shortCheckIn', 'ស្កេនចូល') },
      { key: 'check_out', label: t('attendance.shortCheckOut', 'ស្កេនចេញ') },
      { key: 'working_hours', label: t('attendance.workingHours', 'ម៉ោងធ្វើការ') },
      { key: 'status', label: t('employees.status', 'ស្ថានភាព') },
    ],
    [t]
  );

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    DEFAULT_ATTENDANCE_COLUMNS
  );

  // Filter options derived from dataset
  const { data: deptList } = useQuery({
    queryKey: ['attendance-departments'],
    queryFn: () => organizationService.getDepartments(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: shiftList } = useQuery({
    queryKey: ['attendance-shifts-list'],
    queryFn: () => attendanceService.getShifts(),
    staleTime: 5 * 60 * 1000,
  });

  const departments = useMemo(() => {
    if (deptList && Array.isArray(deptList) && deptList.length > 0) {
      return deptList.map((d: any) => d.name).sort();
    }
    return DEPARTMENTS.slice().sort();
  }, [deptList]);

  const shifts = useMemo(() => {
    if (shiftList && Array.isArray(shiftList) && shiftList.length > 0) {
      return shiftList.map((s: any) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        start_time: s.start_time,
        end_time: s.end_time,
      }));
    }
    return HOSPITAL_SHIFTS;
  }, [shiftList]);

  const shiftNames = useMemo(() => {
    return shifts.map((s: any) => s.name || String(s));
  }, [shifts]);

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    let result = baseRecords.slice();

    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.id.toLowerCase().includes(term) ||
          (r.department && r.department.toLowerCase().includes(term)) ||
          (r.shift && r.shift.toLowerCase().includes(term)) ||
          (r.position && r.position.toLowerCase().includes(term))
      );
    }

    if (filters.department) {
      result = result.filter((r) => r.department === filters.department);
    }

    if (filters.shift) {
      result = result.filter((r) => r.shift === filters.shift);
    }

    if (filters.office) {
      result = result.filter((r) => r.office === filters.office);
    }

    if (filters.status) {
      result = result.filter(
        (r) => r.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (sortBy) {
      result.sort((a, b) => {
        const valA = String(a[sortBy as keyof AttendanceRecordItem] || '');
        const valB = String(b[sortBy as keyof AttendanceRecordItem] || '');
        const cmp = valA.localeCompare(valB);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [baseRecords, filters, sortBy, sortDir]);

  // Paginated Slice
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  // Compute 6 KPI Snapshot counters
  const snapshotItems = useMemo((): AttendanceSnapshotItem[] => {
    const counts: Record<AttendanceStatus, number> = {
      Present: 0,
      Absent: 0,
      Late: 0,
      'Half Day': 0,
      Remote: 0,
      'On Leave': 0,
    };

    baseRecords.forEach((r) => {
      if (counts[r.status] !== undefined) {
        counts[r.status] += 1;
      }
    });

    return [
      {
        label: 'Present',
        value: counts.Present,
        tone: 'success',
        icon: 'icon-check',
        sub: 'Checked in on schedule',
      },
      {
        label: 'Absent',
        value: counts.Absent,
        tone: 'danger',
        icon: 'icon-user-x',
        sub: 'Unexcused absence',
      },
      {
        label: 'Late',
        value: counts.Late,
        tone: 'warning',
        icon: 'icon-clock',
        sub: 'Late arrival recorded',
      },
      {
        label: 'Half Day',
        value: counts['Half Day'],
        tone: 'warning',
        icon: 'icon-clock-4',
        sub: 'Partial day recorded',
      },
      {
        label: 'Remote',
        value: counts.Remote,
        tone: 'success',
        icon: 'icon-house',
        sub: 'Approved WFH location',
      },
      {
        label: 'On Leave',
        value: counts['On Leave'],
        tone: 'neutral',
        icon: 'icon-plane',
        sub: 'Scheduled paid leave',
      },
    ];
  }, [baseRecords]);

  // Handlers
  const handleSort = (column: string) => {
    let sortColumn = column;
    if (column === 'office') sortColumn = 'office';
    if (sortBy === sortColumn) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(sortColumn);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleApplyFilters = (newFilters: AttendanceFilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      country: '',
      region: '',
      office: '',
      department: '',
      status: '',
    });
    setPage(1);
  };

  const handleSelectStatusCard = (status: AttendanceStatus | '') => {
    if (!status || filters.status.toLowerCase() === status.toLowerCase()) {
      setFilters((prev) => ({ ...prev, status: '' }));
    } else {
      setFilters((prev) => ({ ...prev, status }));
      setPage(1);
    }
  };

  const handleExportCsv = async () => {
    try {
      await attendanceService.exportExcel(isoSelectedDate);
      toast.success(t('employees.exportSuccess', 'បាននាំចេញទិន្នន័យ Excel ដោយជោគជ័យ'));
    } catch (error) {
      console.error('Export error:', error);
      // Fallback client-side CSV with UTF-8 BOM for Khmer Unicode support
      const headers = [
        'អត្តលេខ (ID)',
        'ឈ្មោះបុគ្គលិក',
        'ដេប៉ាតឺម៉ង់ / ផ្នែក',
        'កាលបរិច្ឆេទ',
        'ស្កេនចូល',
        'ស្កេនចេញ',
        'ម៉ោងធ្វើការ',
        'ម៉ោងបន្ថែម',
        'ស្ថានភាព',
        'ការលើកលែង',
      ];

      const rows = filteredRecords.map((r) => [
        r.id,
        `"${r.name}"`,
        `"${r.department}"`,
        `"${r.dateLabel}"`,
        r.checkIn,
        r.checkOut,
        r.workingHours,
        r.overtime,
        r.status,
        r.exception,
      ]);

      const bom = '\uFEFF';
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        encodeURIComponent(bom + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n'));

      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute(
        'download',
        `StaffStream_Attendance_${isoSelectedDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t('employees.exportSuccess', 'បាននាំចេញទិន្នន័យដោយជោគជ័យ'));
    }
  };

  return (
    <div className="space-y-5 print:p-0">
      {/* ─── 1. Header & Actions (Cloned exactly from EmployeeDirectoryPage) ─── */}
      <AttendanceHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onExport={handleExportCsv}
        totalRecords={filteredRecords.length}
        onOpenAdminEntry={() => setIsAdminEntryModalOpen(true)}
      />

      {/* ─── 2. 4 Flatten Metric KPI Cards (KHPosCommerce signature look) ─── */}
      <AttendanceSnapshot
        items={snapshotItems}
        activeStatusFilter={filters.status}
        onSelectStatus={handleSelectStatusCard}
      />

      {/* ─── 3. Unified Search Bar & Filter Toolbar ─── */}
      <AttendanceFilters
        filters={filters}
        departments={departments}
        shifts={shiftNames}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        columns={columns}
        visibleColumns={visibleColumns}
        defaultVisibleColumns={DEFAULT_ATTENDANCE_COLUMNS}
        onColumnChange={setVisibleColumns}
      />

      {/* ─── 4. Attendance Table Presentation & Pagination ─── */}
      <div className="space-y-4">
        <AttendanceTable
          records={paginatedRecords}
          isLoading={isLoading}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onView={(rec) => {
            setSelectedRecord(rec);
            setIsDetailDrawerOpen(true);
          }}
          visibleColumns={visibleColumns}
        />

        {/* 5. Pagination */}
        {filteredRecords.length > 0 && (
          <AttendancePagination
            currentPage={page}
            pageSize={pageSize}
            totalRecords={filteredRecords.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* ─── 6. Slide-Out 360 Attendance Detail Drawer ─── */}
      <AttendanceDetailDrawer
        isOpen={isDetailDrawerOpen}
        record={selectedRecord}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedRecord(null);
        }}
        onAuditVerify={(rec) => {
          toast.success(
            t('attendance.verifiedSuccess', `បានផ្ទៀងផ្ទាត់វត្តមានសម្រាប់ ${rec.name}`)
          );
          setIsDetailDrawerOpen(false);
        }}
      />

      {/* ─── 7. Admin / Manual Attendance Entry Modal ─── */}
      <AdminAttendanceEntryModal
        isOpen={isAdminEntryModalOpen}
        onClose={() => setIsAdminEntryModalOpen(false)}
        defaultDate={isoSelectedDate}
      />
    </div>
  );
};

export default AttendancePage;
