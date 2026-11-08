import { useTranslation } from 'react-i18next';
import { Card, Toggle } from '@/components/ui';
import { cn } from '@/lib/cn';

export default function AvailabilityToggle({ status, onChange, disabled }) {
  const { t } = useTranslation('worker');
  const isOn = status === 'AVAILABLE';

  return (
    <Card className={cn('transition-colors', isOn ? 'border-green-300 bg-green-50' : 'bg-white')}>
      <Toggle
        size="lg"
        checked={isOn}
        disabled={disabled}
        onChange={(checked) => onChange(checked ? 'AVAILABLE' : 'OFFLINE')}
        label={<span className="text-xl font-semibold">{t('availability.label')}</span>}
        description={t(isOn ? 'availability.on' : 'availability.off')}
      />
    </Card>
  );
}
