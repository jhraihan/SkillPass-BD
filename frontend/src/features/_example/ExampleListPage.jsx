// Reference list page — copy this pattern for any page that shows a list.
// Route: /_examples (dev only)   Data: useExampleItems
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { StatusTag } from '@/components/domain';
import { Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, Pagination } from '@/components/ui';
import { EXAMPLE_PAGE_SIZE, useExampleItems } from '@/hooks/examples';
import { formatDate } from '@/lib/format';

export default function ExampleListPage() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useExampleItems({ page });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PageHeader
        title={t('examples.listTitle')}
        description={t('examples.listDescription')}
        actions={
          <Button as={Link} to="/_examples/new" icon={Plus}>
            {t('examples.new')}
          </Button>
        }
      />

      {isPending && <LoadingState />}
      {isError && <ErrorState onRetry={refetch} />}
      {data?.results.length === 0 && <EmptyState title={t('examples.empty')} />}

      {data?.results.length > 0 && (
        <>
          <ul className="space-y-3">
            {data.results.map((item) => (
              <li key={item.id}>
                <Card as={Link} to={`/_examples/${item.id}`} className="block hover:border-brand-300">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <StatusTag status={item.status} size="sm" />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {t(`examples.categories.${item.category}`)} · {item.area} ·{' '}
                    {formatDate(item.created_at, i18n.language)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            count={data.count}
            pageSize={EXAMPLE_PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
