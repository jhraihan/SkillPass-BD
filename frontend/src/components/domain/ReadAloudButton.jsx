import { Square, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReadAloud } from '@/hooks/assistance';
import { cn } from '@/lib/cn';

const SIZES = { md: 'size-11', lg: 'size-14' };

export default function ReadAloudButton({ text, audioSrc, size = 'md', className }) {
  const { t } = useTranslation();
  const { supported, speaking, read, stop } = useReadAloud();
  if ((!supported && !audioSrc) || (!text && !audioSrc)) return null;

  return (
    <button
      type="button"
      onClick={() => (speaking ? stop() : read(text, audioSrc))}
      aria-label={t(speaking ? 'voice.stop' : 'voice.listen')}
      aria-pressed={speaking}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100',
        speaking && 'bg-brand-600 text-white hover:bg-brand-700',
        SIZES[size],
        className,
      )}
    >
      {speaking ? (
        <Square className="size-5" aria-hidden="true" />
      ) : (
        <Volume2 className="size-6" aria-hidden="true" />
      )}
    </button>
  );
}
