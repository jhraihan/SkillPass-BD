import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

export default function LanguageSwitcher({ className }) {
  const { t, i18n } = useTranslation();
  const next = i18n.language === 'bn' ? 'en' : 'bn';
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      lang={next}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-2xl px-2.5 text-sm font-semibold text-gray-700 transition hover:bg-ink-900/5',
        className,
      )}
      aria-label={`${t('language.label')}: ${t('language.switchTo')}`}
    >
      <Languages className="size-5" aria-hidden="true" />
      {t('language.switchTo')}
    </button>
  );
}
