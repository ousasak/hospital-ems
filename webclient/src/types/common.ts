import { PaginationMeta, ApiResponse, ApiErrorResponse } from './api';

export * from './api';

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export type StatusType = 'active' | 'inactive' | 'probation' | 'terminated' | 'resigned' | 'suspended';
export type GenderType = 'male' | 'female' | 'other';
