import axios, { AxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { ApiResponse } from '@/types/api';
import { setupInterceptors } from './interceptors';

/**
 * Core Axios HTTP Client
 */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach request and response interceptors
setupInterceptors(apiClient);

/**
 * Normalize raw backend data into the standard ApiResponse envelope
 */
function normalizeResponse<T>(resData: any): ApiResponse<T> {
  if (resData && typeof resData === 'object' && typeof resData.success === 'boolean') {
    return resData as ApiResponse<T>;
  }

  // Handle standard Laravel paginator if not yet enveloped
  if (
    resData &&
    typeof resData === 'object' &&
    Array.isArray(resData.data) &&
    'current_page' in resData &&
    'total' in resData
  ) {
    const { data, current_page, last_page, per_page, total } = resData;
    return {
      success: true,
      data: data as T,
      meta: {
        current_page,
        last_page,
        per_page,
        total,
      },
    };
  }

  return {
    success: true,
    data: resData as T,
  };
}

/**
 * Standardized Central API Service Bridge
 */
export const api = {
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const res = await apiClient.get<ApiResponse<T>>(url, config);
    return normalizeResponse<T>(res.data);
  },

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const res = await apiClient.post<ApiResponse<T>>(url, data, config);
    return normalizeResponse<T>(res.data);
  },

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const res = await apiClient.put<ApiResponse<T>>(url, data, config);
    return normalizeResponse<T>(res.data);
  },

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const res = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return normalizeResponse<T>(res.data);
  },

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const res = await apiClient.delete<ApiResponse<T>>(url, config);
    return normalizeResponse<T>(res.data);
  },

  client: apiClient,
};

export const client = apiClient;
export default api;
