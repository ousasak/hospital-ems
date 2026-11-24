import React from 'react';
import { Pagination } from '@/components/common/Pagination';

interface AttendancePaginationProps {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const AttendancePagination: React.FC<AttendancePaginationProps> = ({
  currentPage,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
}) => {
  const lastPage = Math.max(1, Math.ceil(totalRecords / pageSize));

  return (
    <Pagination
      currentPage={currentPage}
      lastPage={lastPage}
      total={totalRecords}
      perPage={pageSize}
      onPageChange={onPageChange}
      onPerPageChange={onPageSizeChange}
      perPageOptions={[10, 20, 50, 100]}
      className="rounded-2xl mt-2"
    />
  );
};

export default AttendancePagination;
