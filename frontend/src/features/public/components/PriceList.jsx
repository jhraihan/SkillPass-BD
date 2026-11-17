import { useTranslation } from 'react-i18next';
import { formatTaka, localName } from '@/lib/format';

function hasValue(value) {
  return value !== null && value !== undefined;
}

function PriceRow({ label, amount }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="text-gray-800">{label}</span>
      <span className="font-semibold text-gray-900">{amount}</span>
    </li>
  );
}

export default function PriceList({ worker }) {
  const { t, i18n } = useTranslation('public');
  const taka = (value) => formatTaka(value, i18n.language);
  const priced = worker.skills.filter((skill) => hasValue(skill.starting_price));

  if (!hasValue(worker.visit_charge) && priced.length === 0) {
    return <p className="text-gray-500">{t('profile.noPrices')}</p>;
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-gray-100">
        {hasValue(worker.visit_charge) && (
          <PriceRow
            label={
              worker.visit_charge === 0
                ? t('common:worker.freeVisit')
                : t('common:worker.visitChargeLabel')
            }
            amount={worker.visit_charge === 0 ? '' : taka(worker.visit_charge)}
          />
        )}
        {priced.map((skill) => (
          <PriceRow
            key={skill.id}
            label={localName(skill, i18n.language)}
            amount={t('common:worker.fromPrice', { amount: taka(skill.starting_price) })}
          />
        ))}
      </ul>
      <p className="text-sm text-gray-500">{t('profile.pricesHint')}</p>
    </div>
  );
}
