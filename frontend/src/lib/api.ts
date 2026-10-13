/**
 * Standard API client for frontend requests
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memed_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `HTTP error ${response.status}: ${response.statusText}`;
    const err = new Error(errorMsg) as Error & { details?: Record<string, string[]>; status: number };
    err.details = data?.details;
    err.status = response.status;
    throw err;
  }

  return data as T;
}
