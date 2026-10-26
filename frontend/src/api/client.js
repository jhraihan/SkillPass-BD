import axios from 'axios';
import i18n from '@/i18n';
import { API_BASE_URL } from '@/lib/config';
import { tokens } from './tokens';

/** Fired when the session can no longer be refreshed; AuthProvider listens for it. */
export const AUTH_LOGOUT_EVENT = 'skillpass:logout';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15_000 });

api.interceptors.request.use((config) => {
  const access = tokens.getAccess();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  config.headers['Accept-Language'] = i18n.language;
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const refresh = tokens.getRefresh();
  if (!refresh) throw new Error('No refresh token');
  // Plain axios, not `api`, so this request never re-enters the interceptor.
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh });
  tokens.set({ access: data.access, refresh: data.refresh });
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || !original || original._retry || !tokens.getRefresh()) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      // Several requests can fail at once; share a single refresh call between them.
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const access = await refreshPromise;
      original.headers.Authorization = `Bearer ${access}`;
      return api(original);
    } catch (refreshError) {
      tokens.clear();
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
      return Promise.reject(refreshError);
    }
  },
);

export default api;
