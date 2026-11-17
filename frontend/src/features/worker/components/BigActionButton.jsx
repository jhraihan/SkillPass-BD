import { CheckCircle2, Navigation, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

const NEXT_STEPS = [
  { action: 'on-the-way', icon: Navigation },
  { action: 'start', icon: Wrench },
  { action: 'mark-complete', icon: CheckCircle2 },
];

function nextStepFor(booking) {
  return NEXT_STEPS.find((step) => booking.allowed_actions.includes(step.action)) ?? null;
}

export default function BigActionButton({ booking, onPress, loading }) {
  const { t } = useTranslation('worker');
  const step = nextStepFor(booking);
  if (!step) return null;

  return (
    <Button
      size="xl"
      fullWidth
      icon={step.icon}
      loading={loading}
      onClick={() => onPress(step.action)}
      className="min-h-16 text-2xl"
    >
      {t(`active.next.${step.action}`)}
    </Button>
  );
}
