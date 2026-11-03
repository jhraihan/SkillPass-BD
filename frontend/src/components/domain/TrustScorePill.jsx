import { ShieldCheck, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';

function toneFor(score) {
  if (score >= 75) return 'bg-green-100 text-green-800';
  if (score >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-700';
}

export default function TrustScorePill({ score = 0, isNew = false, className }) {
  const { t, i18n } = useTranslation();

  if (isNew) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-sm font-semibold text-sky-800',
          className,
        )}
      >
        <Sprout className="size-4" aria-hidden="true" />
        {t('worker.newOnSkillPass')}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold',
        toneFor(score),
        className,
      )}
      title={t('worker.trustLabel')}
    >
      <ShieldCheck className="size-4" aria-hidden="true" />
      {t('worker.trust', { score: formatNumber(score, i18n.language) })}
    </span>
  );
}
