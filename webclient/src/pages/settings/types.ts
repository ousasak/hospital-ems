export type SettingsSectionId =
  | 'organization'
  | 'localization'
  | 'policies'
  | 'attendance_security'
  | 'announcements'
  | 'audit_logs';

export interface OrganizationProfile {
  id?: number;
  name: string;
  legal_name: string;
  registration_number: string;
  tax_id: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  default_currency: string;
  fiscal_year_start: string;
  updated_at?: string;
}

export interface SystemSettingsMap {
  organization_name?: string;
  grace_period_minutes?: string;
  usd_khr_exchange_rate?: string;
  default_currency?: string;
  default_language?: string;
  enable_qr_attendance?: string;
  [key: string]: string | undefined;
}

export interface AnnouncementItem {
  id: number;
  organization_id?: number | null;
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'department';
  target_department_id?: number | null;
  is_published?: boolean;
  published_at: string;
  expires_at?: string | null;
  author?: {
    id: number;
    name: string;
    email?: string;
  } | null;
  target_department?: {
    id: number;
    name: string;
  } | null;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'department';
  target_department_id?: number | null;
  expires_at?: string | null;
}

export interface AuditLogItem {
  id: number;
  log_name?: string | null;
  description: string;
  subject_type?: string | null;
  subject_id?: number | string | null;
  event?: string | null;
  causer_type?: string | null;
  causer_id?: number | string | null;
  causer?: {
    id: number;
    name: string;
    email?: string;
  } | null;
  properties?: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogsResponse {
  data: AuditLogItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
