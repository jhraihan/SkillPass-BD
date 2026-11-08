import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button, Card } from '@/components/ui';
import { formatNumber } from '@/lib/format';

export default function CompletenessBar({ completeness }) {
  const { t, i18n } = useTranslation('worker');
  const { percent, next_step: nextStep } = completeness;

  if (percent >= 100) return null;

  const target = nextStep === 'identity' ? '/worker/verification' : '/worker/profile';

  return (
    <Card className="space-y-3">
      <p className="text-lg font-semibold text-gray-900">
        {t('completeness.title', { percent: formatNumber(percent, i18n.language) })}
      </p>
      <div
        className="h-3 overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
      </div>
      {nextStep && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-gray-700">
            {t('completeness.nextLabel')} {t(`completeness.next.${nextStep}`)}
          </p>
          <Button as={Link} to={target} variant="outline" icon={ArrowRight}>
            {t('completeness.action')}
          </Button>
        </div>
      )}
    </Card>
  );
}
