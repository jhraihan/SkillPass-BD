import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { getErrorMessage } from '@/api/errors';
import { Alert, Button, Checkbox, Input, Select, useToast } from '@/components/ui';
import { useCategories, useDistricts, useSaveCatalogItem } from '@/hooks/catalog';
import { localName } from '@/lib/format';
import { applyServerErrors, fieldError } from '@/lib/forms';

const schema = z.object({
  name_en: z.string().trim().min(1, 'common:errors.required').max(100),
  name_bn: z.string().trim().min(1, 'common:errors.required').max(100),
  slug: z.string().regex(/^[a-z0-9-]*$/, 'catalog.errors.slug'),
  icon: z.string().optional(),
  category: z.string().optional(),
  district: z.string().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean(),
});

function defaultsFor(item) {
  return {
    name_en: item?.name_en ?? '',
    name_bn: item?.name_bn ?? '',
    slug: item?.slug ?? '',
    icon: item?.icon ?? '',
    category: item?.category ? String(item.category) : '',
    district: item?.district ? String(item.district) : '',
    sort_order: item?.sort_order ?? 0,
    is_active: item?.is_active ?? true,
  };
}

function payloadFor(resource, { icon, category, district, sort_order, ...common }) {
  if (resource === 'categories') return { ...common, icon, sort_order };
  if (resource === 'skills') return { ...common, category: Number(category), sort_order };
  return { ...common, district: Number(district) };
}

export default function CatalogForm({ resource, item, onDone }) {
  const { t, i18n } = useTranslation('admin');
  const toast = useToast();
  const save = useSaveCatalogItem(resource);
  const { data: categories = [] } = useCategories({ includeInactive: true });
  const { data: districts = [] } = useDistricts();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: defaultsFor(item) });

  const onSubmit = (values) => {
    if (resource === 'skills' && !values.category) {
      return setError('category', { message: 'common:errors.required' });
    }
    if (resource === 'areas' && !values.district) {
      return setError('district', { message: 'common:errors.required' });
    }
    return save.mutate(
      { id: item?.id, ...payloadFor(resource, values) },
      {
        onSuccess: () => {
          toast.success(t('catalog.saved'));
          onDone();
        },
        onError: (error) => applyServerErrors(error, setError),
      },
    );
  };

  const toOptions = (list) =>
    list.map((entry) => ({ value: String(entry.id), label: localName(entry, i18n.language) }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {save.isError && !save.error?.response?.data?.errors && (
        <Alert tone="error">{getErrorMessage(save.error, t)}</Alert>
      )}
      <Input
        label={t('catalog.form.nameBn')}
        lang="bn"
        error={fieldError(errors, 'name_bn', t)}
        {...register('name_bn')}
      />
      <Input
        label={t('catalog.form.nameEn')}
        lang="en"
        error={fieldError(errors, 'name_en', t)}
        {...register('name_en')}
      />
      {resource === 'skills' && (
        <Select
          label={t('catalog.form.category')}
          placeholder={t('catalog.form.categoryPlaceholder')}
          options={toOptions(categories)}
          error={fieldError(errors, 'category', t)}
          {...register('category')}
        />
      )}
      {resource === 'areas' && (
        <Select
          label={t('catalog.form.district')}
          placeholder={t('catalog.form.districtPlaceholder')}
          options={toOptions(districts)}
          error={fieldError(errors, 'district', t)}
          {...register('district')}
        />
      )}
      {resource === 'categories' && (
        <Input
          label={t('catalog.form.icon')}
          hint={t('catalog.form.iconHint')}
          {...register('icon')}
        />
      )}
      <Input
        label={t('catalog.form.slug')}
        hint={t('catalog.form.slugHint')}
        error={fieldError(errors, 'slug', t)}
        {...register('slug')}
      />
      {resource !== 'areas' && (
        <Input
          label={t('catalog.form.sortOrder')}
          type="number"
          min={0}
          error={fieldError(errors, 'sort_order', t)}
          {...register('sort_order')}
        />
      )}
      <Checkbox label={t('catalog.form.active')} {...register('is_active')} />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onDone}>
          {t('catalog.form.cancel')}
        </Button>
        <Button type="submit" loading={save.isPending}>
          {t('catalog.form.save')}
        </Button>
      </div>
    </form>
  );
}
