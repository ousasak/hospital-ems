import React from 'react';
import { useTranslation } from '@/i18n';
import { Employee } from '../types';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export const DeleteEmployeeModal: React.FC<DeleteEmployeeModalProps> = ({
  isOpen,
  employee,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const { t } = useTranslation();
  if (!employee) return null;

  const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
  const code = employee.employee_code;
  const dept = employee.primary_assignment?.department?.name || '';

  return (
    <ConfirmDialog
      isOpen={isOpen}
      variant="danger"
      actionType="delete"
      title={t('employees.confirmDeleteTitle')}
      itemName={`${fullName} (${code})`}
      warningText={t('employees.confirmDeleteWarning')}
      message={
        dept ? (
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-muted-foreground font-medium">{t('employees.department')}:</span>
            <span className="font-semibold text-foreground">{dept}</span>
          </div>
        ) : undefined
      }
      confirmText={t('employees.deleteEmployee')}
      cancelText={t('employees.cancel')}
      isPending={isLoading}
      onClose={onClose}
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  );
};

export default DeleteEmployeeModal;
