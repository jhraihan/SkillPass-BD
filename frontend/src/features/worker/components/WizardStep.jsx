import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { formatNumber } from '@/lib/format';

export default function WizardStep({
  current,
  total,
  title,
  hint,
  children,
  onBack,
  onNext,
  nextDisabled,
  loading,
  extraAction,
}) {
  const { t, i18n } = useTranslation('worker');
  const isLast = current === total;

  return (
    <div className="flex min-h-[70dvh] flex-col gap-6">
      <div className="space-y-2">
        <p className="text-base text-gray-600">
          {t('wizard.step', {
            current: formatNumber(current, i18n.language),
            total: formatNumber(total, i18n.language),
          })}
        </p>
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={`h-2 flex-1 rounded-full ${index < current ? 'bg-brand-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy-700">{title}</h1>
        {hint && <p className="text-gray-600">{hint}</p>}
      </div>

      <div className="flex-1">{children}</div>

      <div className="space-y-3">
        <Button
          size="xl"
          fullWidth
          icon={isLast ? Check : ArrowRight}
          onClick={onNext}
          disabled={nextDisabled}
          loading={loading}
        >
          {t(isLast ? 'wizard.finish' : 'wizard.next')}
        </Button>
        {extraAction}
        {current > 1 && (
          <Button
            size="lg"
            variant="ghost"
            fullWidth
            icon={ArrowLeft}
            onClick={onBack}
            disabled={loading}
          >
            {t('wizard.back')}
          </Button>
        )}
      </div>
    </div>
  );
}
