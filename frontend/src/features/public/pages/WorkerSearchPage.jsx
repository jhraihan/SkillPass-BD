import { SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { WorkerCard } from '@/components/domain';
import { EmptyState, ErrorState, LoadingState, PageHeader, Pagination } from '@/components/ui';
import { useWorkerSearch, WORKER_PAGE_SIZE } from '@/hooks/workers';
import { formatNumber } from '@/lib/format';
import SearchFilters from '../components/SearchFilters';

const TEXT_FILTERS = ['search', 'category', 'skill', 'area', 'min_trust'];
const FLAG_FILTERS = ['verified', 'available'];
const DEFAULT_ORDERING = '-trust_score';

function readFilters(params) {
  return {
    ...Object.fromEntries(TEXT_FILTERS.map((key) => [key, params.get(key) ?? ''])),
    ...Object.fromEntries(FLAG_FILTERS.map((key) => [key, params.get(key) === 'true'])),
    ordering: params.get('ordering') ?? DEFAULT_ORDERING,
    page: Number(params.get('page') ?? 1),
  };
}

function toParams(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (
      value &&
      !(key === 'ordering' && value === DEFAULT_ORDERING) &&
      !(key === 'page' && value === 1)
    ) {
      params.set(key, String(value));
    }
  }
  return params;
}

export default function WorkerSearchPage() {
  const { t, i18n } = useTranslation('public');
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const { data, isPending, isError, refetch } = useWorkerSearch(filters);

  const update = (next) => setSearchParams(toParams({ ...next, page: 1 }), { replace: true });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title={t('search.title')}
        description={
          data &&
          t('search.results', { count: data.count, value: formatNumber(data.count, i18n.language) })
        }
      />
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-4">
          <SearchFilters values={filters} onChange={update} onClear={() => setSearchParams({})} />
        </aside>
        <section>
          {isPending && <LoadingState />}
          {isError && <ErrorState onRetry={refetch} />}
          {data?.results.length === 0 && (
            <EmptyState
              icon={SearchX}
              title={t('search.emptyTitle')}
              description={t('search.emptyText')}
            />
          )}
          {data?.results.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.results.map((worker) => (
                  <WorkerCard key={worker.id} worker={worker} />
                ))}
              </div>
              <Pagination
                page={filters.page}
                count={data.count}
                pageSize={WORKER_PAGE_SIZE}
                onPageChange={(page) => setSearchParams(toParams({ ...filters, page }))}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
