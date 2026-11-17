import { History } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/api/errors';
import { WorkHistoryCard } from '@/components/domain';
import { EmptyState, ErrorState, LoadingState, PageHeader, Pagination } from '@/components/ui';
import { REVIEW_PAGE_SIZE, useMyWorkHistory } from '@/hooks/reviews';

export default function WorkHistoryPage() {
  const { t } = useTranslation('worker');
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = useMyWorkHistory({ page });

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('history.title')}
        description={t('history.subtitle')}
        backTo="/worker"
        className="mb-2"
      />

      {isPending && <LoadingState />}
      {isError && <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />}
      {data?.results.length === 0 && <EmptyState icon={History} title={t('history.empty')} />}
      <div className="space-y-3">
        {data?.results.map((job) => (
          <WorkHistoryCard key={job.id} job={job} />
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
    </div>
  );
}
