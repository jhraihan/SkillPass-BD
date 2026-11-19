import { BadgeCheck, BriefcaseBusiness, ShieldCheck } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import HeroSearch from './HeroSearch';
import PassportPreview from './PassportPreview';

const HIGHLIGHTS = [
  { key: 'identity', icon: BadgeCheck },
  { key: 'jobs', icon: BriefcaseBusiness },
  { key: 'score', icon: ShieldCheck },
];

function Blob({ className }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute -z-10 animate-blob rounded-full blur-3xl ${className}`}
    />
  );
}

export default function HeroSection() {
  const { t } = useTranslation('public');
  const ref = useRef(null);

  const followPointer = (event) => {
    const box = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--spot-x', `${event.clientX - box.left}px`);
    ref.current.style.setProperty('--spot-y', `${event.clientY - box.top}px`);
  };

  return (
    <section
      ref={ref}
      onPointerMove={followPointer}
      className="bg-ink-mesh relative isolate -mt-[4.5rem] overflow-hidden pt-32 pb-20 text-white sm:pt-40 sm:pb-28"
    >
      <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10" />
      <div aria-hidden="true" className="spotlight absolute inset-0 -z-10" />
      <Blob className="-left-24 top-24 size-80 bg-brand-500/30" />
      <Blob className="-right-16 top-10 size-96 bg-accent-600/30 [animation-delay:-8s]" />
      <Blob className="bottom-0 left-1/3 size-72 bg-electric-500/25 [animation-delay:-14s]" />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-7">
          <p className="glass-dark inline-flex animate-fade-up items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-brand-100">
            <span className="size-2 animate-pulse-soft rounded-full bg-brand-400" />
            {t('landing.eyebrow')}
          </p>
          <h1 className="animate-fade-up text-4xl leading-[1.2] font-extrabold [animation-delay:80ms] sm:text-6xl">
            {t('landing.titleLead')}{' '}
            <span className="text-gradient">{t('landing.titleAccent')}</span>
          </h1>
          <p className="max-w-xl animate-fade-up text-lg text-white/75 [animation-delay:160ms] sm:text-xl">
            {t('landing.subtitle')}
          </p>
          <div className="animate-fade-up [animation-delay:240ms]">
            <HeroSearch />
          </div>
          <ul className="flex animate-fade-up flex-wrap gap-x-6 gap-y-3 [animation-delay:320ms]">
            {HIGHLIGHTS.map(({ key, icon: Icon }) => (
              <li
                key={key}
                className="inline-flex items-center gap-2 text-sm font-medium text-white/80"
              >
                <Icon className="size-5 text-brand-300" aria-hidden="true" />
                {t(`landing.highlights.${key}`)}
              </li>
            ))}
          </ul>
        </div>
        <div className="animate-fade-up [animation-delay:360ms]">
          <PassportPreview />
        </div>
      </div>
    </section>
  );
}
