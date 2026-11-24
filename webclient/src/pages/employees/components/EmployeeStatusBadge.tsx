import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';

interface EmployeeStatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

export const EmployeeStatusBadge: React.FC<EmployeeStatusBadgeProps> = ({
  status,
  className,
  showDot = true,
}) => {
  const norm = (status || 'Active').toLowerCase();

  let variant: 'success' | 'warning' | 'destructive' | 'secondary' = 'success';
  let label = 'Active';
  let dotColor = 'bg-emerald-500';

  if (norm === 'probation') {
    variant = 'warning';
    label = 'Probation';
    dotColor = 'bg-amber-500';
  } else if (norm === 'inactive' || norm === 'terminated' || norm === 'resigned' || norm === 'suspended') {
    variant = 'destructive';
    label = 'Inactive';
    dotColor = 'bg-rose-500';
  }

  return (
    <Badge
      variant={variant}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium px-2.5 py-0.5 text-xs rounded-full shadow-none transition-colors select-none',
        className
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor)} />}
      <span>{label}</span>
    </Badge>
  );
};
