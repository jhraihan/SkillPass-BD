import { FileCheck2, Flag, LayoutDashboard, LogOut, Tags, Users } from 'lucide-react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import { useAuth } from '@/app/auth-context';
import LanguageSwitcher from '@/components/app/LanguageSwitcher';
import Logo from '@/components/app/Logo';
import { LoadingState } from '@/components/ui';
import NavItem from './NavItem';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const links = [
    { to: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/admin/verifications', label: t('nav.verifications'), icon: FileCheck2 },
    { to: '/admin/reports', label: t('nav.reports'), icon: Flag },
    { to: '/admin/users', label: t('nav.users'), icon: Users },
    { to: '/admin/catalog', label: t('nav.catalog'), icon: Tags },
  ];

  return (
    <div className="min-h-dvh md:flex">
      <aside className="glass sticky top-0 z-30 border-x-0 border-t-0 shadow-sm md:h-dvh md:w-64 md:shrink-0 md:border-r md:border-b-0 md:shadow-none">
        <div className="flex items-center gap-1 px-4 py-3">
          <Logo to="/admin" />
          <div className="ml-auto flex items-center md:hidden">
            <LanguageSwitcher />
          </div>
        </div>
        <nav
          aria-label={t('nav.mainMenu')}
          className="overflow-x-auto px-3 pb-3 [scrollbar-width:none]"
        >
          <div className="flex gap-1 md:flex-col">
            {links.map((link) => (
              <span key={link.to} className="contents md:hidden">
                <NavItem {...link} />
              </span>
            ))}
            {links.map((link) => (
              <span key={`side-${link.to}`} className="hidden md:block">
                <NavItem {...link} variant="side" />
              </span>
            ))}
          </div>
        </nav>
        <div className="hidden px-3 md:block">
          <LanguageSwitcher className="w-full justify-start" />
          <button
            type="button"
            onClick={signOut}
            className="inline-flex min-h-12 w-full items-center gap-3 rounded-2xl px-3.5 text-base font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="size-5" aria-hidden="true" />
            {t('actions.logout')}
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 animate-fade-up px-4 py-6 md:px-10 md:py-8">
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
