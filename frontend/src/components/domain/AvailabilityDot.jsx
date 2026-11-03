import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

const DOT = {
  AVAILABLE: 'bg-green-500',
  BUSY: 'bg-amber-500',
  OFFLINE: 'bg-gray-400',
};

export default function AvailabilityDot({ status, className }) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm text-gray-600', className)}>
      <span
        className={cn('size-2.5 rounded-full', DOT[status] ?? DOT.OFFLINE)}
        aria-hidden="true"
      />
      {t(`worker.availability.${status ?? 'OFFLINE'}`)}
    </span>
  );
}
