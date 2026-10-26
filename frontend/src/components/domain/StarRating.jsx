import { Star } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';

const SIZES = { sm: 'size-4', md: 'size-6', lg: 'size-9' };

/**
 * Display:  <StarRating value={4.4} readOnly showValue />
 * Input:    <StarRating label="Quality" value={field.value} onChange={field.onChange} error={…} />
 */
export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  label,
  size,
  showValue = false,
  error,
  className,
}) {
  const { t, i18n } = useTranslation();
  const labelId = useId();
  const starSize = SIZES[size ?? (readOnly ? 'sm' : 'lg')];
  const rounded = Math.round(value);

  if (readOnly) {
    return (
      <span
        className={cn('inline-flex items-center gap-1', className)}
        role="img"
        aria-label={t('rating.outOf', { value: formatNumber(value, i18n.language) })}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(starSize, n <= rounded ? 'fill-amber-400 text-amber-400' : 'text-gray-300')}
            aria-hidden="true"
          />
        ))}
        {showValue && (
          <span className="ml-1 text-sm font-medium text-gray-700">
            {formatNumber(value, i18n.language, { maximumFractionDigits: 1 })}
          </span>
        )}
      </span>
    );
  }

  return (
    <div className={className}>
      {label && (
        <p id={labelId} className="mb-1.5 text-sm font-medium text-gray-800">
          {label}
        </p>
      )}
      <div role="radiogroup" aria-labelledby={label ? labelId : undefined} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === rounded}
            aria-label={t('rating.stars', { count: n })}
            onClick={() => onChange?.(n)}
            className="rounded-lg p-1"
          >
            <Star
              className={cn(starSize, n <= rounded ? 'fill-amber-400 text-amber-400' : 'text-gray-300')}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
