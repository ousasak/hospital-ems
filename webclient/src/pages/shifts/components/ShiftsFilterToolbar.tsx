import React from 'react';
import { ShiftFilterState } from '../types';
import { ALL_OFFICES, ALL_DEPARTMENTS } from '../mockData';
import { UnifiedFilterToolbar, FilterSelectConfig } from '@/components/common/UnifiedFilterToolbar';
import { useLocaleStore } from '@/stores/localeStore';

interface ShiftsFilterToolbarProps {
  filters: ShiftFilterState;
  onFilterChange: (updates: Partial<ShiftFilterState>) => void;
  onReset: () => void;
  onDateJump: (dateStr: string) => void;
  totalEmployees: number;
  filteredEmployeesCount: number;
}

export const ShiftsFilterToolbar: React.FC<ShiftsFilterToolbarProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const { t } = useLocaleStore();

  const filterConfigs: FilterSelectConfig[] = [
    {
      id: 'office',
      value: filters.office || '',
      onChange: (val) => onFilterChange({ office: val }),
      options: [
        { value: '', label: t('filters.allOffices') },
        ...ALL_OFFICES.map((off) => ({ value: off, label: off })),
      ],
      minWidth: 'min-w-[150px]',
    },
    {
      id: 'department',
      value: filters.department || '',
      onChange: (val) => onFilterChange({ department: val }),
      options: [
        { value: '', label: t('filters.allDepartments') },
        ...ALL_DEPARTMENTS.map((dept) => ({ value: dept, label: dept })),
      ],
      minWidth: 'min-w-[155px]',
    },
    {
      id: 'status',
      value: filters.status || '',
      onChange: (val) => onFilterChange({ status: val }),
      options: [
        { value: '', label: t('filters.allStatus', 'ស្ថានភាពទាំងអស់') },
        { value: 'Scheduled', label: 'មានវេនធ្វើការ (Scheduled)' },
        { value: 'Unassigned', label: 'មិនទាន់ចាត់តាំង (Unassigned)' },
        { value: 'Off', label: 'សម្រាក (Off Duty)' },
      ],
      minWidth: 'min-w-[160px]',
    },
  ];

  return (
    <div className="mb-6">
      <UnifiedFilterToolbar
        search={filters.search}
        onSearchChange={(search) => onFilterChange({ search })}
        searchPlaceholder={t('shifts.searchPlaceholder')}
        filters={filterConfigs}
        onReset={onReset}
      />
    </div>
  );
};

export default ShiftsFilterToolbar;
