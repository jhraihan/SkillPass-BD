import {
  BadgeCheck,
  CircleCheckBig,
  HandCoins,
  MessageCircle,
  Phone,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/api/errors';
import { ReadAloudButton } from '@/components/domain';
import { Button, Card, ErrorState, LoadingState } from '@/components/ui';
import { useScreenVoice } from '@/hooks/assistance';
import { useSupportContacts } from '@/hooks/notifications';
import { TUTORIAL_VIDEO_URL } from '@/lib/config';
import { videoSource } from '@/lib/video';

const QUESTIONS = [
  { key: 'accept', icon: CircleCheckBig },
  { key: 'finish', icon: Wrench },
  { key: 'payment', icon: HandCoins },
  { key: 'trust', icon: ShieldCheck },
  { key: 'verify', icon: BadgeCheck },
];

function Question({ id, icon: Icon }) {
  const { t } = useTranslation('worker');
  const question = t(`help.questions.${id}.q`);
  const answer = t(`help.questions.${id}.a`);

  return (
    <Card className="flex gap-4">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50">
        <Icon className="size-8 text-brand-700" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-xl font-semibold text-gray-900">{question}</h3>
        <p className="text-gray-700">{answer}</p>
      </div>
      <ReadAloudButton text={`${question} ${answer}`} size="lg" />
    </Card>
  );
}

function TutorialVideo() {
  const { t } = useTranslation('worker');
  const video = videoSource(TUTORIAL_VIDEO_URL);
  if (!video) return null;

  return (
    <Card className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-900">{t('help.videoTitle')}</h2>
      <div className="aspect-video overflow-hidden rounded-xl bg-gray-900">
        {video.kind === 'embed' ? (
          <iframe
            src={video.src}
            title={t('help.videoTitle')}
            className="size-full"
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video src={video.src} controls preload="metadata" className="size-full" />
        )}
      </div>
    </Card>
  );
}

export default function HelpPage() {
  const { t } = useTranslation('worker');
  const { data: support, isPending, isError, error, refetch } = useSupportContacts();
  useScreenVoice(t('voice.help'));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy-700">{t('help.title')}</h1>

      <Card className="space-y-3">
        {isPending && <LoadingState />}
        {isError && <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />}
        {support && (
          <>
            <Button as="a" href={`tel:${support.phone}`} size="xl" icon={Phone} fullWidth>
              {t('help.call')}
            </Button>
            <Button
              as="a"
              href={`https://wa.me/${support.whatsapp}?text=${encodeURIComponent(t('help.whatsappText'))}`}
              target="_blank"
              rel="noopener noreferrer"
              size="xl"
              variant="outline"
              icon={MessageCircle}
              fullWidth
            >
              {t('help.whatsapp')}
            </Button>
            <p className="text-center text-gray-600">{t('help.hours', { hours: support.hours })}</p>
          </>
        )}
      </Card>

      <TutorialVideo />

      <h2 className="text-xl font-semibold text-gray-900">{t('help.questionsTitle')}</h2>
      {QUESTIONS.map(({ key, icon }) => (
        <Question key={key} id={key} icon={icon} />
      ))}
    </div>
  );
}
