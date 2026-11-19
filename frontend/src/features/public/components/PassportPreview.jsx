import { BadgeCheck, MessageSquareQuote, PlusCircle, ShieldCheck } from 'lucide-react';
import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/lib/format';

const SAMPLE = { score: 92, jobs: 28, rating: 4.8, years: 9 };
const RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RADIUS;
const MAX_TILT = 8;

function ScoreRing({ score, label, language }) {
  const gradientId = useId();
  return (
    <div className="relative size-32 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#34cc9c" />
            <stop offset="0.5" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="rgb(255 255 255 / 0.12)"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - score / 100)}
          className="animate-ring [animation-delay:500ms]"
          style={{ '--ring-length': RING_LENGTH }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold">{formatNumber(score, language)}</span>
        <span className="text-xs text-white/60">{label}</span>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3 text-center ring-1 ring-white/10">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-white/60">{label}</p>
    </div>
  );
}

export default function PassportPreview() {
  const { t, i18n } = useTranslation('public');
  const ref = useRef(null);
  const n = (value) => formatNumber(value, i18n.language);

  const tilt = (event) => {
    const box = ref.current.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateX(${-y * MAX_TILT}deg) rotateY(${x * MAX_TILT}deg)`;
  };
  const reset = () => {
    ref.current.style.transform = '';
  };

  return (
    <div className="relative mx-auto max-w-sm py-6">
      <div
        ref={ref}
        onPointerMove={tilt}
        onPointerLeave={reset}
        className="glass-dark relative space-y-6 rounded-[2rem] p-6 shadow-2xl shadow-black/40 transition-transform duration-300 ease-out"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            <ShieldCheck className="size-4 text-brand-300" aria-hidden="true" />
            {t('landing.passport.label')}
          </span>
          <span
            className="size-2.5 animate-pulse-soft rounded-full bg-brand-400"
            aria-hidden="true"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-brand-400 to-accent-500 font-display text-xl font-bold">
            {t('landing.passport.name').slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold">{t('landing.passport.name')}</p>
            <p className="text-sm text-white/65">{t('landing.passport.role')}</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <ScoreRing
            score={SAMPLE.score}
            label={t('landing.passport.trust')}
            language={i18n.language}
          />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-400/15 px-3 py-1.5 text-sm font-semibold text-brand-200 ring-1 ring-brand-300/30">
            <BadgeCheck className="size-4" aria-hidden="true" />
            {t('landing.passport.idVerified')}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat value={n(SAMPLE.jobs)} label={t('landing.passport.jobs')} />
          <Stat value={n(SAMPLE.rating)} label={t('landing.passport.rating')} />
          <Stat value={n(SAMPLE.years)} label={t('landing.passport.years')} />
        </div>
      </div>
      <span className="glass absolute -top-1 -right-2 inline-flex animate-float items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-semibold text-brand-800 shadow-xl sm:-right-8">
        <PlusCircle className="size-4" aria-hidden="true" />
        {t('landing.passport.newJob')}
      </span>
      <span className="glass absolute -bottom-1 -left-2 inline-flex animate-float items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-semibold text-ink-900 shadow-xl [animation-delay:-3.5s] sm:-left-8">
        <MessageSquareQuote className="size-4 text-accent-600" aria-hidden="true" />
        {t('landing.passport.review')}
      </span>
    </div>
  );
}
