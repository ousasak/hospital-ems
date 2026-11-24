import React from 'react';
import { useConfirmStore } from '@/stores/confirmStore';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Global Confirm Dialog mounted once at root (in App.tsx).
 * Allows any page or table action to trigger sleek, unified confirmation dialogs.
 */
export const GlobalConfirmDialog: React.FC = () => {
  const { isOpen, options, isExecuting, closeConfirm, executeConfirm } = useConfirmStore();

  if (!isOpen || !options) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      variant={options.variant || 'danger'}
      actionType={options.actionType || 'delete'}
      title={options.title}
      subtitle={options.subtitle}
      message={options.message}
      itemName={options.itemName}
      warningText={options.warningText}
      confirmText={options.confirmText || options.confirmLabel}
      cancelText={options.cancelText || options.cancelLabel}
      isPending={isExecuting}
      onConfirm={executeConfirm}
      onCancel={closeConfirm}
      onClose={closeConfirm}
    />
  );
};

export default GlobalConfirmDialog;
