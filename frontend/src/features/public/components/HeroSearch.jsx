import { Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, Select } from '@/components/ui';
import { useAreas, useCategories } from '@/hooks/catalog';
import { localName } from '@/lib/format';

export default function HeroSearch() {
  const { t, i18n } = useTranslation('public');
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [area, setArea] = useState('');
  const { data: categories = [] } = useCategories();
  const { data: areas = [] } = useAreas();

  const toOptions = (list, emptyLabel) => [
    { value: '', label: emptyLabel },
    ...list.map((item) => ({ value: item.slug, label: localName(item, i18n.language) })),
  ];

  const onSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (area) params.set('area', area);
    navigate(`/workers${params.size ? `?${params}` : ''}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-2xl bg-white p-4 shadow-lg sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <Select
        label={t('landing.service')}
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        options={toOptions(categories, t('landing.anyService'))}
      />
      <Select
        label={t('landing.area')}
        value={area}
        onChange={(event) => setArea(event.target.value)}
        options={toOptions(areas, t('landing.anyArea'))}
      />
      <Button type="submit" size="lg" icon={Search}>
        {t('landing.search')}
      </Button>
    </form>
  );
}
