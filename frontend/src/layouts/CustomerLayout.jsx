import { CalendarCheck, LayoutDashboard, LogOut, PlusCircle, Search } from 'lucide-react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import { useAuth } from '@/app/auth-context';
import LanguageSwitcher from '@/components/app/LanguageSwitcher';
import Logo from '@/components/app/Logo';
import { LoadingState } from '@/components/ui';
import NotificationBell from '@/features/customer/components/NotificationBell';
import NavItem from './NavItem';

export default function CustomerLayout() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const links = [
    { to: '/customer', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/workers', label: t('nav.findWorkers'), icon: Search },
    { to: '/customer/requests/new', label: t('nav.newRequest'), icon: PlusCircle },
    { to: '/customer/bookings', label: t('nav.bookings'), icon: CalendarCheck },
  ];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2">
          <Logo to="/customer" compact />
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={signOut}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="size-5" aria-hidden="true" />
              <span className="hidden sm:inline">{t('actions.logout')}</span>
            </button>
          </div>
        </div>
        <nav aria-label={t('nav.mainMenu')} className="mx-auto max-w-5xl overflow-x-auto px-4 pb-2">
          <div className="flex gap-1">
            {links.map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
