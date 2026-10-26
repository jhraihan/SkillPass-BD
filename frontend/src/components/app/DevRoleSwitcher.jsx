import { FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/auth-context';
import { homePathForRole } from '@/lib/constants';
import { USE_MOCKS } from '@/lib/config';

const ROLES = ['CUSTOMER', 'WORKER', 'ADMIN'];

/** Mock mode only: pick a demo user to see any area of the app without a backend. */
export default function DevRoleSwitcher() {
  const { t } = useTranslation();
  const { user, setMockRole } = useAuth();
  const navigate = useNavigate();

  if (!USE_MOCKS || !setMockRole) return null;

  const onChange = (event) => {
    const role = event.target.value || null;
    setMockRole(role);
    navigate(role ? homePathForRole(role) : '/');
  };

  return (
    <label className="fixed bottom-24 left-3 z-40 flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 py-1 pl-3 pr-1 text-xs text-amber-900 shadow-md sm:bottom-4">
      <FlaskConical className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">{t('dev.viewAs')}</span>
      <select
        value={user?.role ?? ''}
        onChange={onChange}
        className="rounded-full border-0 bg-white py-1 pl-2 pr-6 text-xs font-medium"
      >
        <option value="">{t('dev.guest')}</option>
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {t(`roles.${role}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
