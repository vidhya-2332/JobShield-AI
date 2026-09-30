const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const ACCESS_KEY = 'jobshield_access';
const REFRESH_KEY = 'jobshield_refresh';

export function getTokens() {
  return {
    access: localStorage.getItem(ACCESS_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  };
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;
  const res = await fetch(`${API_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = await res.json();
  localStorage.setItem(ACCESS_KEY, data.access);
  return data.access;
}

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

// Core request helper. Automatically attaches the JWT access token and
// retries once with a refreshed token on a 401.
export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<ApiResult<T>> {
  const { access } = getTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (access) headers['Authorization'] = `Bearer ${access}`;

  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (res.status === 401 && retry) {
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        return apiRequest<T>(path, options, false);
      }
      return { data: null, error: 'Session expired. Please log in again.' };
    }

    if (res.status === 204) {
      return { data: null, error: null };
    }

    const contentType = res.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await res.json() : null;

    if (!res.ok) {
      const message =
        (body && (body.detail || body.error || JSON.stringify(body))) || `Request failed (${res.status})`;
      return { data: null, error: message };
    }

    return { data: body as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' };
  }
}
