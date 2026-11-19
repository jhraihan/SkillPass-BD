import { ArrowRight, CalendarCheck, Search, Star, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Reveal } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import CategoryTiles from '../components/CategoryTiles';
import HeroSection from '../components/HeroSection';
import ServiceMarquee from '../components/ServiceMarquee';

const STEPS = [
  { key: 'find', icon: Search },
  { key: 'book', icon: CalendarCheck },
  { key: 'review', icon: Star },
];
const STEP_STAGGER_MS = 120;

function SectionHeading({ eyebrow, title, text, action }) {
  return (
    <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-3">
        <p className="inline-flex items-center gap-3 text-sm font-bold text-brand-600">
          <span className="h-px w-10 bg-linear-to-r from-brand-500 to-accent-500" />
          {eyebrow}
        </p>
        <h2 className="text-3xl leading-tight font-bold text-ink-900 sm:text-5xl">{title}</h2>
        {text && <p className="text-lg text-gray-600">{text}</p>}
      </div>
      {action}
    </Reveal>
  );
}

function stepNumber(index, language) {
  return `${formatNumber(0, language)}${formatNumber(index + 1, language)}`;
}

export default function LandingPage() {
  const { t, i18n } = useTranslation('public');

  return (
    <div>
      <HeroSection />
      <ServiceMarquee />

      <section className="mx-auto max-w-6xl space-y-10 px-4 py-20 sm:py-28">
        <SectionHeading
          eyebrow={t('landing.categoriesEyebrow')}
          title={t('landing.categoriesTitle')}
          text={t('landing.categoriesText')}
          action={
            <Link
              to="/workers"
              className="group inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold text-brand-700 hover:text-brand-800"
            >
              {t('landing.viewAll')}
              <ArrowRight
                className="size-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          }
        />
        <CategoryTiles />
      </section>

      <section className="mx-auto max-w-6xl space-y-10 px-4 pb-20 sm:pb-28">
        <SectionHeading eyebrow={t('landing.howEyebrow')} title={t('landing.howTitle')} />
        <ol className="relative grid gap-4 sm:grid-cols-3 sm:gap-6">
          <span
            aria-hidden="true"
            className="absolute top-16 right-8 left-8 hidden h-px bg-linear-to-r from-transparent via-brand-300 to-transparent sm:block"
          />
          {STEPS.map(({ key, icon: Icon }, index) => (
            <Reveal as="li" key={key} delay={index * STEP_STAGGER_MS} className="relative">
              <div className="lift h-full space-y-4 rounded-3xl border border-white/80 bg-white/80 p-6 shadow-soft hover:shadow-xl hover:shadow-brand-900/10">
                <div className="flex items-center justify-between">
                  <span className="text-gradient-dark font-display text-5xl font-extrabold">
                    {stepNumber(index, i18n.language)}
                  </span>
                  <span className="neu flex size-12 items-center justify-center rounded-2xl bg-white">
                    <Icon className="size-6 text-brand-600" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="text-xl font-bold text-ink-900">
                  {t(`landing.steps.${key}.title`)}
                </h3>
                <p className="text-gray-600">{t(`landing.steps.${key}.text`)}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:pb-28">
        <Reveal className="bg-ink-mesh relative isolate overflow-hidden rounded-[2rem] p-8 text-white shadow-2xl shadow-ink-900/30 sm:p-12">
          <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10" />
          <div
            aria-hidden="true"
            className="absolute -top-20 -right-20 -z-10 size-72 animate-blob rounded-full bg-accent-600/40 blur-3xl"
          />
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-3">
              <p className="text-sm font-bold text-brand-300">{t('landing.workerCta.eyebrow')}</p>
              <h2 className="text-3xl leading-tight font-bold sm:text-4xl">
                {t('landing.workerCta.title')}
              </h2>
              <p className="text-lg text-white/75">{t('landing.workerCta.text')}</p>
            </div>
            <Link
              to="/register"
              className="group inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-2xl bg-white px-7 text-lg font-bold text-ink-900 shadow-xl shadow-black/20 transition-all hover:bg-brand-50 active:scale-[0.97]"
            >
              <Wrench className="size-5 text-brand-600" aria-hidden="true" />
              {t('landing.workerCta.button')}
              <ArrowRight
                className="size-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
