export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  avatar?: string | null;
  employee_id?: number | null;
  is_active?: boolean;
}

export interface AuthSession {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

