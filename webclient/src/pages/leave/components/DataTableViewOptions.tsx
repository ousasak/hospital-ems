import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

export interface ColumnVisibilityState {
  employee: boolean;
  location: boolean;
  leaveType: boolean;
  dates: boolean;
  duration: boolean;
  status: boolean;
  reason: boolean;
  actions: boolean;
}

interface DataTableViewOptionsProps {
  columns: ColumnVisibilityState;
  onChange: (columns: ColumnVisibilityState) => void;
}

export const DataTableViewOptions: React.FC<DataTableViewOptionsProps> = ({
  columns,
  onChange,
}) => {
  const toggleColumn = (key: keyof ColumnVisibilityState) => {
    onChange({
      ...columns,
      [key]: !columns[key],
    });
  };

  const labels: Record<keyof ColumnVisibilityState, string> = {
    employee: 'បុគ្គលិក',
    location: 'ទីតាំង / សាខា',
    leaveType: 'ប្រភេទច្បាប់',
    dates: 'កាលបរិច្ឆេទ',
    duration: 'រយៈពេល',
    status: 'ស្ថានភាព',
    reason: 'មូលហេតុ',
    actions: 'សកម្មភាព',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 gap-1.5 text-xs lg:flex border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>គ្រប់គ្រងតារាង</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-semibold text-foreground">
          ជ្រើសរើសជួរឈរបង្ហាញ
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(columns) as (keyof ColumnVisibilityState)[]).map((key) => {
          if (key === 'employee' || key === 'actions') return null; // Mandatory
          return (
            <DropdownMenuCheckboxItem
              key={key}
              className="text-xs"
              checked={columns[key]}
              onCheckedChange={() => toggleColumn(key)}
            >
              {labels[key]}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

