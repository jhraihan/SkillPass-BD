import { useTranslation } from 'react-i18next';
import { Card, Input } from '@/components/ui';
import { localName } from '@/lib/format';
import { MAX_PRICE } from '@/lib/pricing';

function PriceInput(props) {
  return <Input type="number" inputMode="numeric" min={0} max={MAX_PRICE} step={50} {...props} />;
}

export default function PriceFields({ skills, value, onChange }) {
  const { t, i18n } = useTranslation('worker');
  const setSkill = (id) => (event) =>
    onChange({ ...value, skills: { ...value.skills, [id]: event.target.value } });

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('edit.prices')}</h2>
        <p className="text-gray-600">{t('edit.pricesHint')}</p>
      </div>
      <PriceInput
        label={t('edit.visitCharge')}
        hint={t('edit.visitChargeHint')}
        value={value.visitCharge}
        onChange={(event) => onChange({ ...value, visitCharge: event.target.value })}
      />
      {skills.length === 0 ? (
        <p className="text-gray-500">{t('edit.noSkills')}</p>
      ) : (
        skills.map((skill) => (
          <PriceInput
            key={skill.id}
            label={t('edit.skillPrice', { skill: localName(skill, i18n.language) })}
            value={value.skills[skill.id] ?? ''}
            onChange={setSkill(skill.id)}
          />
        ))
      )}
    </Card>
  );
}
