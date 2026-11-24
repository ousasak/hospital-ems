import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Bell, CheckCheck, Clock, UserCheck, CalendarDays, Sparkles, FileText } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/utils';
import { useTranslation } from '../../i18n';

interface NotificationItem {
  id: string;
  titleKey: string;
  descKey: string;
  time: string;
  read: boolean;
  type: 'leave' | 'attendance' | 'payroll' | 'recruitment' | 'system';
}

const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    titleKey: 'notifications.newLeaveRequest',
    descKey: 'notifications.newLeaveRequestDesc',
    time: '10m ago',
    read: false,
    type: 'leave',
  },
  {
    id: '2',
    titleKey: 'notifications.attendanceCorrection',
    descKey: 'notifications.attendanceCorrectionDesc',
    time: '45m ago',
    read: false,
    type: 'attendance',
  },
  {
    id: '3',
    titleKey: 'notifications.payrollReady',
    descKey: 'notifications.payrollReadyDesc',
    time: '2h ago',
    read: true,
    type: 'payroll',
  },
  {
    id: '4',
    titleKey: 'notifications.interviewScheduled',
    descKey: 'notifications.interviewScheduledDesc',
    time: '5h ago',
    read: true,
    type: 'recruitment',
  },
];

export const NotificationCenter: React.FC<{ triggerClassName?: string }> = ({
  triggerClassName,
}) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'leave':
        return <CalendarDays className="h-4 w-4 text-emerald-500" />;
      case 'attendance':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'payroll':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'recruitment':
        return <UserCheck className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={t('notifications.title', 'Notifications')}
          className={cn(
            'relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            triggerClassName
          )}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{t('notifications.title', 'Notifications')}</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">
                {unreadCount} {t('notifications.new', 'new')}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              {t('notifications.markAllRead', 'Mark all as read')}
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'flex items-start gap-3 p-3.5 transition-colors hover:bg-accent/40',
                !n.read && 'bg-primary/5'
              )}
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background border border-border shadow-xs">
                {getTypeIcon(n.type)}
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className={cn('text-xs font-medium text-foreground', !n.read && 'font-semibold')}>
                    {t(n.titleKey)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">{n.time}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(n.descKey)}</p>
              </div>
              {!n.read && (
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border p-2 text-center">
          <Link
            to="/settings"
            className="text-xs font-medium text-primary hover:underline block py-1"
          >
            {t('notifications.viewAll', 'View all announcements & logs')}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

