import { Moon, Sun, Sunrise } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input, Select, TileGroup } from '@/components/ui';
import { localName, todayIso } from '@/lib/format';
import { fieldError } from '@/lib/forms';

const SLOT_ICONS = { MORNING: Sunrise, AFTERNOON: Sun, EVENING: Moon };

export default function ScheduleFields({ control, register, errors, areas }) {
  const { t, i18n } = useTranslation('customer');
  const name = (item) => localName(item, i18n.language);

  return (
    <>
      <Select
        label={t('request.area')}
        placeholder={t('request.areaPlaceholder')}
        options={areas.map((area) => ({ value: String(area.id), label: name(area) }))}
        error={fieldError(errors, 'area', t)}
        {...register('area')}
      />
      <Input
        label={t('request.address')}
        hint={t('request.addressHint')}
        autoComplete="street-address"
        error={fieldError(errors, 'address_detail', t)}
        {...register('address_detail')}
      />
      <Input
        label={t('request.date')}
        type="date"
        min={todayIso()}
        error={fieldError(errors, 'preferred_date', t)}
        {...register('preferred_date')}
      />
      <Controller
        name="preferred_slot"
        control={control}
        render={({ field }) => (
          <TileGroup
            label={t('request.slot')}
            columns="row3"
            value={field.value}
            onChange={field.onChange}
            error={fieldError(errors, 'preferred_slot', t)}
            options={Object.entries(SLOT_ICONS).map(([slot, icon]) => ({
              value: slot,
              icon,
              label: t(`common:booking.slots.${slot}`),
            }))}
          />
        )}
      />
    </>
  );
}
