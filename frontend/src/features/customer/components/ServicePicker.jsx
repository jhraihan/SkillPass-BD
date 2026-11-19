import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { TileGroup } from '@/components/ui';
import { iconFor } from '@/lib/categoryIcons';
import { localName } from '@/lib/format';
import { fieldError } from '@/lib/forms';

export default function ServicePicker({ control, errors, categories, skills, onCategoryChange }) {
  const { t, i18n } = useTranslation('customer');
  const tiles = (list) =>
    list.map((item) => ({
      value: item.id,
      label: localName(item, i18n.language),
      icon: item.icon && iconFor(item.icon),
    }));

  return (
    <>
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <TileGroup
            label={t('request.category')}
            columns={4}
            options={tiles(categories)}
            value={field.value}
            onChange={(value) => {
              field.onChange(value);
              onCategoryChange();
            }}
            error={fieldError(errors, 'category', t)}
          />
        )}
      />
      {skills.length > 0 && (
        <Controller
          name="skills"
          control={control}
          render={({ field }) => (
            <TileGroup
              label={t('request.skills')}
              multiple
              options={tiles(skills)}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      )}
    </>
  );
}
