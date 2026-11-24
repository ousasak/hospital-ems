import React from 'react';
import { User as UserIcon, Key, Edit2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useLocaleStore } from '@/stores/localeStore';
import { User } from '../types';
import { formatDate, cn } from '@/utils';
import { getAbsoluteImageUrl } from '@/utils/image';
import { GlobalModal } from '@/components/common/GlobalModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface UserDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  isOpen,
  onClose,
  user,
  onEdit,
  onResetPassword,
}) => {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();

  if (!user) return null;

  const isActive = (user.status || '').toLowerCase() === 'active';
  const emp = user.employee;
  const branchName =
    emp?.primary_assignment?.work_location?.name || emp?.city || '—';
  const deptName = emp?.primary_assignment?.department?.name || '—';
  const posTitle = emp?.primary_assignment?.position?.title || '—';

  const getInitials = (name?: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <GlobalModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      icon={<UserIcon size={20} />}
      title={t('users.dialog.userDetailsTitle', 'ព័ត៌មានលម្អិតអ្នកប្រើប្រាស់')}
      description={t(
        'users.dialog.userDetailsDesc',
        'ព័ត៌មានគណនី សិទ្ធិ និងបុគ្គលិកដែលបានភ្ជាប់។'
      )}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onResetPassword(user);
            }}
            className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted gap-1.5"
          >
            <Key className="h-3.5 w-3.5" />
            {t('users.actions.resetPassword', 'កំណត់ពាក្យសម្ងាត់')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(user);
            }}
            className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
          >
            <Edit2 className="h-3.5 w-3.5" />
            {t('users.actions.editUser', 'កែប្រែ')}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 1. Clean Profile Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border border-border">
            {user.avatar_url && (
              <AvatarImage
                src={getAbsoluteImageUrl(user.avatar_url)}
                alt={user.name}
              />
            )}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-foreground truncate">
                {user.name}
              </h3>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isActive ? 'bg-emerald-500' : 'bg-muted-foreground/60'
                  )}
                />
                {isActive ? t('status.active', 'សកម្ម') : t('status.inactive', 'អសកម្ម')}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span className="truncate">{user.email}</span>
              {emp?.employee_code && (
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {emp.employee_code}
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* 2. Account Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            {t('users.form.accountInfo', 'ព័ត៌មានគណនី')}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 text-xs">
            <div>
              <span className="text-muted-foreground block">
                {t('users.columns.name', 'ឈ្មោះ')}
              </span>
              <span className="mt-0.5 block text-sm font-medium text-foreground">
                {user.name}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">
                {t('users.columns.email', 'អ៊ីមែល')}
              </span>
              <span className="mt-0.5 block text-sm font-medium text-foreground truncate">
                {user.email}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">
                {t('users.columns.createdAt', 'កាលបរិច្ឆេទបង្កើត')}
              </span>
              <span className="mt-0.5 block text-sm font-medium text-foreground tabular-nums">
                {formatDate(user.created_at, locale)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">
                {t('users.columns.role', 'តួនាទី')}
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {user.roles?.length ? (
                  user.roles.map((r) => (
                    <Badge
                      key={r.id || r.name}
                      variant="secondary"
                      className="rounded-full font-medium text-xs"
                    >
                      {r.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Linked Employee Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            {t('users.columns.linkedEmployee', 'បុគ្គលិកភ្ជាប់')}
          </h4>
          {emp ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 text-xs">
              <div>
                <span className="text-muted-foreground block">
                  {t('users.columns.branch', 'សាខា')}
                </span>
                <span className="mt-0.5 block text-sm font-medium text-foreground">
                  {branchName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">
                  {t('nav.departments', 'នាយកដ្ឋាន')}
                </span>
                <span className="mt-0.5 block text-sm font-medium text-foreground">
                  {deptName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">
                  {t('nav.positions', 'មុខតំណែង')}
                </span>
                <span className="mt-0.5 block text-sm font-medium text-foreground">
                  {posTitle}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">
                  {t('users.form.phone', 'លេខទូរស័ព្ទ')}
                </span>
                <span className="mt-0.5 block text-sm font-medium text-foreground">
                  {emp.phone || '—'}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground">
              {t('users.form.unlinked', 'អ្នកប្រើប្រាស់ប្រព័ន្ធ (មិនភ្ជាប់បុគ្គលិក)')}
            </div>
          )}
        </div>
      </div>
    </GlobalModal>
  );
};
