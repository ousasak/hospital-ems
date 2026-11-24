import React from 'react';
import { Badge } from '../ui/badge';
import { useTranslation } from '../../i18n';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();
  const s = status ? status.toLowerCase() : '';
  const displayText = t(`status.${s}`, status ? status.replace(/_/g, ' ') : '');

  switch (s) {
    case 'active':
    case 'present':
    case 'approved':
    case 'paid':
    case 'completed':
    case 'hired':
      return <Badge variant="success">{displayText}</Badge>;

    case 'probation':
    case 'late':
    case 'pending':
    case 'pending_supervisor':
    case 'pending_hr':
    case 'screening':
    case 'interview':
    case 'reviewed':
      return <Badge variant="warning">{displayText}</Badge>;

    case 'terminated':
    case 'suspended':
    case 'rejected':
    case 'cancelled':
    case 'absent':
      return <Badge variant="destructive">{displayText}</Badge>;

    case 'resigned':
    case 'on_leave':
    case 'half_day':
    case 'holiday':
    case 'draft':
      return <Badge variant="secondary">{displayText}</Badge>;

    default:
      return <Badge variant="outline">{displayText}</Badge>;
  }
};

