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
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-sm text-sm text-gray-600">{t('footer.tagline')}</p>
        </div>
        <nav
          aria-label={t('footer.links')}
          className="flex flex-wrap gap-x-5 gap-y-2 sm:justify-end"
        >
          {LINKS.map(({ to, key }) => (
            <Link key={to} to={to} className="text-sm text-gray-700 hover:text-brand-700">
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>
      </div>
      <p className="border-t border-gray-100 px-4 py-4 text-center text-xs text-gray-500">
        {t('footer.rights', { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
