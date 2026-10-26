import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

export default function Logo({ to = '/', compact = false, className }) {
  const { t } = useTranslation();
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 64 64" className="size-8 shrink-0" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#14866d" />
        <path
          d="M20 33l8 8 16-18"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={cn('text-lg font-bold text-navy-700', compact && 'sr-only sm:not-sr-only')}>
        {t('appName')}
      </span>
    </Link>
  );
}
