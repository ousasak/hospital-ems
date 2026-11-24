import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '@/utils';

const alertVariants = cva(
  'relative w-full rounded-2xl border p-4 text-sm [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground transition-all shadow-xs backdrop-blur-xs',
  {
    variants: {
      variant: {
        default:
          'bg-background text-foreground border-slate-200 dark:border-slate-800',
        success:
          'border-emerald-500/30 bg-emerald-50/70 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400',
        destructive:
          'border-rose-500/30 bg-rose-50/70 text-rose-950 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-100 [&>svg]:text-rose-600 dark:[&>svg]:text-rose-400',
        error:
          'border-rose-500/30 bg-rose-50/70 text-rose-950 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-100 [&>svg]:text-rose-600 dark:[&>svg]:text-rose-400',
        warning:
          'border-amber-500/30 bg-amber-50/70 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400',
        info:
          'border-indigo-500/30 bg-indigo-50/70 text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-100 [&>svg]:text-indigo-600 dark:[&>svg]:text-indigo-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const AlertIcon: React.FC<{ variant?: VariantProps<typeof alertVariants>['variant'] }> = ({
  variant,
}) => {
  switch (variant) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5" />;
    case 'destructive':
    case 'error':
      return <AlertCircle className="h-5 w-5" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5" />;
    case 'info':
      return <Info className="h-5 w-5" />;
    default:
      return <Info className="h-5 w-5" />;
  }
};

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & {
    showIcon?: boolean;
  }
>(({ className, variant, showIcon = true, children, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  >
    {showIcon && <AlertIcon variant={variant} />}
    {children}
  </div>
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-semibold leading-none tracking-tight text-sm', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-xs sm:text-sm [&_p]:leading-relaxed opacity-90', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
export default Alert;

