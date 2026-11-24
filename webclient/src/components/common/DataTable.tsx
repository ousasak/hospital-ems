import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useTranslation, translateString } from '@/i18n';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import { cn } from '@/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: keyof T | string;
  title: React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T | ((row: T) => string | number);
  loading?: boolean;
  isFetching?: boolean;
  emptyText?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  footer?: React.ReactNode;
  className?: string;
  stickyHeader?: boolean;
  skeletonRows?: number;
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DataTable<T extends object>({
  columns,
  data,
  rowKey = 'id' as keyof T,
  loading = false,
  isFetching = false,
  emptyText,
  emptyDescription,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  rowClassName,
  footer,
  className = '',
  stickyHeader = true,
  skeletonRows = 5,
  renderMobileCard,
}: DataTableProps<T>) {
  const { t } = useTranslation(['tables', 'empty', 'common']);

  // Resolve empty state strings with i18n support
  const resolvedEmptyText = emptyText
    ? typeof emptyText === 'string'
      ? translateString(emptyText)
      : emptyText
    : t('tables.emptyData', 'No records found');

  const resolvedEmptyDescription = emptyDescription
    ? typeof emptyDescription === 'string'
      ? translateString(emptyDescription)
      : emptyDescription
    : undefined;

  const getKey = (row: T, index: number): string | number => {
    if (typeof rowKey === 'function') return rowKey(row);
    return (row[rowKey] as string | number) ?? index;
  };

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;
    const key = column.key as string;
    const nextDirection: 'asc' | 'desc' = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    onSort(key, nextDirection);
  };

  const getSortTitle = (column: Column<T>): string | undefined => {
    if (!column.sortable) return undefined;
    const key = column.key as string;
    if (sortKey === key) {
      return sortDir === 'asc'
        ? t('tables.sortAsc', 'Sorted ascending')
        : t('tables.sortDesc', 'Sorted descending');
    }
    return t('tables.sort', 'Click to sort');
  };

  const renderSortIndicator = (column: Column<T>) => {
    if (!column.sortable) return null;
    const key = column.key as string;
    if (sortKey === key) {
      return sortDir === 'asc' ? (
        <ArrowUp
          size={13}
          className="text-primary shrink-0 transition-transform"
          aria-label={t('tables.sortAsc', 'Sorted ascending')}
        />
      ) : (
        <ArrowDown
          size={13}
          className="text-primary shrink-0 transition-transform"
          aria-label={t('tables.sortDesc', 'Sorted descending')}
        />
      );
    }
    return (
      <ArrowUpDown
        size={13}
        className="opacity-0 group-hover:opacity-60 text-muted-foreground shrink-0 transition-opacity"
        aria-label={t('tables.sort', 'Click to sort')}
      />
    );
  };

  const renderColumnTitle = (column: Column<T>): React.ReactNode => {
    if (typeof column.title === 'string') {
      return translateString(column.title);
    }
    return column.title;
  };

  const getCellValue = (row: T, column: Column<T>): unknown => {
    const keys = (column.key as string).split('.');
    return keys.reduce<unknown>(
      (accumulator, currentKey) =>
        accumulator && typeof accumulator === 'object'
          ? (accumulator as Record<string, unknown>)[currentKey]
          : undefined,
      row
    );
  };

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  return (
    <div
      className={cn(
        'relative bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden',
        className
      )}
    >
      {/* ── 1. MOBILE CARD VIEW (if renderMobileCard is passed) ────── */}
      {renderMobileCard && (
        <div className="block md:hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <div key={i} className="p-4 border border-border/50 rounded-xl space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded-md w-1/3" />
                  <div className="h-3 bg-muted animate-pulse rounded-md w-2/3" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-6 w-16 bg-muted animate-pulse rounded-lg" />
                    <div className="h-6 w-20 bg-muted animate-pulse rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {resolvedEmptyText}
              </p>
              {resolvedEmptyDescription && (
                <p className="text-xs text-muted-foreground/80">
                  {resolvedEmptyDescription}
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {data.map((row, index) => (
                <div
                  key={getKey(row, index)}
                  onClick={() => onRowClick?.(row, index)}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {renderMobileCard(row, index)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 2. DESKTOP DATA TABLE (hidden on mobile if renderMobileCard is active) ────── */}
      <div className={cn(renderMobileCard ? 'hidden md:block' : 'block', 'overflow-x-auto w-full')}>
        <table className="w-full data-table border-collapse">
          {/* Header */}
          <thead
            className={cn(
              'bg-muted/40 dark:bg-slate-900/50 border-b border-border select-none',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {columns.map((column) => {
                const sortTitle = getSortTitle(column);
                return (
                  <th
                    key={column.key as string}
                    style={{ width: column.width }}
                    onClick={() => handleSort(column)}
                    title={sortTitle}
                    aria-sort={
                      sortKey === column.key
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                    className={cn(
                      'px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none transition-colors whitespace-nowrap',
                      getAlignClass(column.align),
                      column.headerClassName,
                      column.sortable && 'cursor-pointer hover:bg-muted group'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1.5',
                        column.align === 'right'
                          ? 'justify-end'
                          : column.align === 'center'
                          ? 'justify-center'
                          : 'justify-start'
                      )}
                    >
                      <span className="leading-snug">{renderColumnTitle(column)}</span>
                      {renderSortIndicator(column)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <LoadingSkeleton cols={columns.length} rows={skeletonRows} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState
                    message={resolvedEmptyText}
                    description={resolvedEmptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const customClassName = rowClassName ? rowClassName(row, index) : '';
                return (
                  <tr
                    key={getKey(row, index)}
                    onClick={() => onRowClick?.(row, index)}
                    className={cn(
                      'group hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors',
                      onRowClick && 'cursor-pointer',
                      customClassName
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key as string}
                        className={cn(
                          'px-4 py-3.5 text-sm align-middle',
                          getAlignClass(column.align),
                          column.className
                        )}
                      >
                        {column.render
                          ? column.render(getCellValue(row, column), row, index)
                          : String(getCellValue(row, column) ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer (e.g. pagination slot) */}
      {footer && (
        <div className="border-t border-border px-4 py-3 bg-card/60">
          {footer}
        </div>
      )}
    </div>
  );
}

export default DataTable;

