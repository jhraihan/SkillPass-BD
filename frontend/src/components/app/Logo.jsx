import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

export default function Logo({ to = '/', compact = false, tone = 'dark', className }) {
  const { t } = useTranslation();
  const gradientId = useId();
  return (
    <Link
      to={to}
      className={cn('group inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap', className)}
    >
      <svg
        viewBox="0 0 64 64"
        className="size-9 shrink-0 drop-shadow-[0_6px_14px_rgb(22_169_130/0.35)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#34cc9c" />
            <stop offset="0.55" stopColor="#0c8a6b" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill={`url(#${gradientId})`} />
        <path
          d="M20 33l8 8 16-18"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={cn(
          'font-display text-lg font-bold tracking-tight',
          tone === 'light' ? 'text-white' : 'text-ink-900',
          compact && 'sr-only sm:not-sr-only',
        )}
      >
        {t('appName')}
      </span>
    </Link>
  );
}
