import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/lib/format';
import Button from './Button';

/** Works with DRF paginated responses: <Pagination page={page} count={data.count} onPageChange={setPage} /> */
export default function Pagination({ page, count, pageSize = 20, onPageChange }) {
  const { t, i18n } = useTranslation();
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-3 pt-4" aria-label={t('pagination.label')}>
      <Button
        variant="outline"
        icon={ChevronLeft}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {t('pagination.previous')}
      </Button>
      <span className="text-sm text-gray-600">
        {t('pagination.pageOf', {
          page: formatNumber(page, i18n.language),
          total: formatNumber(totalPages, i18n.language),
        })}
      </span>
      <Button variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        {t('pagination.next')}
        <ChevronRight className="size-5" aria-hidden="true" />
      </Button>
    </nav>
  );
}
