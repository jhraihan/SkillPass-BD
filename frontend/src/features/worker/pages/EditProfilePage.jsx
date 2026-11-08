import { FileCheck2, Save, UserCog } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import {
  Avatar,
  Button,
  Card,
  ErrorState,
  FileUpload,
  Input,
  LoadingState,
  Textarea,
  TileGroup,
  useToast,
} from '@/components/ui';
import { VoiceInputButton } from '@/components/domain';
import { useAreas, useCategories, useSkills } from '@/hooks/catalog';
import {
  useMyWorkerProfile,
  useSetMyAreas,
  useSetMySkills,
  useUpdateMyWorkerProfile,
  useUploadMyPhoto,
} from '@/hooks/workers';
import { localName } from '@/lib/format';

function ProfileForm({ profile }) {
  const { t, i18n } = useTranslation('worker');
  const toast = useToast();
  const { data: categories = [] } = useCategories();
  const { data: skills = [] } = useSkills();
  const { data: areas = [] } = useAreas();
  const updateProfile = useUpdateMyWorkerProfile();
  const setSkills = useSetMySkills();
  const setAreas = useSetMyAreas();
  const uploadPhoto = useUploadMyPhoto();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: profile.display_name,
    bio: profile.bio,
    years_experience: profile.years_experience,
    skills: profile.skills.map((s) => s.id),
    areas: profile.service_areas.map((a) => a.id),
    photos: [],
  });

  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const fromEvent = (key) => (event) => set(key)(event.target.value);
  const tiles = (list) =>
    list.map((item) => ({ value: item.id, label: localName(item, i18n.language) }));
  const canSave = form.display_name.trim() && form.skills.length > 0 && form.areas.length > 0;

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        display_name: form.display_name.trim(),
        bio: form.bio,
        years_experience: Number(form.years_experience) || 0,
      });
      await setSkills.mutateAsync(form.skills);
      await setAreas.mutateAsync(form.areas);
      if (form.photos[0]) await uploadPhoto.mutateAsync(form.photos[0]);
      set('photos')([]);
      toast.success(t('edit.saved'));
    } catch (error) {
      toast.error(getErrorMessage(error, t));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy-700">{t('edit.title')}</h1>

      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar src={profile.photo} name={profile.display_name} size="xl" />
          <FileUpload
            label={t('edit.photo')}
            camera
            accept="image/*"
            value={form.photos}
            onChange={set('photos')}
          />
        </div>
        <Input
          label={t('edit.name')}
          value={form.display_name}
          onChange={fromEvent('display_name')}
        />
        <Textarea
          label={t('edit.bio')}
          hint={t('edit.bioHint')}
          maxLength={1000}
          value={form.bio}
          onChange={fromEvent('bio')}
        />
        <VoiceInputButton
          onText={(text) => set('bio')([form.bio, text].filter(Boolean).join(' ').slice(0, 1000))}
        />
        <Input
          label={t('edit.experience')}
          type="number"
          inputMode="numeric"
          min={0}
          max={60}
          value={form.years_experience}
          onChange={fromEvent('years_experience')}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">{t('edit.skills')}</h2>
        {categories.map((category) => (
          <TileGroup
            key={category.slug}
            label={localName(category, i18n.language)}
            multiple
            options={tiles(skills.filter((skill) => skill.category_slug === category.slug))}
            value={form.skills}
            onChange={set('skills')}
          />
        ))}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">{t('edit.areas')}</h2>
        <TileGroup
          multiple
          columns={3}
          options={tiles(areas)}
          value={form.areas}
          onChange={set('areas')}
        />
      </Card>

      <Button size="xl" fullWidth icon={Save} onClick={save} loading={saving} disabled={!canSave}>
        {t('edit.save')}
      </Button>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button as={Link} to="/worker/verification" size="lg" variant="outline" icon={FileCheck2}>
          {t('edit.verification')}
        </Button>
        <Button as={Link} to="/account" size="lg" variant="outline" icon={UserCog}>
          {t('edit.account')}
        </Button>
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  const { t } = useTranslation('worker');
  const { data: profile, isPending, isError, error, refetch } = useMyWorkerProfile();

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />;
  return <ProfileForm profile={profile} />;
}
