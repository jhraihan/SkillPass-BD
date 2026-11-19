import { ThumbsUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { RATING_DIMENSIONS } from '@/lib/constants';
import { formatDate, localName } from '@/lib/format';
import StarRating from './StarRating';

export default function ReviewCard({ review, showCategory = true, footer, className }) {
  const { t, i18n } = useTranslation();

  return (
    <article
      className={cn(
        'space-y-3 rounded-3xl border border-white/80 bg-white/85 p-4 shadow-soft sm:p-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display font-semibold text-ink-900">{review.customer_name}</p>
          <p className="text-sm text-gray-500">
            {[
              showCategory && localName(review.category, i18n.language),
              formatDate(review.created_at, i18n.language),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <StarRating value={review.overall} readOnly showValue />
      </div>

      <dl className="grid gap-x-6 gap-y-1.5 rounded-2xl bg-gray-50/80 p-3 text-sm sm:grid-cols-2">
        {RATING_DIMENSIONS.map((dimension) => (
          <div key={dimension} className="flex items-center justify-between gap-2">
            <dt className="text-gray-600">{t(`review.dimensions.${dimension}`)}</dt>
            <dd>
              <StarRating value={review[dimension]} readOnly size="sm" />
            </dd>
          </div>
        ))}
      </dl>

      {review.comment && <p className="text-gray-800">{review.comment}</p>}

      {(review.would_hire_again || footer) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {review.would_hire_again ? (
            <Badge tone="green" size="sm" icon={ThumbsUp}>
              {t('review.wouldHireAgain')}
            </Badge>
          ) : (
            <span />
          )}
          {footer}
        </div>
      )}
    </article>
  );
}
