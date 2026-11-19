import { cn } from '@/lib/cn';

const SIZES = {
  sm: 'size-8 text-sm',
  md: 'size-10 text-base',
  lg: 'size-14 text-lg',
  xl: 'size-24 text-3xl',
};

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function Avatar({ src, name, size = 'md', className }) {
  const classes = cn('shrink-0 rounded-full object-cover', SIZES[size], className);
  if (src) return <img src={src} alt={name ?? ''} className={classes} loading="lazy" />;
  return (
    <span
      className={cn(
        classes,
        'inline-flex items-center justify-center bg-linear-to-br from-brand-100 via-electric-300/40 to-accent-100 font-display font-bold text-brand-800 ring-2 ring-white',
      )}
      aria-label={name}
      role="img"
    >
      {initials(name)}
    </span>
  );
}
