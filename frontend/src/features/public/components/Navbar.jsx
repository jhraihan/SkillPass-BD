import { LayoutDashboard, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';
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

function NavLinks({ className, linkClassName, onNavigate }) {
  const { t } = useTranslation('public');
  return (
    <nav className={className}>
      {LINKS.map(({ to, key }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'inline-flex min-h-11 shrink-0 items-center rounded-2xl px-3.5 font-semibold transition-colors',
              isActive
                ? 'bg-brand-500/12 text-brand-800'
                : 'text-gray-600 hover:bg-ink-900/5 hover:text-ink-900',
              linkClassName,
            )
          }
        >
          {t(`nav.${key}`)}
        </NavLink>
      ))}
    </nav>
  );
}

function AccountActions({ user, onNavigate, stacked = false }) {
  const { t } = useTranslation('public');
  if (user) {
    return (
      <Button
        as={Link}
        to={homePathForRole(user.role)}
        size={stacked ? 'lg' : 'sm'}
        icon={LayoutDashboard}
        fullWidth={stacked}
        onClick={onNavigate}
      >
        {t('nav.dashboard')}
      </Button>
    );
  }
  return (
    <div className={cn('flex gap-2', stacked && 'grid grid-cols-2')}>
      <Button
        as={Link}
        to="/login"
        size={stacked ? 'lg' : 'sm'}
        variant={stacked ? 'outline' : 'ghost'}
        icon={LogIn}
        onClick={onNavigate}
      >
        {t('nav.login')}
      </Button>
      <Button as={Link} to="/register" size={stacked ? 'lg' : 'sm'} onClick={onNavigate}>
        {t('nav.register')}
      </Button>
    </div>
  );
}

export default function Navbar() {
  const { t } = useTranslation('public');
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div className="glass mx-auto max-w-6xl rounded-3xl shadow-lg shadow-ink-900/5">
        <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
          <Logo />
          <NavLinks className="ml-6 hidden gap-1 text-sm md:flex" />
          <div className="ml-auto flex items-center gap-1">
            <LanguageSwitcher />
            <div className="hidden md:block">
              <AccountActions user={user} />
            </div>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={t('nav.menu')}
              className="inline-flex size-11 items-center justify-center rounded-2xl text-ink-900 transition hover:bg-ink-900/5 md:hidden"
            >
              {open ? (
                <X className="size-6" aria-hidden="true" />
              ) : (
                <Menu className="size-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <div
          id="mobile-menu"
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-out md:hidden',
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden" inert={!open}>
            <div className="space-y-3 border-t border-gray-200/60 p-3">
              <NavLinks
                className="flex flex-col gap-1"
                linkClassName="text-base"
                onNavigate={close}
              />
              <AccountActions user={user} onNavigate={close} stacked />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
