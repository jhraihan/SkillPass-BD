import { CATEGORY_ICONS, FALLBACK_ICON } from '@/lib/categoryIcons';

export default function CategoryIcon({ name, className }) {
  const Icon = CATEGORY_ICONS[name] ?? FALLBACK_ICON;
  return <Icon className={className} aria-hidden="true" />;
}
