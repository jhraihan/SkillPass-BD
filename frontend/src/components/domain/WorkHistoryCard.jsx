import { BadgeCheck, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { formatDate, localName } from '@/lib/format';
import CategoryIcon from './CategoryIcon';
import StarRating from './StarRating';

export default function WorkHistoryCard({ job, className }) {
  const { t, i18n } = useTranslation();
  const name = (item) => localName(item, i18n.language);

  return (
    <article
      className={cn('flex gap-3 rounded-2xl border border-gray-200 bg-white p-4', className)}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
        <CategoryIcon name={job.category.icon} className="size-6 text-brand-700" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="font-semibold text-gray-900">{name(job.category)}</h3>
          <span className="text-sm text-gray-500">{formatDate(job.closed_at, i18n.language)}</span>
        </div>
        <p className="text-sm text-gray-700">{job.skills.map(name).join(', ')}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-4" aria-hidden="true" />
            {name(job.area)}
          </span>
          <span className="inline-flex items-center gap-1 text-green-700">
            <BadgeCheck className="size-4" aria-hidden="true" />
            {t('history.confirmedBy', { name: job.customer_name })}
          </span>
        </p>
        {job.review ? (
          <div className="space-y-1 pt-1">
            <StarRating value={job.review.overall} readOnly showValue />
            {job.review.comment && <p className="text-sm text-gray-800">{job.review.comment}</p>}
          </div>
        ) : (
          <p className="pt-1 text-sm text-gray-500">{t('history.noReview')}</p>
        )}
      </div>
    </article>
  );
}
