import React from 'react';
import { PlusCircle, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import { cn } from '@/utils';

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface DataTableFacetedFilterProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelect: (value: string) => void;
  onClear?: () => void;
}

export const DataTableFacetedFilter: React.FC<DataTableFacetedFilterProps> = ({
  title,
  options,
  selectedValues,
  onSelect,
  onClear,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed text-xs">
          <PlusCircle className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          {title}
          {selectedValues.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1.5 font-normal text-[11px]"
                  >
                    {selectedValues.length} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.includes(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1.5 font-normal text-[11px]"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1.5" align="start">
        <div className="space-y-1">
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className={cn(
                  'flex w-full items-center rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground',
                  isSelected && 'bg-accent/60 font-medium'
                )}
              >
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary/60',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible'
                  )}
                >
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                {option.icon && (
                  <option.icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="flex-1 text-left">{option.label}</span>
                {option.count !== undefined && (
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {option.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selectedValues.length > 0 && onClear && (
          <>
            <Separator className="my-1.5" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="w-full justify-center text-xs h-7 font-normal"
            >
              Clear filters
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

