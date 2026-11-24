import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { cn } from '@/utils';

interface DataTableColumnHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (direction: 'asc' | 'desc' | null) => void;
  onHide?: () => void;
}

export const DataTableColumnHeader: React.FC<DataTableColumnHeaderProps> = ({
  title,
  sortDirection,
  onSort,
  onHide,
  className,
}) => {
  if (!onSort) {
    return <div className={cn('text-xs font-semibold text-muted-foreground', className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold data-[state=open]:bg-accent hover:text-foreground text-muted-foreground"
          >
            <span>{title}</span>
            {sortDirection === 'desc' ? (
              <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-primary" />
            ) : sortDirection === 'asc' ? (
              <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem onClick={() => onSort('asc')} className="text-xs">
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort('desc')} className="text-xs">
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Desc
          </DropdownMenuItem>
          {sortDirection && (
            <DropdownMenuItem onClick={() => onSort(null)} className="text-xs">
              <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              Reset sort
            </DropdownMenuItem>
          )}
          {onHide && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onHide} className="text-xs">
                <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Hide column
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

