import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, RefreshCw } from 'lucide-react';
import { settingsService } from '@/services/settingsService';
import { useLocaleStore } from '@/stores/localeStore';
import { formatDateTime } from '@/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState, LoadingState, Pagination, SearchInput } from '@/components/common';
import type { AuditLogsResponse } from '../types';

export const AuditLogsSection: React.FC = () => {
  const { t } = useLocaleStore();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs-list', page, perPage],
    queryFn: async () => await settingsService.getAuditLogs({ page, per_page: perPage }),
  });

  const logs = data?.data || [];

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => {
      const causer = (log.causer?.name || '').toLowerCase();
      const desc = (log.description || '').toLowerCase();
      const subject = (log.subject_type || '').toLowerCase();
      const subjectId = String(log.subject_id ?? '').toLowerCase();
      return (
        causer.includes(q) ||
        desc.includes(q) ||
        subject.includes(q) ||
        subjectId.includes(q)
      );
    });
  }, [logs, search]);

  return (
    <Card className="overflow-hidden rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-card shadow-md">
      <CardHeader className="border-b border-border/60 bg-muted/15 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              {t('settings.audit.title')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('settings.audit.subtitle')}
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border/70 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('settings.audit.searchPlaceholder')}
            />
          </div>

          <span className="text-xs text-muted-foreground tabular-nums">
            {data?.total ?? 0} {t('common.records')}
          </span>
        </div>

        {isError ? (
          <div className="p-6">
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
          </div>
        ) : isLoading ? (
          <LoadingState message={t('common.loading')} />
        ) : filteredLogs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={History}
              title={
                search.trim()
                  ? t('settings.audit.noMatchesTitle')
                  : t('settings.audit.emptyTitle')
              }
              description={
                search.trim()
                  ? t('settings.audit.noMatchesDesc')
                  : t('settings.audit.emptyDesc')
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">{t('settings.audit.colTimestamp')}</th>
                    <th className="px-4 py-3">{t('settings.audit.colActor')}</th>
                    <th className="px-4 py-3">{t('settings.audit.colAction')}</th>
                    <th className="px-4 py-3">{t('settings.audit.colSubject')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((log) => {
                    const subjectLabel = log.subject_type
                      ? `${log.subject_type.split('\\').pop()}${
                          log.subject_id ? ` #${log.subject_id}` : ''
                        }`
                      : null;

                    return (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                          {log.causer?.name || (
                            <span className="text-muted-foreground font-normal">
                              {t('settings.audit.systemActor')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground">{log.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {subjectLabel ? (
                            <Badge variant="outline" className="font-mono text-[11px] font-normal">
                              {subjectLabel}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={data?.current_page || page}
              lastPage={data?.last_page || 1}
              total={data?.total || 0}
              perPage={perPage}
              perPageOptions={[10, 25, 50, 100]}
              onPageChange={setPage}
              onPerPageChange={(nextPerPage) => {
                setPerPage(nextPerPage);
                setPage(1);
              }}
              isLoading={isFetching}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogsSection;
