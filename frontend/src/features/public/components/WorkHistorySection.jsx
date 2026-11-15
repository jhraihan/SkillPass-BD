import { History } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/api/errors';
import { WorkHistoryCard } from '@/components/domain';
import { Card, EmptyState, ErrorState, LoadingState, Pagination } from '@/components/ui';
import { REVIEW_PAGE_SIZE, useWorkHistory } from '@/hooks/reviews';

export default function WorkHistorySection({ workerId }) {
  const { t } = useTranslation('public');
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = useWorkHistory(workerId, { page });

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-navy-700">{t('profile.historyTitle')}</h2>
        <p className="text-sm text-gray-600">{t('profile.historyHint')}</p>
      </div>

      {isPending && <LoadingState />}
      {isError && <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />}
      {data?.results.length === 0 && (
        <EmptyState icon={History} title={t('profile.noHistory')} className="py-8" />
      )}
      {data?.results.length > 0 && (
        <div className="space-y-3">
          {data.results.map((job) => (
            <WorkHistoryCard key={job.id} job={job} />
          ))}
          <Pagination
            page={page}
            count={data.count}
            pageSize={REVIEW_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </Card>
  );
}
