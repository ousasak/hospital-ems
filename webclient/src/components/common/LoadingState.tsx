import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...', className }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-muted-foreground ${className}`}>
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="mt-3 text-sm">{message}</p>
    </div>
  );
};

