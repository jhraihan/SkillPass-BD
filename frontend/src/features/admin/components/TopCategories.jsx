import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CategoryIcon } from '@/components/domain';
import { Card } from '@/components/ui';
import { formatNumber, localName } from '@/lib/format';

export default function TopCategories({ categories, reviews }) {
  const { t, i18n } = useTranslation('admin');
  const number = (value, options) => formatNumber(value ?? 0, i18n.language, options);

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-navy-700">{t('dashboard.topCategories')}</h2>
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          {reviews.average ? number(reviews.average, { maximumFractionDigits: 1 }) : '—'} ·{' '}
          {t('dashboard.reviews', { value: number(reviews.count) })}
        </span>
      </div>
      {categories.length === 0 && <p className="text-gray-500">{t('dashboard.noBookings')}</p>}
      <ul className="divide-y divide-gray-100">
        {categories.map((category) => (
          <li key={category.slug} className="flex items-center gap-3 py-2">
            <CategoryIcon name={category.icon} className="size-5 text-brand-700" />
            <span className="flex-1 text-gray-900">{localName(category, i18n.language)}</span>
            <span className="text-sm text-gray-600">
              {t('dashboard.categoryCounts', {
                bookings: number(category.bookings),
                completed: number(category.completed),
              })}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
