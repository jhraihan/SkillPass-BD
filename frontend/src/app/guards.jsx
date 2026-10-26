import { Navigate, Outlet, useLocation } from 'react-router';
import { LoadingState } from '@/components/ui';
import { homePathForRole } from '@/lib/constants';
import { useAuth } from './auth-context';

const SET_PIN_PATH = '/set-pin';

/** Logged-in users only. Sends users with a temporary PIN/password to /set-pin first. */
export function RequireAuth({ children }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoadingState className="min-h-dvh" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.must_change_credential && location.pathname !== SET_PIN_PATH) {
    return <Navigate to={SET_PIN_PATH} replace />;
  }
  return children ?? <Outlet />;
}

/** Logged-in users with one of `roles`. Others go to their own home page. */
export function RequireRole({ roles, children }) {
  const { user } = useAuth();
  return (
    <RequireAuth>
      {user && !roles.includes(user.role) ? (
        <Navigate to={homePathForRole(user.role)} replace />
      ) : (
        (children ?? <Outlet />)
      )}
    </RequireAuth>
  );
}
