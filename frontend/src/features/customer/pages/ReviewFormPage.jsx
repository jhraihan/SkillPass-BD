import { zodResolver } from '@hookform/resolvers/zod';
import { Send, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { getErrorMessage } from '@/api/errors';
import { StarRating } from '@/components/domain';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Textarea,
  TileGroup,
  useToast,
} from '@/components/ui';
import { useBooking } from '@/hooks/bookings';
import { useCreateReview } from '@/hooks/reviews';
import { RATING_DIMENSIONS, REVIEWABLE_STATUSES } from '@/lib/constants';
import { localName } from '@/lib/format';
import { applyServerErrors, fieldError } from '@/lib/forms';

const rating = z.number({ error: 'review.errors.rating' }).int().min(1, 'review.errors.rating');

const schema = z.object({
  quality: rating,
  professionalism: rating,
  punctuality: rating,
  communication: rating,
  would_hire_again: z.boolean({ error: 'review.errors.hireAgain' }),
  comment: z.string().trim().max(1000, 'review.errors.comment'),
});

export default function ReviewFormPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation('customer');
  const navigate = useNavigate();
  const toast = useToast();
  const { data: booking, isPending, isError, error, refetch } = useBooking(id);
  const createReview = useCreateReview();
  const backTo = `/customer/bookings/${id}`;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { comment: '' } });

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />;

  if (booking.has_review || !REVIEWABLE_STATUSES.includes(booking.status)) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t('review.title')} backTo={backTo} />
        <EmptyState
          icon={ThumbsUp}
          title={booking.has_review ? t('review.alreadyDone') : t('review.notYet')}
          action={
            <Button as={Link} to={backTo} variant="outline">
              {t('review.backToJob')}
            </Button>
          }
        />
      </div>
    );
  }

  const onSubmit = async (values) => {
    try {
      await createReview.mutateAsync({ booking: booking.id, ...values });
      toast.success(t('review.thanks'));
      navigate(backTo);
    } catch (submitError) {
      applyServerErrors(submitError, setError);
    }
  };

  const serverProblem =
    errors.booking?.message ??
    (createReview.isError &&
      !createReview.error.response?.data?.errors &&
      getErrorMessage(createReview.error, t));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t('review.title')}
        description={t('review.subtitle', {
          name: booking.worker.display_name,
          service: localName(booking.request.category_detail, i18n.language),
        })}
        backTo={backTo}
      />
      {serverProblem && (
        <Alert tone="error" className="mb-4">
          {serverProblem}
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {RATING_DIMENSIONS.map((dimension) => (
            <Controller
              key={dimension}
              name={dimension}
              control={control}
              render={({ field }) => (
                <StarRating
                  label={t(`common:review.dimensions.${dimension}`)}
                  value={field.value ?? 0}
                  onChange={field.onChange}
                  error={fieldError(errors, dimension, t)}
                />
              )}
            />
          ))}

          <Controller
            name="would_hire_again"
            control={control}
            render={({ field }) => (
              <TileGroup
                label={t('review.hireAgain')}
                options={[
                  { value: true, label: t('review.yes'), icon: ThumbsUp },
                  { value: false, label: t('review.no'), icon: ThumbsDown },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={fieldError(errors, 'would_hire_again', t)}
              />
            )}
          />

          <Textarea
            label={t('review.comment')}
            hint={t('review.commentHint')}
            rows={4}
            maxLength={1000}
            error={fieldError(errors, 'comment', t)}
            {...register('comment')}
          />

          <Button type="submit" size="lg" icon={Send} loading={isSubmitting} fullWidth>
            {t('review.submit')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
