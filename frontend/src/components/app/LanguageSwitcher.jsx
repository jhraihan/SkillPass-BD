import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

/** One tap switches between বাংলা and English. */
export default function LanguageSwitcher({ className }) {
  const { t, i18n } = useTranslation();
  const next = i18n.language === 'bn' ? 'en' : 'bn';
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      lang={next}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-gray-700 hover:bg-gray-100',
        className,
      )}
      aria-label={`${t('language.label')}: ${t('language.switchTo')}`}
    >
      <Languages className="size-5" aria-hidden="true" />
      {t('language.switchTo')}
    </button>
  );
}
