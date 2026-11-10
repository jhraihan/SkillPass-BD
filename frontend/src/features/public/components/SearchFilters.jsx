import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Input, Select } from '@/components/ui';
import { useAreas, useCategories, useSkills } from '@/hooks/catalog';
import { localName } from '@/lib/format';

const ORDERINGS = ['-trust_score', '-avg_rating', '-verified_jobs_count', '-years_experience'];
const TRUST_LEVELS = [50, 70, 80];

export default function SearchFilters({ values, onChange, onClear }) {
  const { t, i18n } = useTranslation('public');
  const { data: categories = [] } = useCategories();
  const { data: skills = [] } = useSkills({ category: values.category || undefined });
  const { data: areas = [] } = useAreas();

  const set = (name) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    onChange({ ...values, [name]: value, ...(name === 'category' ? { skill: '' } : {}) });
  };

  const toOptions = (list, emptyLabel) => [
    { value: '', label: emptyLabel },
    ...list.map((item) => ({ value: item.slug, label: localName(item, i18n.language) })),
  ];

  return (
    <div className="space-y-4">
      <Input
        label={t('search.filters.search')}
        type="search"
        value={values.search}
        onChange={set('search')}
      />
      <Select
        label={t('search.filters.category')}
        value={values.category}
        onChange={set('category')}
        options={toOptions(categories, t('landing.anyService'))}
      />
      <Select
        label={t('search.filters.skill')}
        value={values.skill}
        onChange={set('skill')}
        options={toOptions(skills, t('search.filters.anySkill'))}
      />
      <Select
        label={t('search.filters.area')}
        value={values.area}
        onChange={set('area')}
        options={toOptions(areas, t('landing.anyArea'))}
      />
      <Select
        label={t('search.filters.minTrust')}
        value={values.min_trust}
        onChange={set('min_trust')}
        options={[
          { value: '', label: t('search.filters.anyTrust') },
          ...TRUST_LEVELS.map((level) => ({ value: String(level), label: `${level}+` })),
        ]}
      />
      <Select
        label={t('search.filters.ordering')}
        value={values.ordering}
        onChange={set('ordering')}
        options={ORDERINGS.map((key) => ({ value: key, label: t(`search.ordering.${key}`) }))}
      />
      <Checkbox
        label={t('search.filters.verified')}
        checked={values.verified}
        onChange={set('verified')}
      />
      <Checkbox
        label={t('search.filters.available')}
        checked={values.available}
        onChange={set('available')}
      />
      <Button variant="ghost" icon={X} onClick={onClear} fullWidth>
        {t('search.filters.clear')}
      </Button>
    </div>
  );
}
