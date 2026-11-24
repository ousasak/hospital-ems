import { create } from 'zustand';
import React from 'react';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';
export type ConfirmActionType =
  | 'delete'
  | 'logout'
  | 'revoke'
  | 'warning'
  | 'restore'
  | 'archive'
  | 'info'
  | 'success';

export interface ConfirmOptions {
  title?: string;
  subtitle?: string;
  message?: React.ReactNode;
  itemName?: string;
  warningText?: string;
  variant?: ConfirmVariant;
  actionType?: ConfirmActionType;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  isExecuting: boolean;
  openConfirm: (options: ConfirmOptions) => void;
  closeConfirm: () => void;
  executeConfirm: () => Promise<void>;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: null,
  isExecuting: false,
  openConfirm: (options) => {
    set({ isOpen: true, options, isExecuting: false });
  },
  closeConfirm: () => {
    const { options, isExecuting } = get();
    if (isExecuting) return;
    if (options?.onCancel) {
      options.onCancel();
    }
    set({ isOpen: false, options: null, isExecuting: false });
  },
  executeConfirm: async () => {
    const { options } = get();
    if (!options?.onConfirm) {
      set({ isOpen: false, options: null });
      return;
    }
    try {
      set({ isExecuting: true });
      await options.onConfirm();
      set({ isOpen: false, options: null, isExecuting: false });
    } catch (err) {
      set({ isExecuting: false });
      throw err;
    }
  },
}));

/**
 * Universal imperative helper to trigger a confirmation modal from anywhere.
 */
export const confirmAction = (options: ConfirmOptions) => {
  useConfirmStore.getState().openConfirm(options);
};

/**
 * Universal delete confirmation helper matching Nexa Commerce KH / KHPosCommerce signature look.
 */
export const confirmDelete = (
  itemNameOrOptions: string | Omit<ConfirmOptions, 'variant' | 'actionType'>,
  onConfirmCallback?: () => void | Promise<void>
) => {
  if (typeof itemNameOrOptions === 'string') {
    useConfirmStore.getState().openConfirm({
      title: 'បញ្ជាក់ការលុប?',
      itemName: itemNameOrOptions,
      variant: 'danger',
      actionType: 'delete',
      confirmText: 'លុបចេញ',
      cancelText: 'បោះបង់',
      onConfirm: onConfirmCallback || (() => {}),
    });
  } else {
    useConfirmStore.getState().openConfirm({
      title: 'បញ្ជាក់ការលុប?',
      variant: 'danger',
      actionType: 'delete',
      confirmText: 'លុបចេញ',
      cancelText: 'បោះបង់',
      ...itemNameOrOptions,
    });
  }
};

/**
 * Hook to use confirmation dialog in components.
 */
export const useConfirm = () => {
  return {
    confirm: confirmAction,
    confirmDelete,
    closeConfirm: useConfirmStore.getState().closeConfirm,
  };
};

export default useConfirm;
