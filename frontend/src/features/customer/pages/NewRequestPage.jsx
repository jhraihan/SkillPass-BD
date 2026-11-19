import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Send } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { getErrorMessage } from '@/api/errors';
import {
  Alert,
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Textarea,
  TileGroup,
} from '@/components/ui';
import { useCreateServiceRequest } from '@/hooks/bookings';
import { useAreas, useCategories, useSkills } from '@/hooks/catalog';
import { useWorker } from '@/hooks/workers';
import { todayIso } from '@/lib/format';
import { applyServerErrors, fieldError, formLevelError } from '@/lib/forms';
import BookingWorkerCard from '../components/BookingWorkerCard';
import ScheduleFields from '../components/ScheduleFields';
import ServicePicker from '../components/ServicePicker';
import WorkerUnavailable from '../components/WorkerUnavailable';

const schema = z.object({
  category: z.number({ error: 'common:errors.required' }),
  skills: z.array(z.number()),
  description: z.string().trim().min(5, 'request.errors.description').max(1000),
  area: z.string().min(1, 'common:errors.required'),
  address_detail: z.string().trim().min(1, 'common:errors.required').max(255),
  preferred_date: z.string().refine((value) => value >= todayIso(), 'request.errors.date'),
  preferred_slot: z.enum(['MORNING', 'AFTERNOON', 'EVENING'], { error: 'common:errors.required' }),
});
const FIELDS = Object.keys(schema.shape);

function isBookable(worker) {
  return (
    worker.availability_status !== 'OFFLINE' &&
    worker.skills.length > 0 &&
    worker.service_areas.length > 0
  );
}

export default function NewRequestPage() {
  const { t } = useTranslation('customer');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const workerId = params.get('worker');
  const workerQuery = useWorker(workerId);
  const worker = workerId ? workerQuery.data : null;
  const { data: allCategories = [] } = useCategories();
  const { data: allAreas = [] } = useAreas();
  const createRequest = useCreateServiceRequest();

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
      preferred_date: todayIso(),
    },
  });
  const category = useWatch({ control, name: 'category' });

  const offered = new Set(worker?.skills.map((skill) => skill.category_slug));
  const categories = worker ? allCategories.filter((c) => offered.has(c.slug)) : allCategories;
  const areas = worker ? worker.service_areas : allAreas;
  const categorySlug = categories.find((c) => c.id === category)?.slug;
  const { data: catalogSkills = [] } = useSkills({ category: categorySlug });
  const skills = !categorySlug
    ? []
    : worker
      ? worker.skills.filter((s) => s.category_slug === categorySlug)
      : catalogSkills;

  const onlyCategory = categories.length === 1 ? categories[0].id : null;
  const onlyArea = areas.length === 1 ? String(areas[0].id) : null;
  useEffect(() => {
    if (onlyCategory !== null && category === undefined) setValue('category', onlyCategory);
  }, [onlyCategory, category, setValue]);
  useEffect(() => {
    if (onlyArea !== null) setValue('area', onlyArea);
  }, [onlyArea, setValue]);

  const onSubmit = async (values) => {
    try {
      const request = await createRequest.mutateAsync({
        ...values,
        area: Number(values.area),
        ...(workerId ? { worker: Number(workerId) } : {}),
      });
      navigate(
        request.active_booking
          ? `/customer/bookings/${request.active_booking}`
          : `/customer/requests/${request.id}/matches`,
      );
    } catch (error) {
      applyServerErrors(error, setError);
    }
  };

  if (workerId && workerQuery.isPending) return <LoadingState />;
  if (workerId && workerQuery.isError) {
    return (
      <ErrorState message={getErrorMessage(workerQuery.error, t)} onRetry={workerQuery.refetch} />
    );
  }
  if (worker && !isBookable(worker)) return <WorkerUnavailable worker={worker} />;

  const formError = createRequest.error?.response?.data?.errors?.worker
    ? t('request.workerUnavailable')
    : formLevelError(createRequest.error, FIELDS, t);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t('request.title')}
        description={t('request.subtitle')}
        backTo={worker ? `/workers/${worker.id}` : '/customer'}
      />
      {worker && <BookingWorkerCard worker={worker} />}
      {formError && (
        <Alert tone="error" className="mb-4">
          {formError}
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <ServicePicker
            control={control}
            errors={errors}
            categories={categories}
            skills={skills}
            onCategoryChange={() => setValue('skills', [])}
          />
          <Textarea
            label={t('request.description')}
            placeholder={t('request.descriptionPlaceholder')}
            maxLength={1000}
            error={fieldError(errors, 'description', t)}
            {...register('description')}
          />
          <ScheduleFields control={control} register={register} errors={errors} areas={areas} />
          <Button
            type="submit"
            size="lg"
            fullWidth
            icon={worker ? Send : ArrowRight}
            loading={isSubmitting}
          >
            {worker ? t('request.submitBook') : t('request.submit')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
