import { LayoutDashboard, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router';
import LanguageSwitcher from '@/components/app/LanguageSwitcher';
import Logo from '@/components/app/Logo';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { cn } from '@/lib/cn';
import { homePathForRole } from '@/lib/constants';

const LINKS = [
  { to: '/workers', key: 'findWorkers' },
  { to: '/trust-score', key: 'trustScore' },
  { to: '/about', key: 'about' },
];

function NavLinks({ className }) {
  const { t } = useTranslation('public');
  return (
    <nav className={className}>
      {LINKS.map(({ to, key }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'inline-flex min-h-11 shrink-0 items-center rounded-xl px-3 text-sm font-medium',
              isActive ? 'bg-brand-50 text-brand-800' : 'text-gray-700 hover:bg-gray-100',
            )
          }
        >
          {t(`nav.${key}`)}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Navbar() {
  const { t } = useTranslation('public');
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
        <Logo />
        <NavLinks className="ml-4 hidden gap-1 md:flex" />
        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          {user ? (
            <Button as={Link} to={homePathForRole(user.role)} size="sm" icon={LayoutDashboard}>
              {t('nav.dashboard')}
            </Button>
          ) : (
            <>
              <Button as={Link} to="/login" size="sm" variant="ghost" icon={LogIn}>
                {t('nav.login')}
              </Button>
              <Button as={Link} to="/register" size="sm">
                {t('nav.register')}
              </Button>
            </>
          )}
        </div>
      </div>
      <NavLinks className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden" />
    </header>
  );
}
