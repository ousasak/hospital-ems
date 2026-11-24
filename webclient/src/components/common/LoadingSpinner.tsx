import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  fullPage?: boolean;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullPage = false,
  label = 'Loading...',
}) => {
  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Loader2 className="size-4 text-primary animate-spin" />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
};

export default LoadingSpinner;

