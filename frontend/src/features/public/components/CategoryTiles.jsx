import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { CategoryIcon } from '@/components/domain';
import { Reveal, Spinner } from '@/components/ui';
import { useCategories } from '@/hooks/catalog';
import { localName } from '@/lib/format';

const STAGGER_MS = 60;

export default function CategoryTiles() {
  const { i18n } = useTranslation();
  const { data: categories, isPending } = useCategories();

  if (isPending) return <Spinner className="mx-auto" />;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {categories?.map((category, index) => (
        <Reveal as="li" key={category.slug} delay={index * STAGGER_MS}>
          <Link
            to={`/workers?category=${category.slug}`}
            className="lift group relative flex h-full min-h-36 flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-white/80 bg-white/80 p-5 shadow-soft hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
          >
            <span
              aria-hidden="true"
              className="absolute -top-12 -right-12 size-32 rounded-full bg-linear-to-br from-brand-300/50 to-accent-300/40 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
            />
            <span className="relative flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand-50 to-electric-300/30 ring-1 ring-brand-500/15 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
              <CategoryIcon name={category.icon} className="size-6 text-brand-600" />
            </span>
            <span className="relative flex items-end justify-between gap-2">
              <span className="font-display leading-snug font-semibold text-ink-900">
                {localName(category, i18n.language)}
              </span>
              <ArrowUpRight
                className="size-5 shrink-0 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600"
                aria-hidden="true"
              />
            </span>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}
