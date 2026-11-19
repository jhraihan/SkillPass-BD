import { ClipboardList, House, LifeBuoy, LogOut, UserRound } from 'lucide-react';
import { Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import { useAuth } from '@/app/auth-context';
import LanguageSwitcher from '@/components/app/LanguageSwitcher';
import Logo from '@/components/app/Logo';
import { ScreenVoiceContext } from '@/app/screen-voice-context';
import { NewJobAlert, ReadAloudButton } from '@/components/domain';
import { ConfirmDialog, LoadingState } from '@/components/ui';
import NotificationBell from '@/features/customer/components/NotificationBell';
import NavItem from './NavItem';

export default function WorkerLayout() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const voice = useMemo(() => ({ text: voiceText, setText: setVoiceText }), [voiceText]);

  const tabs = [
    { to: '/worker', label: t('nav.home'), icon: House, end: true },
    { to: '/worker/jobs', label: t('nav.jobs'), icon: ClipboardList },
    { to: '/worker/profile', label: t('nav.profile'), icon: UserRound },
    { to: '/worker/help', label: t('nav.help'), icon: LifeBuoy },
  ];

  return (
    <ScreenVoiceContext.Provider value={voice}>
      <div className="min-h-dvh text-lg">
        <header className="glass sticky top-0 z-30 border-x-0 border-t-0 shadow-sm">
          <div className="mx-auto flex max-w-xl items-center gap-1 px-4 py-2">
            <Logo to="/worker" compact />
            <div className="ml-auto flex items-center gap-1">
              <ReadAloudButton text={voiceText} />
              <NotificationBell />
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl px-2.5 text-base font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="size-6" aria-hidden="true" />
                <span>{t('actions.logout')}</span>
              </button>
            </div>
          </div>
        </header>

        <NewJobAlert />

        <main className="mx-auto max-w-xl px-4 pb-28 pt-4">
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </main>

        <nav
          aria-label={t('nav.mainMenu')}
          className="glass fixed inset-x-0 bottom-0 z-30 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-12px_rgb(15_23_42/0.18)]"
        >
          <div className="mx-auto flex max-w-xl">
            {tabs.map((tab) => (
              <NavItem key={tab.to} {...tab} variant="bottom" />
            ))}
          </div>
        </nav>

        <ConfirmDialog
          open={confirmLogout}
          onClose={() => setConfirmLogout(false)}
          onConfirm={signOut}
          title={t('actions.logoutConfirm')}
          confirmLabel={t('actions.logout')}
          tone="primary"
          icon={LogOut}
        />
      </div>
    </ScreenVoiceContext.Provider>
  );
}
