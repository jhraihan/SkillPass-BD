// Reference form page — copy this pattern for any page with a form.
// Route: /_examples/new (dev only)   Data: useCreateExampleItem
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Siren, Snowflake } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { getErrorMessage } from '@/api/errors';
import { StarRating } from '@/components/domain';
import { Button, Card, Input, PageHeader, Select, Textarea, TileGroup, useToast } from '@/components/ui';
import { useCreateExampleItem } from '@/hooks/examples';
import { applyServerErrors, fieldError } from '@/lib/forms';

// Messages are translation keys; fieldError() translates them.
const schema = z.object({
  title: z.string().trim().min(3, 'examples.errors.titleMin'),
  category: z.string().min(1, 'errors.required'),
  urgency: z.enum(['low', 'normal', 'urgent'], { error: 'errors.required' }),
  rating: z.number().min(1, 'examples.errors.ratingMin'),
  notes: z.string().max(500).optional(),
});

export default function ExampleFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const createItem = useCreateExampleItem();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', category: '', urgency: undefined, rating: 0, notes: '' },
  });

  const onSubmit = (values) =>
    createItem.mutate(values, {
      onSuccess: () => {
        toast.success(t('examples.saved'));
        navigate('/_examples');
      },
      onError: (error) => {
        if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error, t));
      },
    });

  const categoryOptions = ['ac', 'plumbing', 'electrical'].map((value) => ({
    value,
    label: t(`examples.categories.${value}`),
  }));

  const urgencyOptions = [
    { value: 'low', label: t('examples.urgency.low'), icon: Snowflake },
    { value: 'normal', label: t('examples.urgency.normal'), icon: Clock },
    { value: 'urgent', label: t('examples.urgency.urgent'), icon: Siren },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <PageHeader
        title={t('examples.formTitle')}
        description={t('examples.formDescription')}
        backTo="/_examples"
      />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Input
            label={t('examples.fields.title')}
            hint={t('examples.fields.titleHint')}
            error={fieldError(errors, 'title', t)}
            required
            {...register('title')}
          />

          <Select
            label={t('examples.fields.category')}
            placeholder={t('examples.fields.categoryPlaceholder')}
            options={categoryOptions}
            error={fieldError(errors, 'category', t)}
            required
            {...register('category')}
          />

          <Controller
            name="urgency"
            control={control}
            render={({ field }) => (
              <TileGroup
                label={t('examples.fields.urgency')}
                options={urgencyOptions}
                value={field.value}
                onChange={field.onChange}
                columns={3}
                error={fieldError(errors, 'urgency', t)}
              />
            )}
          />

          <Controller
            name="rating"
            control={control}
            render={({ field }) => (
              <StarRating
                label={t('examples.fields.rating')}
                value={field.value}
                onChange={field.onChange}
                error={fieldError(errors, 'rating', t)}
              />
            )}
          />

          <Textarea label={t('examples.fields.notes')} maxLength={500} {...register('notes')} />

          <Button type="submit" size="lg" fullWidth loading={createItem.isPending}>
            {t('actions.save')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
