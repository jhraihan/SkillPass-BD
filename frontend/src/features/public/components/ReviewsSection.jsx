import { Flag, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/api/errors';
import { ReviewCard, StarRating } from '@/components/domain';
import { Button, Card, EmptyState, ErrorState, LoadingState, Pagination } from '@/components/ui';
import { REVIEW_PAGE_SIZE, useWorkerReviews } from '@/hooks/reviews';
import ReportModal from './ReportModal';

export default function ReviewsSection({ worker }) {
  const { t } = useTranslation('public');
  const [page, setPage] = useState(1);
  const [reporting, setReporting] = useState(null);
  const { data, isPending, isError, error, refetch } = useWorkerReviews(worker.id, { page });

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-navy-700">{t('profile.reviewsTitle')}</h2>
        {worker.review_count > 0 && (
          <span className="inline-flex items-center gap-2 text-sm text-gray-600">
            <StarRating value={worker.avg_rating} readOnly showValue />
            {t('common:worker.reviews', { count: worker.review_count })}
          </span>
        )}
      </div>

      {isPending && <LoadingState />}
      {isError && <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />}
      {data?.results.length === 0 && (
        <EmptyState icon={MessageSquareText} title={t('profile.noReviews')} className="py-8" />
      )}
      {data?.results.length > 0 && (
        <div className="space-y-3">
          {data.results.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              footer={
                <Button size="sm" variant="ghost" icon={Flag} onClick={() => setReporting(review)}>
                  {t('report.reviewButton')}
                </Button>
              }
            />
          ))}
          <Pagination
            page={page}
            count={data.count}
            pageSize={REVIEW_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
      <ReportModal
        open={Boolean(reporting)}
        onClose={() => setReporting(null)}
        targetType="REVIEW"
        targetId={reporting?.id}
        subject={reporting?.customer_name}
      />
    </Card>
  );
}
