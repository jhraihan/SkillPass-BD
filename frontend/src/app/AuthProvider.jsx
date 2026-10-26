import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import api, { AUTH_LOGOUT_EVENT } from '@/api/client';
import { tokens } from '@/api/tokens';
import { USE_MOCKS } from '@/lib/config';
import { mockUsers } from '@/mocks/users';
import { AuthContext } from './auth-context';

const MOCK_ROLE_KEY = 'skillpass.mockRole';

function readMockRole() {
  // ?mockRole=WORKER in the address bar picks the demo user directly.
  const fromUrl = new URLSearchParams(window.location.search).get('mockRole');
  if (fromUrl) {
    writeMockRole(fromUrl === 'GUEST' ? null : fromUrl);
    return fromUrl;
  }
  try {
    return localStorage.getItem(MOCK_ROLE_KEY);
  } catch {
    return null;
  }
}

function writeMockRole(role) {
  try {
    if (role) localStorage.setItem(MOCK_ROLE_KEY, role);
    else localStorage.removeItem(MOCK_ROLE_KEY);
  } catch {
    // Storage unavailable; mock role resets on reload.
  }
}

function initialState() {
  if (USE_MOCKS) return { status: 'ready', user: mockUsers[readMockRole()] ?? null };
  return { status: tokens.getAccess() ? 'loading' : 'ready', user: null };
}

export default function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState(initialState);

  // Real API: a saved token exists, so load who it belongs to.
  useEffect(() => {
    if (USE_MOCKS || state.status !== 'loading') return undefined;
    let cancelled = false;
    api
      .get('/auth/me/')
      .then(({ data }) => {
        if (!cancelled) setState({ status: 'ready', user: data });
      })
      .catch(() => {
        if (cancelled) return;
        tokens.clear();
        setState({ status: 'ready', user: null });
      });
    return () => {
      cancelled = true;
    };
  }, [state.status]);

  // The API client fires this when the refresh token is no longer valid.
  useEffect(() => {
    const onLogout = () => setState({ status: 'ready', user: null });
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, []);

  const value = useMemo(
    () => ({
      user: state.user,
      status: state.status,
      isAuthenticated: Boolean(state.user),

      /** Call after a successful login/register API response. */
      signIn({ access, refresh, user }) {
        tokens.set({ access, refresh });
        setState({ status: 'ready', user });
      },

      updateUser(changes) {
        setState((current) => ({ ...current, user: { ...current.user, ...changes } }));
      },

      signOut() {
        tokens.clear();
        writeMockRole(null);
        queryClient.clear();
        setState({ status: 'ready', user: null });
      },

      /** Mock mode only: switch which demo user is "logged in". */
      setMockRole: USE_MOCKS
        ? (role) => {
            writeMockRole(role);
            queryClient.clear();
            setState({ status: 'ready', user: mockUsers[role] ?? null });
          }
        : undefined,
    }),
    [state, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
