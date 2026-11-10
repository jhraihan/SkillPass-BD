import { Eye, Scale } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import {
  Badge,
  Button,
  ErrorState,
  LoadingState,
  PageHeader,
  Pagination,
  Select,
  Table,
} from '@/components/ui';
import { useReports } from '@/hooks/reports';
import { cn } from '@/lib/cn';
import { REPORT_STATUSES, REPORT_TARGETS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';

export default function ReportsQueuePage() {
  const { t, i18n } = useTranslation('admin');
  const [status, setStatus] = useState('OPEN');
  const [targetType, setTargetType] = useState('');
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = useReports({
    status,
    target_type: targetType,
    page,
  });

  const columns = [
    {
      key: 'reason',
      header: t('reports.columns.reason'),
      render: (item) => (
        <div className="space-y-1">
          <p className="font-medium text-gray-900">{t(`common:report.reason.${item.reason}`)}</p>
          {item.is_dispute && (
            <Badge tone="red" size="sm" icon={Scale}>
              {t('common:report.dispute')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'target',
      header: t('reports.columns.target'),
      render: (item) => `${t(`common:report.target.${item.target_type}`)} #${item.target_id}`,
    },
    {
      key: 'reporter',
      header: t('reports.columns.reporter'),
      render: (item) => item.reporter.name,
    },
    {
      key: 'created_at',
      header: t('reports.columns.created'),
      render: (item) => formatDateTime(item.created_at, i18n.language),
    },
    {
      key: 'status',
      header: t('reports.columns.status'),
      render: (item) => (
        <Badge size="sm" tone={item.status === 'OPEN' ? 'yellow' : 'gray'}>
          {t(`common:report.status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <Button as={Link} to={`/admin/reports/${item.id}`} size="sm" icon={Eye}>
          {t('reports.open')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('reports.title')} description={t('reports.description')} />

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div role="tablist" className="flex flex-wrap gap-2">
          {REPORT_STATUSES.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={status === key}
              onClick={() => {
                setStatus(key);
                setPage(1);
              }}
              className={cn(
                'min-h-11 rounded-xl px-4 font-medium',
                status === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100',
              )}
            >
              {t(`common:report.status.${key}`)}
            </button>
          ))}
        </div>
        <Select
          aria-label={t('reports.filterTarget')}
          className="ml-auto w-56"
          value={targetType}
          onChange={(event) => {
            setTargetType(event.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: t('reports.allTargets') },
            ...REPORT_TARGETS.map((key) => ({
              value: key,
              label: t(`common:report.target.${key}`),
            })),
          ]}
        />
      </div>

      {isPending && <LoadingState />}
      {isError && <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />}
      {data && (
        <>
          <Table columns={columns} rows={data.results} emptyText={t('reports.empty')} />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
