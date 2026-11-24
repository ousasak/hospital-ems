import React from 'react';
import { Pagination } from '@/components/common/Pagination';

interface LeavePaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  selectedCount?: number;
}

export const LeavePagination: React.FC<LeavePaginationProps> = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Pagination
      currentPage={page}
      lastPage={lastPage}
      total={total}
      perPage={pageSize}
      onPageChange={onPageChange}
      onPerPageChange={onPageSizeChange}
      perPageOptions={[10, 20, 30, 50]}
      className="rounded-2xl mt-3"
    />
  );
};

export default LeavePagination;
