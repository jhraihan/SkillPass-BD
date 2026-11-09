import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { CategoryIcon } from '@/components/domain';
import { Spinner } from '@/components/ui';
import { useCategories } from '@/hooks/catalog';
import { localName } from '@/lib/format';

export default function CategoryTiles() {
  const { i18n } = useTranslation();
  const { data: categories, isPending } = useCategories();

  if (isPending) return <Spinner className="mx-auto" />;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {categories?.map((category) => (
        <li key={category.slug}>
          <Link
            to={`/workers?category=${category.slug}`}
            className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 text-center transition-colors hover:border-brand-400 hover:bg-brand-50"
          >
            <CategoryIcon name={category.icon} className="size-9 text-brand-600" />
            <span className="font-semibold text-gray-900">
              {localName(category, i18n.language)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
