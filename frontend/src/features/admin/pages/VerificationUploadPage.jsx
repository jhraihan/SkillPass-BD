import { IdCard, Send, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/api/errors';
import {
  Alert,
  Button,
  Card,
  ErrorState,
  FileUpload,
  LoadingState,
  PageHeader,
  TileGroup,
  useToast,
} from '@/components/ui';
import { useSubmitVerification, useVerifications } from '@/hooks/verification';
import { useMyWorkerProfile } from '@/hooks/workers';
import { DOCUMENT_RULES } from '@/lib/constants';
import { localName } from '@/lib/format';
import VerificationHistory from '../components/VerificationHistory';

export default function VerificationUploadPage() {
  const { t, i18n } = useTranslation('admin');
  const toast = useToast();
  const profile = useMyWorkerProfile();
  const history = useVerifications();
  const submit = useSubmitVerification();
  const [type, setType] = useState(null);
  const [skill, setSkill] = useState(null);
  const [files, setFiles] = useState([]);
  const [problem, setProblem] = useState(null);

  if (profile.isPending || history.isPending) return <LoadingState />;
  if (profile.isError || history.isError) {
    const failed = profile.error ?? history.error;
    return <ErrorState message={getErrorMessage(failed, t)} onRetry={() => profile.refetch()} />;
  }

  const me = profile.data;
  const pending = history.data.results.filter((item) => item.status === 'PENDING');
  const identityWaiting = pending.some((item) => item.type === 'IDENTITY');
  const openSkills = me.skills.filter(
    (s) => !s.evidence_verified && !pending.some((item) => item.skill?.id === s.id),
  );
  const typeOptions = [
    !me.identity_verified &&
      !identityWaiting && { value: 'IDENTITY', label: t('upload.identity'), icon: IdCard },
    openSkills.length > 0 && { value: 'SKILL_EVIDENCE', label: t('upload.skill'), icon: Wrench },
  ].filter(Boolean);
  const ready = type && files.length > 0 && (type === 'IDENTITY' || skill);

  const choose = (value) => {
    setType(value);
    setSkill(null);
    setProblem(null);
  };

  const send = () => {
    if (files.length > DOCUMENT_RULES.maxFiles) {
      setProblem(t('upload.tooMany', { count: DOCUMENT_RULES.maxFiles }));
      return;
    }
    submit.mutate(
      { type, skill, files },
      {
        onSuccess: () => {
          toast.success(t('upload.sent'));
          setType(null);
          setSkill(null);
          setFiles([]);
          setProblem(null);
        },
        onError: (error) => setProblem(getErrorMessage(error, t)),
      },
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t('upload.title')} backTo="/worker" className="mb-2" />

      {me.identity_verified && <Alert tone="success">{t('upload.identityDone')}</Alert>}

      {typeOptions.length === 0 ? (
        <Alert tone="info">{t('upload.nothingToSend')}</Alert>
      ) : (
        <Card className="space-y-5">
          <TileGroup
            label={t('upload.whatToSend')}
            options={typeOptions}
            value={type}
            onChange={choose}
          />

          {type === 'SKILL_EVIDENCE' && (
            <TileGroup
              label={t('upload.whichSkill')}
              options={openSkills.map((s) => ({ value: s.id, label: localName(s, i18n.language) }))}
              value={skill}
              onChange={setSkill}
            />
          )}

          {type && (
            <FileUpload
              label={t('upload.photos')}
              hint={t(`upload.hint.${type}`, { max: DOCUMENT_RULES.maxSizeMB })}
              value={files}
              onChange={setFiles}
              accept={DOCUMENT_RULES.accept}
              maxSizeMB={DOCUMENT_RULES.maxSizeMB}
              multiple
              camera
            />
          )}

          {problem && <Alert tone="error">{problem}</Alert>}

          <Button
            size="xl"
            fullWidth
            icon={Send}
            disabled={!ready}
            loading={submit.isPending}
            onClick={send}
          >
            {t('upload.send')}
          </Button>
        </Card>
      )}

      <VerificationHistory items={history.data.results} />
    </div>
  );
}
