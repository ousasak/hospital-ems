import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { toast } from '@/utils/toast';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import { env } from '@/config/env';

/**
 * Configure request and response interceptors for an Axios client instance
 */
export function setupInterceptors(client: AxiosInstance): void {
  // 1. Request Interceptor: Attach Auth, Company Context, and Language headers
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Authorization: Retrieve token from auth store or fallback to localStorage
      const token =
        useAuthStore.getState().token ||
        localStorage.getItem('staffstream_token');

      if (token && typeof token === 'string' && token.trim() !== '' && token !== 'null' && token !== 'undefined') {
        config.headers.set('Authorization', `Bearer ${token.trim()}`);
      }

      // Company Context: Multi-tenant scoping header
      const companyId = localStorage.getItem('staffstream_company_id');
      if (companyId && typeof companyId === 'string' && companyId.trim() !== '' && companyId !== 'null' && companyId !== 'undefined') {
        config.headers.set('X-Company-Id', companyId.trim());
      }

      // Language Context: Supported km, en (Default from configured env)
      const storeLocale = useLocaleStore.getState().locale;
      const rawLocale = storeLocale || localStorage.getItem('staffstream_locale') || env.defaultLocale;
      const activeLocale = rawLocale === 'en' || rawLocale === 'km' ? rawLocale : env.defaultLocale;

      config.headers.set('Accept-Language', activeLocale);
      config.headers.set('X-Locale', activeLocale);

      return config;
    },
    (error) => Promise.reject(error)
  );

  // 2. Response Interceptor: Centralized Error Handling & Session Expiry
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; errors?: Record<string, string[] | string> }>) => {
      if (!error.response) {
        // Network Connection Error
        toast.error('បញ្ហាតភ្ជាប់បណ្តាញ / Network Error. Please verify your connection.');
        return Promise.reject(error);
      }

      const { status, config } = error.response;
      const requestUrl = config?.url || '';

      switch (status) {
        case 401: {
          // Do not redirect to login when an unauthenticated login request returns invalid credentials
          const isLoginRequest = requestUrl.includes('/auth/login');
          if (!isLoginRequest) {
            useAuthStore.getState().logout();
            localStorage.removeItem('staffstream_token');
            localStorage.removeItem('staffstream_user');

            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
          break;
        }

        case 403: {
          toast.error({
            message: 'គ្មានសិទ្ធិអនុញ្ញាតក្នុងការចូលប្រើប្រាស់មុខងារនេះទេ',
            code: 403,
          });
          break;
        }

        case 404: {
          // Preserve 404 for application/service handling
          break;
        }

        case 422: {
          // Validation error: Preserve errors so forms can consume them
          break;
        }

        default: {
          if (status >= 500) {
            toast.error({
              message: 'មានបញ្ហាម៉ាស៊ីនមេ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ',
              code: status,
            });
          }
          break;
        }
      }

      return Promise.reject(error);
    }
  );
}
