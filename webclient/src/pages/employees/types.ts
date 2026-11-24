export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth?: string | null;
  marital_status?: string | null;
  nationality?: string | null;
  national_id?: string | null;
  passport_number?: string | null;
  medical_license_number?: string | null;
  license_expiry_date?: string | null;
  specialization?: string | null;
  email: string;
  phone?: string | null;
  personal_email?: string | null;
  avatar_url?: string | null;
  join_date: string;
  probation_end_date?: string | null;
  contract_end_date?: string | null;
  employment_status: string; // active, probation, inactive, suspended, terminated, resigned
  current_salary?: {
    id?: number;
    base_salary?: number | string;
    currency?: string;
  } | null;
  base_salary?: number | string | null;
  address?: string | null;
  city?: string | null;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  primary_assignment?: {
    id: number;
    department_id?: number;
    position_id?: number;
    work_location_id?: number;
    supervisor_id?: number;
    employment_type_id?: number;
    department?: {
      id: number;
      name: string;
      code?: string;
    };
    position?: {
      id: number;
      title: string;
      code?: string;
    };
    work_location?: {
      id: number;
      name: string;
      city?: string;
      country?: string;
    };
    employment_type?: {
      id: number;
      name: string;
      code?: string;
    };
    supervisor?: {
      id: number;
      first_name: string;
      last_name: string;
      email?: string;
    };
  };
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeFilters {
  search?: string;
  country?: string;
  department?: string;
  department_id?: string | number;
  office?: string;
  type?: string;
  status?: string;
}

export interface EmployeeFormData {
  id?: number;
  name: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  department?: string;
  department_id?: number | string;
  position_id?: number | string;
  employmentType?: string;
  employment_type_id?: number | string;
  country?: string;
  city?: string;
  office?: string;
  work_location_id?: number | string;
  manager?: string;
  supervisor_id?: number | string;
  email: string;
  phone?: string;
  status?: string;
  join_date?: string;
  medical_license_number?: string;
  specialization?: string;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

