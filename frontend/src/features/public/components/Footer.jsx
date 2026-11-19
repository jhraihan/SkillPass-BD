import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Logo from '@/components/app/Logo';

const LINKS = [
  { to: '/workers', key: 'findWorkers' },
  { to: '/trust-score', key: 'trustScore' },
  { to: '/about', key: 'about' },
  { to: '/register', key: 'register' },
];

export default function Footer() {
  const { t } = useTranslation('public');

  return (
    <footer className="relative isolate overflow-hidden bg-ink-950 text-white">
      <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10 opacity-70" />
      <div
        aria-hidden="true"
        className="absolute bottom-0 -left-24 -z-10 size-80 rounded-full bg-brand-600/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -top-24 right-0 -z-10 size-72 rounded-full bg-accent-600/20 blur-3xl"
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2">
        <div className="space-y-4">
          <Logo tone="light" />
          <p className="max-w-sm text-white/60">{t('footer.tagline')}</p>
        </div>
        <nav
          aria-label={t('footer.links')}
          className="flex flex-wrap gap-x-6 gap-y-3 sm:justify-end sm:self-start"
        >
          {LINKS.map(({ to, key }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex min-h-11 items-center text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>
      </div>
      <p className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/45">
        {t('footer.rights', { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
