import { toast as sonnerToast, type ExternalToast } from 'sonner';
import { useToastStore, type ToastOptions, type ToastType } from '../stores/toastStore';

export type ToastParam = string | (Omit<ToastOptions, 'type'> & { message: string });

export type ToastExtraOptions = number | (ExternalToast & { duration?: number; [key: string]: any });

export function normalizeToastOptions(
  param: ToastParam,
  type: ToastType,
  durationOrOptions?: ToastExtraOptions
): ToastOptions {
  const duration =
    typeof durationOrOptions === 'number'
      ? durationOrOptions
      : durationOrOptions && typeof durationOrOptions === 'object'
      ? durationOrOptions.duration
      : undefined;

  if (typeof param === 'string') {
    return {
      type,
      message: param,
      duration,
    };
  }

  return {
    ...param,
    type,
    title: param.title,
    message: param.message,
    description: param.description,
    duration: param.duration ?? duration,
  };
}

function parseToastInput(
  param: ToastParam,
  durationOrOptions?: ToastExtraOptions
): { message: string; options: ExternalToast & Record<string, any> } {
  let message = '';
  const options: ExternalToast & Record<string, any> = {};

  if (typeof durationOrOptions === 'number') {
    options.duration = durationOrOptions;
  } else if (durationOrOptions && typeof durationOrOptions === 'object') {
    Object.assign(options, durationOrOptions);
  }

  if (typeof param === 'string') {
    message = param;
  } else {
    message = param.message;
    if (param.description) {
      options.description = param.description;
    }
    if (param.duration && !options.duration) {
      options.duration = param.duration;
    }
    if (param.title) {
      options.title = param.title;
    }
    if (param.code) {
      options.code = param.code;
    }
    if (param.action) {
      options.action = param.action;
    }
  }

  return { message, options };
}

export const showToast = {
  success: (param: ToastParam, durationOrOptions?: ToastExtraOptions) => {
    const opts = normalizeToastOptions(param, 'success', durationOrOptions);
    return useToastStore.getState().addToast(opts);
  },
  error: (param: ToastParam, durationOrOptions?: ToastExtraOptions) => {
    const opts = normalizeToastOptions(param, 'error', durationOrOptions);
    return useToastStore.getState().addToast(opts);
  },
  warning: (param: ToastParam, durationOrOptions?: ToastExtraOptions) => {
    const opts = normalizeToastOptions(param, 'warning', durationOrOptions);
    return useToastStore.getState().addToast(opts);
  },
  info: (param: ToastParam, durationOrOptions?: ToastExtraOptions) => {
    const opts = normalizeToastOptions(param, 'info', durationOrOptions);
    return useToastStore.getState().addToast(opts);
  },
  custom: (options: ToastOptions | any) => {
    if (typeof options === 'object' && 'message' in options) {
      return useToastStore.getState().addToast(options);
    }
    return sonnerToast.custom(options);
  },
  promise: sonnerToast.promise,
  dismiss: (id?: string | number) => {
    if (typeof id === 'string') {
      useToastStore.getState().removeToast(id);
    }
    sonnerToast.dismiss(id);
  },
  clear: () => {
    useToastStore.getState().clearToasts();
    sonnerToast.dismiss();
  },
};

// Universal callable toast object supporting toast('msg'), toast.success('msg'), and toast.promise(...)
export const toast = Object.assign(
  (param: ToastParam, durationOrOptions?: ToastExtraOptions) => {
    const { message, options } = parseToastInput(param, durationOrOptions);
    const opts: ToastOptions = {
      message,
      type: 'info',
      duration: typeof options.duration === 'number' ? options.duration : undefined,
      description: typeof options.description === 'string' ? options.description : undefined,
    };
    return useToastStore.getState().addToast(opts);
  },
  showToast
);

export default toast;

