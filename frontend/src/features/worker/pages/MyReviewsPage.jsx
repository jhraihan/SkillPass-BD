import { MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/api/errors';
import { ReviewCard, StarRating, TrustBreakdown } from '@/components/domain';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Pagination,
} from '@/components/ui';
import { REVIEW_PAGE_SIZE, useMyReviews } from '@/hooks/reviews';
import { useMyWorkerProfile } from '@/hooks/workers';
import { formatNumber } from '@/lib/format';

export default function MyReviewsPage() {
  const { t, i18n } = useTranslation('worker');
  const [page, setPage] = useState(1);
  const profile = useMyWorkerProfile();
  const reviews = useMyReviews({ page });

  if (profile.isPending) return <LoadingState />;
  if (profile.isError) {
    return <ErrorState message={getErrorMessage(profile.error, t)} onRetry={profile.refetch} />;
  }

  const me = profile.data;
  const { data, isPending, isError, error, refetch } = reviews;

  return (
    <div className="space-y-4">
      <PageHeader title={t('reviews.title')} backTo="/worker" className="mb-2" />

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-900">{t('reviews.scoreTitle')}</h2>
          <span className="text-3xl font-bold text-navy-700">
            {formatNumber(me.trust.score, i18n.language)}
          </span>
        </div>
        <TrustBreakdown breakdown={me.trust.breakdown} />
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-gray-900">{t('reviews.listTitle')}</h2>
          {me.review_count > 0 && <StarRating value={me.avg_rating} readOnly showValue />}
        </div>
        {isPending && <LoadingState />}
        {isError && <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />}
        {data?.results.length === 0 && (
          <EmptyState icon={MessageSquareText} title={t('reviews.empty')} className="py-8" />
        )}
        <div className="space-y-3">
          {data?.results.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
        {data && (
          <Pagination
            page={page}
            count={data.count}
            pageSize={REVIEW_PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </Card>
    </div>
  );
}
