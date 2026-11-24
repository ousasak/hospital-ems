import React from 'react';
import { ConfirmDialog } from './ConfirmDialog';

export interface DeleteConfirmDialogProps {
  isOpen?: boolean;
  open?: boolean;
  title?: string;
  itemName?: string;
  description?: React.ReactNode;
  warningText?: string;
  isPending?: boolean;
  isDeleting?: boolean;
  loading?: boolean;
  cancelLabel?: string;
  cancelText?: string;
  deleteLabel?: string;
  confirmText?: string;
  onCancel?: () => void;
  onClose?: () => void;
  onConfirm: () => void | Promise<void>;
  children?: React.ReactNode;
}

/**
 * Standard Delete Confirm Dialog component cloned from Nexa Commerce KH / KHPosCommerce.
 * Can be used as a standalone declarative JSX component anywhere in the application.
 */
export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  open,
  title = 'បញ្ជាក់ការលុប?',
  itemName,
  description,
  warningText,
  isPending = false,
  isDeleting = false,
  loading = false,
  cancelLabel,
  cancelText,
  deleteLabel,
  confirmText,
  onCancel,
  onClose,
  onConfirm,
  children,
}) => {
  const isDialogActive = open !== undefined ? open : Boolean(isOpen);
  const handleCancel = onCancel || onClose || (() => {});

  return (
    <ConfirmDialog
      isOpen={isDialogActive}
      variant="danger"
      actionType="delete"
      title={title}
      itemName={itemName}
      subtitle={typeof description === 'string' ? description : undefined}
      message={children || (typeof description !== 'string' ? description : undefined)}
      warningText={warningText}
      isPending={isPending || isDeleting || loading}
      cancelText={cancelText || cancelLabel || 'បោះបង់'}
      confirmText={confirmText || deleteLabel || 'លុបចេញ'}
      onConfirm={onConfirm}
      onCancel={handleCancel}
      onClose={handleCancel}
    />
  );
};

export default DeleteConfirmDialog;
