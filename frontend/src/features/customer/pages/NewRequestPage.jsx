import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Moon, Sun, Sunrise } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { getErrorMessage } from '@/api/errors';
import {
  Alert,
  Button,
  Card,
  Input,
  PageHeader,
  Select,
  Textarea,
  TileGroup,
} from '@/components/ui';
import { useCreateBooking, useCreateServiceRequest } from '@/hooks/bookings';
import { useAreas, useCategories, useSkills } from '@/hooks/catalog';
import { useWorker } from '@/hooks/workers';
import { iconFor } from '@/lib/categoryIcons';
import { localName } from '@/lib/format';
import { applyServerErrors, fieldError } from '@/lib/forms';

const today = () => new Date().toLocaleDateString('en-CA');
const SLOT_ICONS = { MORNING: Sunrise, AFTERNOON: Sun, EVENING: Moon };

const schema = z.object({
  category: z.number({ error: 'common:errors.required' }),
  skills: z.array(z.number()),
  description: z.string().trim().min(5, 'request.errors.description').max(1000),
  area: z.string().min(1, 'common:errors.required'),
  address_detail: z.string().trim().min(1, 'common:errors.required').max(255),
  preferred_date: z.string().refine((value) => value >= today(), 'request.errors.date'),
  preferred_slot: z.enum(['MORNING', 'AFTERNOON', 'EVENING'], { error: 'common:errors.required' }),
});

export default function NewRequestPage() {
  const { t, i18n } = useTranslation('customer');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const workerId = params.get('worker');
  const { data: worker } = useWorker(workerId);
  const { data: categories = [] } = useCategories();
  const { data: areas = [] } = useAreas();
  const createRequest = useCreateServiceRequest();
  const createBooking = useCreateBooking();

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      skills: [],
      description: '',
      area: '',
      address_detail: '',
      preferred_date: today(),
    },
  });
  const category = useWatch({ control, name: 'category' });
  const categorySlug = categories.find((c) => c.id === category)?.slug;
  const { data: skills = [] } = useSkills({ category: categorySlug });

  const name = (item) => localName(item, i18n.language);
  const tiles = (list) =>
    list.map((item) => ({
      value: item.id,
      label: name(item),
      icon: item.icon && iconFor(item.icon),
    }));

  const onSubmit = async (values) => {
    try {
      const request = await createRequest.mutateAsync({ ...values, area: Number(values.area) });
      if (workerId) {
        const booking = await createBooking.mutateAsync({
          service_request: request.id,
          worker: Number(workerId),
        });
        navigate(`/customer/bookings/${booking.id}`);
      } else {
        navigate(`/customer/requests/${request.id}/matches`);
      }
    } catch (error) {
      applyServerErrors(error, setError);
    }
  };

  const failed = createRequest.error ?? createBooking.error;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t('request.title')}
        description={t('request.subtitle')}
        backTo="/customer"
      />
      {worker && (
        <Alert tone="info" className="mb-4">
          {t('request.forWorker', { name: worker.display_name })}
        </Alert>
      )}
      {failed && !failed.response?.data?.errors && (
        <Alert tone="error" className="mb-4">
          {getErrorMessage(failed, t)}
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
                  setValue('skills', []);
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
          <Textarea
            label={t('request.description')}
            placeholder={t('request.descriptionPlaceholder')}
            maxLength={1000}
            error={fieldError(errors, 'description', t)}
            {...register('description')}
          />
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
            min={today()}
            error={fieldError(errors, 'preferred_date', t)}
            {...register('preferred_date')}
          />
          <Controller
            name="preferred_slot"
            control={control}
            render={({ field }) => (
              <TileGroup
                label={t('request.slot')}
                columns={3}
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
          <Button type="submit" size="lg" fullWidth icon={ArrowRight} loading={isSubmitting}>
            {t('request.submit')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
