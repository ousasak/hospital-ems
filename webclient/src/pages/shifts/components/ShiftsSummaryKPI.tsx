import React from 'react';
import { CalendarCheck, Users, UserX, AlertTriangle, Clock } from 'lucide-react';
import { ShiftKPIStats } from '../types';
import { EnterpriseStatsCard, EnterpriseStatsGrid } from '@/components/common/StatCard';
import { useLocaleStore } from '@/stores/localeStore';

interface ShiftsSummaryKPIProps {
  stats: ShiftKPIStats;
}

export const ShiftsSummaryKPI: React.FC<ShiftsSummaryKPIProps> = ({ stats }) => {
  const { t } = useLocaleStore();

  return (
    <div className="mb-6">
      <EnterpriseStatsGrid columns={5}>
        <EnterpriseStatsCard
          title={t('shifts.kpi.todayShifts')}
          value={stats.today}
          subtitle={t('shifts.kpi.todaySubtitle')}
          variant="primary"
          icon={CalendarCheck}
        />
        <EnterpriseStatsCard
          title={t('shifts.kpi.scheduled')}
          value={stats.scheduled}
          subtitle={t('shifts.kpi.scheduledSubtitle')}
          variant="emerald"
          icon={Users}
        />
        <EnterpriseStatsCard
          title={t('shifts.kpi.unassigned')}
          value={stats.unassigned}
          subtitle={t('shifts.kpi.unassignedSubtitle')}
          variant="amber"
          icon={UserX}
        />
        <EnterpriseStatsCard
          title={t('shifts.kpi.conflicts')}
          value={stats.conflicts}
          subtitle={t('shifts.kpi.conflictsSubtitle')}
          variant="rose"
          icon={AlertTriangle}
        />
        <EnterpriseStatsCard
          title={t('shifts.kpi.openSlots')}
          value={stats.open}
          subtitle={t('shifts.kpi.openSlotsSubtitle')}
          variant="cyan"
          icon={Clock}
        />
      </EnterpriseStatsGrid>
    </div>
  );
};
