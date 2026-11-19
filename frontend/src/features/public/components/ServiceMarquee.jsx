import { useTranslation } from 'react-i18next';
import { CategoryIcon } from '@/components/domain';
import { useCategories } from '@/hooks/catalog';
import { localName } from '@/lib/format';

export default function ServiceMarquee() {
  const { i18n } = useTranslation();
  const { data: categories = [] } = useCategories();
  if (categories.length === 0) return null;

  const items = [...categories, ...categories];

  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden border-y border-white/70 bg-white/60 py-5 backdrop-blur-md [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]"
    >
      <ul className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {items.map((category, index) => (
          <li
            key={`${category.slug}-${index}`}
            className="inline-flex items-center gap-3 pr-10 font-display text-lg font-semibold whitespace-nowrap text-ink-700"
          >
            <CategoryIcon name={category.icon} className="size-6 text-brand-500" />
            {localName(category, i18n.language)}
            <span className="ml-7 size-1.5 rounded-full bg-accent-400" />
          </li>
        ))}
      </ul>
    </div>
  );
}
