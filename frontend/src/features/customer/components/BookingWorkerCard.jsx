import { Banknote, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AvailabilityDot, TrustScorePill } from '@/components/domain';
import { Avatar } from '@/components/ui';
import { formatTaka, localName } from '@/lib/format';

export default function BookingWorkerCard({ worker }) {
  const { t, i18n } = useTranslation('customer');
  const areas = worker.service_areas.map((area) => localName(area, i18n.language)).join(', ');
  const hasVisitCharge = worker.visit_charge !== null && worker.visit_charge !== undefined;

  return (
    <div className="relative mb-4 overflow-hidden rounded-3xl bg-ink-mesh p-5 text-white shadow-xl shadow-ink-900/20">
      <div aria-hidden="true" className="grid-lines absolute inset-0" />
      <div className="relative flex items-start gap-4">
        <Avatar src={worker.photo} name={worker.display_name} size="lg" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm text-white/70">{t('request.bookingWorker')}</p>
          <Link
            to={`/workers/${worker.id}`}
            className="block truncate font-display text-xl font-bold hover:underline"
          >
            {worker.display_name}
          </Link>
          <div className="flex flex-wrap items-center gap-2 [&_*]:text-white/90">
            <AvailabilityDot status={worker.availability_status} />
          </div>
        </div>
        <TrustScorePill score={worker.trust_score} isNew={worker.is_new} />
      </div>
      <div className="relative mt-4 space-y-1.5 text-sm text-white/80">
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden="true" />
          <span>
            {t('request.worksIn')}: {areas}
          </span>
        </p>
        {hasVisitCharge && (
          <p className="flex items-center gap-2">
            <Banknote className="size-4 shrink-0 text-brand-300" aria-hidden="true" />
            {worker.visit_charge === 0
              ? t('common:worker.freeVisit')
              : t('common:worker.visitCharge', {
                  amount: formatTaka(worker.visit_charge, i18n.language),
                })}
          </p>
        )}
      </div>
      <Link
        to="/customer/requests/new"
        className="relative mt-4 inline-flex min-h-11 items-center rounded-2xl bg-white/10 px-4 text-sm font-semibold ring-1 ring-white/20 transition hover:bg-white/20"
      >
        {t('request.change')}
      </Link>
    </div>
  );
}
