import { useMemo } from 'react';
import { toast, type ToastParam, normalizeToastOptions } from '../utils/toast';
import type { ToastOptions } from '../stores/toastStore';

export type { ToastParam };
export { normalizeToastOptions };

export function useToast() {
  return useMemo(
    () => ({
      success: (param: ToastParam, durationOrOptions?: any) => toast.success(param, durationOrOptions),
      error: (param: ToastParam, durationOrOptions?: any) => toast.error(param, durationOrOptions),
      warning: (param: ToastParam, durationOrOptions?: any) => toast.warning(param, durationOrOptions),
      info: (param: ToastParam, durationOrOptions?: any) => toast.info(param, durationOrOptions),
      custom: (options: ToastOptions | any) => toast.custom(options),
      remove: (id: string) => toast.dismiss(id),
      dismiss: (id?: string) => toast.dismiss(id),
      clear: () => toast.clear(),
    }),
    []
  );
}

export default useToast;
