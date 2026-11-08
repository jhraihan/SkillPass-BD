import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import { iconFor } from '@/lib/categoryIcons';
import {
  Button,
  ErrorState,
  FileUpload,
  Input,
  LoadingState,
  TileGroup,
  useToast,
} from '@/components/ui';
import { useAreas, useCategories, useSkills } from '@/hooks/catalog';
import {
  useMyWorkerProfile,
  useSetMyAreas,
  useSetMySkills,
  useUpdateMyWorkerProfile,
  useUploadMyPhoto,
} from '@/hooks/workers';
import { formatNumber, localName } from '@/lib/format';
import WizardStep from '../components/WizardStep';

const STEPS = ['name', 'categories', 'skills', 'experience', 'areas', 'photo'];

function draftFrom(profile) {
  return {
    name: profile.display_name,
    categories: profile.categories.map((c) => c.slug),
    skills: profile.skills.map((s) => s.id),
    years: profile.years_experience,
    areas: profile.service_areas.map((a) => a.id),
    photos: [],
  };
}

function Wizard({ profile }) {
  const { t, i18n } = useTranslation('worker');
  const navigate = useNavigate();
  const toast = useToast();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(() => draftFrom(profile));
  const { data: categories = [] } = useCategories();
  const { data: skills = [] } = useSkills();
  const { data: areas = [] } = useAreas();
  const updateProfile = useUpdateMyWorkerProfile();
  const setSkills = useSetMySkills();
  const setAreas = useSetMyAreas();
  const uploadPhoto = useUploadMyPhoto();
  const [saving, setSaving] = useState(false);

  const step = STEPS[stepIndex];
  const set = (key) => (value) => setDraft((current) => ({ ...current, [key]: value }));
  const name = (item) => localName(item, i18n.language);
  const tiles = (list, valueKey = 'id') =>
    list.map((item) => ({
      value: item[valueKey],
      label: name(item),
      icon: item.icon && iconFor(item.icon),
    }));

  const missing = {
    name: !draft.name.trim(),
    categories: draft.categories.length === 0,
    skills: draft.skills.length === 0,
    areas: draft.areas.length === 0,
  }[step];

  const finish = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        display_name: draft.name.trim(),
        years_experience: draft.years,
        availability_status: 'AVAILABLE',
      });
      await setSkills.mutateAsync(draft.skills);
      await setAreas.mutateAsync(draft.areas);
      if (draft.photos[0]) await uploadPhoto.mutateAsync(draft.photos[0]);
      toast.success(t('wizard.saved'));
      navigate('/worker', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setSaving(false);
    }
  };

  const next = () => (stepIndex === STEPS.length - 1 ? finish() : setStepIndex(stepIndex + 1));
  const visibleSkills = skills.filter((skill) => draft.categories.includes(skill.category_slug));

  const content = {
    name: (
      <Input
        label={t('wizard.name.label')}
        value={draft.name}
        onChange={(e) => set('name')(e.target.value)}
        inputClassName="text-xl"
      />
    ),
    categories: (
      <TileGroup
        multiple
        options={tiles(categories, 'slug')}
        value={draft.categories}
        onChange={set('categories')}
      />
    ),
    skills: (
      <TileGroup
        multiple
        options={tiles(visibleSkills)}
        value={draft.skills}
        onChange={set('skills')}
      />
    ),
    experience: (
      <div className="flex items-center justify-center gap-6 py-6">
        <Button
          size="xl"
          variant="outline"
          icon={Minus}
          aria-label={t('wizard.experience.less')}
          onClick={() => set('years')(Math.max(0, draft.years - 1))}
        />
        <p className="min-w-24 text-center text-5xl font-bold text-navy-700">
          {formatNumber(draft.years, i18n.language)}
          <span className="block text-lg font-normal text-gray-600">
            {t('wizard.experience.years')}
          </span>
        </p>
        <Button
          size="xl"
          variant="outline"
          icon={Plus}
          aria-label={t('wizard.experience.more')}
          onClick={() => set('years')(Math.min(60, draft.years + 1))}
        />
      </div>
    ),
    areas: (
      <TileGroup
        multiple
        columns={3}
        options={tiles(areas)}
        value={draft.areas}
        onChange={set('areas')}
      />
    ),
    photo: <FileUpload camera accept="image/*" value={draft.photos} onChange={set('photos')} />,
  }[step];

  return (
    <WizardStep
      current={stepIndex + 1}
      total={STEPS.length}
      title={t(`wizard.${step}.title`)}
      hint={i18n.exists(`worker:wizard.${step}.hint`) ? t(`wizard.${step}.hint`) : null}
      onBack={() => setStepIndex(stepIndex - 1)}
      onNext={next}
      nextDisabled={missing}
      loading={saving}
      extraAction={
        step === 'photo' &&
        draft.photos.length === 0 && (
          <Button size="lg" variant="outline" fullWidth onClick={finish} disabled={saving}>
            {t('wizard.skip')}
          </Button>
        )
      }
    >
      {content}
    </WizardStep>
  );
}

export default function ProfileWizardPage() {
  const { t } = useTranslation('worker');
  const { data: profile, isPending, isError, error, refetch } = useMyWorkerProfile();

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />;
  return <Wizard profile={profile} />;
}
