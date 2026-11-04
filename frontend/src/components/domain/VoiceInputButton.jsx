import { Mic, MicOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useVoiceTyping } from '@/hooks/assistance';
import { cn } from '@/lib/cn';

export default function VoiceInputButton({ onText, className }) {
  const { t } = useTranslation();
  const { supported, listening, start, stop } = useVoiceTyping(onText);
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      aria-pressed={listening}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-base font-medium',
        listening
          ? 'animate-pulse border-red-300 bg-red-50 text-red-700'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
        className,
      )}
    >
      {listening ? (
        <MicOff className="size-5" aria-hidden="true" />
      ) : (
        <Mic className="size-5" aria-hidden="true" />
      )}
      {t(listening ? 'voice.listening' : 'voice.speak')}
    </button>
  );
}
