import React from 'react';

interface MorphingSquareProps {
  className?: string;
  message?: string;
  messagePlacement?: 'top' | 'bottom';
}

export const MorphingSquare: React.FC<MorphingSquareProps> = ({
  className = 'w-12 h-12 bg-sky-600 shadow-xl shadow-sky-500/30',
  message,
  messagePlacement = 'bottom',
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {message && messagePlacement === 'top' && (
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 animate-pulse text-center">
          {message}
        </p>
      )}
      <div className="relative flex items-center justify-center">
        <div className="absolute -inset-2 rounded-2xl bg-sky-500/20 blur-lg animate-pulse" />
        <div
          className={`relative rounded-xl animate-morph-spin transition-all ${className}`}
        />
      </div>
      {message && messagePlacement === 'bottom' && (
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 animate-pulse text-center">
          {message}
        </p>
      )}
    </div>
  );
};

export default MorphingSquare;

