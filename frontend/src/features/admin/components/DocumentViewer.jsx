import { ExternalLink, FileText, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ErrorState, Spinner } from '@/components/ui';
import { useDocumentUrl } from '@/hooks/verification';
import { formatNumber } from '@/lib/format';

export default function DocumentViewer({ document }) {
  const { t, i18n } = useTranslation('admin');
  const { url, isPending, isError, refetch } = useDocumentUrl(document.id);
  const [turns, setTurns] = useState(0);
  const isPdf = document.content_type === 'application/pdf';
  const sizeKb = formatNumber(Math.ceil(document.size / 1024), i18n.language);

  return (
    <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex min-h-72 items-center justify-center bg-gray-100 p-3">
        {isPending && <Spinner />}
        {isError && <ErrorState message={t('documents.loadFailed')} onRetry={refetch} />}
        {url && isPdf && (
          <object data={url} type="application/pdf" className="h-[32rem] w-full rounded-lg">
            <div className="flex flex-col items-center gap-2 py-10 text-gray-600">
              <FileText className="size-10" aria-hidden="true" />
              {t('documents.noPreview')}
            </div>
          </object>
        )}
        {url && !isPdf && (
          <img
            src={url}
            alt={document.original_name}
            className="max-h-[32rem] max-w-full rounded-lg object-contain transition-transform"
            style={{ transform: `rotate(${turns * 90}deg)` }}
          />
        )}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <span className="min-w-0 truncate text-sm text-gray-700">
          {document.original_name} · {t('documents.size', { size: sizeKb })}
        </span>
        <span className="flex gap-1">
          {!isPdf && (
            <Button
              size="sm"
              variant="ghost"
              icon={RotateCw}
              onClick={() => setTurns((value) => (value + 1) % 4)}
              disabled={!url}
            >
              {t('documents.rotate')}
            </Button>
          )}
          <Button
            as="a"
            href={url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="ghost"
            icon={ExternalLink}
            disabled={!url}
          >
            {t('documents.open')}
          </Button>
        </span>
      </figcaption>
    </figure>
  );
}
