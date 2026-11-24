import React from 'react';
import { Pagination } from '@/components/common/Pagination';

interface EmployeePaginationProps {
  currentPage: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export const EmployeePagination: React.FC<EmployeePaginationProps> = ({
  currentPage,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
}) => {
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  return (
    <Pagination
      currentPage={currentPage}
      lastPage={lastPage}
      total={total}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      perPageOptions={[10, 20, 50, 100]}
      className="rounded-2xl mt-2"
    />
  );
};

export default EmployeePagination;
