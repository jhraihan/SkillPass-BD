import { ClipboardList, House, LifeBuoy, UserRound } from 'lucide-react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import LanguageSwitcher from '@/components/app/LanguageSwitcher';
import Logo from '@/components/app/Logo';
import { LoadingState } from '@/components/ui';
import NotificationBell from '@/features/customer/components/NotificationBell';
import NavItem from './NavItem';

/**
 * Worker area: phone-first, bigger text, and only 4 bottom tabs that never move (PRD §14.2).
 */
export default function WorkerLayout() {
  const { t } = useTranslation();

  const tabs = [
    { to: '/worker', label: t('nav.home'), icon: House, end: true },
    { to: '/worker/jobs', label: t('nav.jobs'), icon: ClipboardList },
    { to: '/worker/profile', label: t('nav.profile'), icon: UserRound },
    { to: '/worker/help', label: t('nav.help'), icon: LifeBuoy },
  ];

  return (
    <div className="min-h-dvh text-lg">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-xl items-center gap-1 px-4 py-2">
          <Logo to="/worker" />
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pb-28 pt-4">
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>

      <nav
        aria-label={t('nav.mainMenu')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex max-w-xl">
          {tabs.map((tab) => (
            <NavItem key={tab.to} {...tab} variant="bottom" />
          ))}
        </div>
      </nav>
    </div>
  );
}
