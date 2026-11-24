import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Loader2, Megaphone, Plus, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { settingsService } from '@/services/settingsService';
import { organizationService } from '@/services/organizationService';
import { useLocaleStore } from '@/stores/localeStore';
import { confirmDelete } from '@/stores/confirmStore';
import { formatDate, formatDateTime } from '@/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, GlobalModal, LoadingState } from '@/components/common';
import { DeleteRowButton } from '@/components/common/GlobalActionButtons';
import type { AnnouncementItem } from '../types';

interface AnnouncementsSectionProps {
  canEdit: boolean;
}

interface AnnouncementFormState {
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'department';
  target_department_id: string;
  expires_at: string;
}

const DEFAULT_FORM: AnnouncementFormState = {
  title: '',
  content: '',
  priority: 'normal',
  target_audience: 'all',
  target_department_id: '',
  expires_at: '',
};

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({ canEdit }) => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const [priorityFilter, setPriorityFilter] = useState<'all' | 'normal' | 'high' | 'urgent'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AnnouncementFormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof AnnouncementFormState, string>>>({});

  const {
    data: announcements = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<AnnouncementItem[]>({
    queryKey: ['announcements-list'],
    queryFn: async () => await settingsService.getAnnouncements(),
  });

  const { data: departmentsData = [] } = useQuery({
    queryKey: ['settings-departments-list'],
    queryFn: async () => {
      const res = await organizationService.getDepartments();
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 5 * 60_000,
  });

  const departmentMap = useMemo(() => {
    const map = new Map<number, string>();
    departmentsData.forEach((d: any) => {
      if (d?.id) map.set(Number(d.id), d.name);
    });
    return map;
  }, [departmentsData]);

  const filteredAnnouncements = useMemo(() => {
    if (priorityFilter === 'all') return announcements;
    return announcements.filter((a) => a.priority === priorityFilter);
  }, [announcements, priorityFilter]);

  const createMutation = useMutation({
    mutationFn: async () => {
      return await settingsService.createAnnouncement({
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority,
        target_audience: form.target_audience,
        target_department_id:
          form.target_audience === 'department' && form.target_department_id
            ? Number(form.target_department_id)
            : null,
        expires_at: form.expires_at || null,
      });
    },
    onSuccess: () => {
      toast.success(t('settings.announcements.createSuccess'));
      setModalOpen(false);
      setForm({ ...DEFAULT_FORM });
      setErrors({});
      queryClient.invalidateQueries({ queryKey: ['announcements-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('settings.announcements.createError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await settingsService.deleteAnnouncement(id),
    onSuccess: () => {
      toast.success(t('settings.announcements.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['announcements-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('settings.announcements.deleteError'));
    },
  });

  const openModal = () => {
    setForm({ ...DEFAULT_FORM });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof AnnouncementFormState, string>> = {};
    if (!form.title.trim()) {
      next.title = t('settings.validation.required');
    }
    if (!form.content.trim()) {
      next.content = t('settings.validation.required');
    }
    if (form.target_audience === 'department' && !form.target_department_id) {
      next.target_department_id = t('settings.validation.departmentRequired');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || createMutation.isPending) return;
    if (!validate()) return;
    createMutation.mutate();
  };

  const getPriorityBadge = (priority: AnnouncementItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return (
          <Badge variant="destructive">{t('settings.announcements.priorityUrgent')}</Badge>
        );
      case 'high':
        return <Badge variant="warning">{t('settings.announcements.priorityHigh')}</Badge>;
      default:
        return <Badge variant="secondary">{t('settings.announcements.priorityNormal')}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {!canEdit && (
        <Alert variant="info">
          <AlertDescription>{t('settings.common.readOnlyNotice')}</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-card shadow-md">
        <CardHeader className="border-b border-border/60 bg-muted/15 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                {t('settings.announcements.title')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {t('settings.announcements.subtitle')}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Select
                value={priorityFilter}
                onValueChange={(val) =>
                  setPriorityFilter(val as 'all' | 'normal' | 'high' | 'urgent')
                }
              >
                <SelectTrigger className="h-9 w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('settings.announcements.filterAllPriorities')}
                  </SelectItem>
                  <SelectItem value="normal">
                    {t('settings.announcements.priorityNormal')}
                  </SelectItem>
                  <SelectItem value="high">
                    {t('settings.announcements.priorityHigh')}
                  </SelectItem>
                  <SelectItem value="urgent">
                    {t('settings.announcements.priorityUrgent')}
                  </SelectItem>
                </SelectContent>
              </Select>

              {canEdit && (
                <Button size="sm" onClick={openModal}>
                  <Plus className="h-4 w-4" />
                  <span>{t('settings.announcements.newAnnouncement')}</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isError ? (
            <Alert variant="destructive">
              <AlertTitle>{t('settings.common.loadErrorTitle')}</AlertTitle>
              <AlertDescription className="mt-2 flex items-center justify-between gap-3">
                <span>{t('settings.common.loadErrorDesc')}</span>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{t('common.retry')}</span>
                </Button>
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <LoadingState message={t('common.loading')} />
          ) : filteredAnnouncements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title={t('settings.announcements.emptyTitle')}
              description={t('settings.announcements.emptyDesc')}
              actionLabel={canEdit ? t('settings.announcements.newAnnouncement') : undefined}
              onAction={canEdit ? openModal : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredAnnouncements.map((ann) => {
                const audienceLabel =
                  ann.target_audience === 'department'
                    ? ann.target_department?.name ||
                      (ann.target_department_id
                        ? departmentMap.get(Number(ann.target_department_id))
                        : undefined) ||
                      t('settings.announcements.audienceDepartment')
                    : t('settings.announcements.audienceAll');

                return (
                  <article
                    key={ann.id}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/60 p-5 shadow-xs transition-all hover:border-border hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {getPriorityBadge(ann.priority)}
                            <h4 className="text-sm font-semibold text-foreground leading-snug">
                              {ann.title}
                            </h4>
                          </div>
                        </div>

                        {canEdit && (
                          <DeleteRowButton
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              confirmDelete({
                                title: t('settings.announcements.deleteTitle'),
                                itemName: ann.title,
                                confirmText: t('common.delete'),
                                cancelText: t('common.cancel'),
                                onConfirm: () => deleteMutation.mutate(ann.id),
                              });
                            }}
                            title={t('common.delete')}
                          />
                        )}
                      </div>

                      <p className="mt-2.5 text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                        {ann.content}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                      <span>
                        {t('settings.announcements.publishedBy', {
                          date: formatDateTime(ann.published_at),
                          author: ann.author?.name || t('settings.announcements.defaultAuthor'),
                        })}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{audienceLabel}</span>
                      </span>

                      {ann.expires_at && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {t('settings.announcements.expiresOn', {
                              date: formatDate(ann.expires_at),
                            })}
                          </span>
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publish Announcement Modal */}
      <GlobalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        preventClose={createMutation.isPending}
        size="md"
        icon={<Megaphone size={20} />}
        title={t('settings.announcements.modalTitle')}
        description={t('settings.announcements.modalDesc')}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={createMutation.isPending}
              className="h-9 px-4 rounded-xl border-border bg-card text-xs font-semibold cursor-pointer hover:bg-muted"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              form="publish-announcement-form"
              size="sm"
              disabled={createMutation.isPending}
              className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
            >
              {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {createMutation.isPending
                  ? t('settings.announcements.publishing')
                  : t('settings.announcements.publish')}
              </span>
            </Button>
          </>
        }
      >
        <form id="publish-announcement-form" onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title" className="text-xs font-medium">
                {t('settings.announcements.fieldTitle')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ann-title"
                value={form.title}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, title: e.target.value }));
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder={t('settings.announcements.fieldTitlePlaceholder')}
                className={
                  errors.title ? 'border-destructive focus-visible:ring-destructive' : ''
                }
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ann-priority" className="text-xs font-medium">
                  {t('settings.announcements.fieldPriority')}
                </Label>
                <Select
                  value={form.priority}
                  onValueChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: val as 'normal' | 'high' | 'urgent',
                    }))
                  }
                >
                  <SelectTrigger id="ann-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">
                      {t('settings.announcements.priorityNormal')}
                    </SelectItem>
                    <SelectItem value="high">
                      {t('settings.announcements.priorityHigh')}
                    </SelectItem>
                    <SelectItem value="urgent">
                      {t('settings.announcements.priorityUrgent')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ann-audience" className="text-xs font-medium">
                  {t('settings.announcements.fieldAudience')}
                </Label>
                <Select
                  value={form.target_audience}
                  onValueChange={(val) => {
                    setForm((prev) => ({
                      ...prev,
                      target_audience: val as 'all' | 'department',
                      target_department_id: val === 'all' ? '' : prev.target_department_id,
                    }));
                    if (errors.target_department_id) {
                      setErrors((prev) => ({ ...prev, target_department_id: undefined }));
                    }
                  }}
                >
                  <SelectTrigger id="ann-audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t('settings.announcements.audienceAll')}
                    </SelectItem>
                    <SelectItem value="department">
                      {t('settings.announcements.audienceDepartment')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.target_audience === 'department' && (
              <div className="space-y-1.5">
                <Label htmlFor="ann-department" className="text-xs font-medium">
                  {t('settings.announcements.fieldDepartment')}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.target_department_id}
                  onValueChange={(val) => {
                    setForm((prev) => ({ ...prev, target_department_id: val }));
                    if (errors.target_department_id) {
                      setErrors((prev) => ({ ...prev, target_department_id: undefined }));
                    }
                  }}
                >
                  <SelectTrigger
                    id="ann-department"
                    className={
                      errors.target_department_id
                        ? 'border-destructive focus:ring-destructive'
                        : ''
                    }
                  >
                    <SelectValue placeholder={t('settings.announcements.selectDepartment')} />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentsData.map((dept: any) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.target_department_id && (
                  <p className="text-xs text-destructive">{errors.target_department_id}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ann-expires" className="text-xs font-medium">
                {t('settings.announcements.fieldExpiresAt')}{' '}
                <span className="text-muted-foreground font-normal">
                  ({t('settings.common.optional')})
                </span>
              </Label>
              <Input
                id="ann-expires"
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((prev) => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ann-content" className="text-xs font-medium">
                {t('settings.announcements.fieldContent')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="ann-content"
                rows={4}
                value={form.content}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, content: e.target.value }));
                  if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
                }}
                placeholder={t('settings.announcements.fieldContentPlaceholder')}
                className={
                  errors.content ? 'border-destructive focus-visible:ring-destructive' : ''
                }
              />
              {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
            </div>
        </form>
      </GlobalModal>
    </div>
  );
};

export default AnnouncementsSection;
