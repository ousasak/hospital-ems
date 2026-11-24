import React from 'react';
import { Users, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { cn } from '@/utils';

interface UserStatsCardsProps {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
}

export const UserStatsCards: React.FC<UserStatsCardsProps> = ({
  totalUsers,
  activeUsers,
  inactiveUsers,
  totalRoles,
}) => {
  const { t } = useTranslation();

  const cards = [
    {
      id: 'total',
      title: t('users.stats.totalUsers', 'អ្នកប្រើប្រាស់សរុប'),
      value: totalUsers,
      icon: Users,
      iconBoxClass:
        'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60',
    },
    {
      id: 'active',
      title: t('users.stats.activeUsers', 'សកម្ម'),
      value: activeUsers,
      icon: UserCheck,
      iconBoxClass:
        'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60',
    },
    {
      id: 'inactive',
      title: t('users.stats.inactiveUsers', 'អសកម្ម'),
      value: inactiveUsers,
      icon: UserX,
      iconBoxClass:
        'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60',
    },
    {
      id: 'roles',
      title: t('users.stats.totalRoles', 'តួនាទីសរុប'),
      value: totalRoles,
      icon: ShieldCheck,
      iconBoxClass:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-card dark:bg-slate-900 border border-border/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs select-none flex items-center gap-3.5 sm:gap-4"
          >
            {/* Square Soft-Colored Icon Box matching Reference */}
            <div
              className={cn(
                'size-11 sm:size-12 rounded-xl flex items-center justify-center shrink-0 shadow-2xs',
                card.iconBoxClass
              )}
            >
              <Icon className="size-5 sm:size-5.5 stroke-[2]" />
            </div>

            {/* Label + Big Value Stack */}
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-muted-foreground block truncate leading-tight">
                {card.title}
              </span>
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans block mt-0.5 leading-tight">
                {card.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
