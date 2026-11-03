import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { TRUST_FACTORS } from '@/lib/constants';
import { formatNumber } from '@/lib/format';

function barTone(value) {
  if (value >= 0.75) return 'bg-green-500';
  if (value >= 0.5) return 'bg-amber-400';
  return 'bg-gray-400';
}

function detailKey(item) {
  const { factor, detail } = item;
  if (detail.prior) return 'trust.prior';
  if (factor === 'rating' && !detail.count) return 'trust.detail.ratingNone';
  if (factor === 'identity')
    return detail.verified ? 'trust.detail.identityYes' : 'trust.detail.identityNo';
  if (factor === 'response' && detail.median_minutes >= 90) return 'trust.detail.responseHours';
  return `trust.detail.${factor}`;
}

function detailValues(detail, number) {
  const values = Object.fromEntries(
    Object.entries(detail).map(([key, value]) => [
      key,
      typeof value === 'number' ? number(value, { maximumFractionDigits: 1 }) : value,
    ]),
  );
  if (detail.median_minutes !== undefined) {
    values.hours = number(detail.median_minutes / 60, { maximumFractionDigits: 1 });
  }
  return values;
}

export default function TrustBreakdown({ breakdown = [], className }) {
  const { t, i18n } = useTranslation();
  const number = (value, options) => formatNumber(value, i18n.language, options);
  const items = TRUST_FACTORS.map((factor) =>
    breakdown.find((item) => item.factor === factor),
  ).filter(Boolean);

  return (
    <ul className={cn('space-y-4', className)}>
      {items.map((item) => (
        <li key={item.factor} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium text-gray-900">{t(`trust.factors.${item.factor}`)}</span>
            <span className="shrink-0 text-sm font-semibold text-gray-700">
              {t('trust.points', {
                points: number(item.points, { maximumFractionDigits: 1 }),
                weight: number(item.weight),
              })}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-label={t(`trust.factors.${item.factor}`)}
            aria-valuemin={0}
            aria-valuemax={item.weight}
            aria-valuenow={item.points}
          >
            <div
              className={cn('h-full rounded-full', barTone(item.value))}
              style={{ width: `${Math.round(item.value * 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {t(detailKey(item), detailValues(item.detail, number))}
          </p>
        </li>
      ))}
    </ul>
  );
}
