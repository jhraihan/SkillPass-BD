import { cn } from '@/lib/cn';

const SIZES = {
  md: { track: 'h-7 w-12', thumb: 'size-6', on: 'translate-x-5' },
  lg: { track: 'h-10 w-[4.5rem]', thumb: 'size-9', on: 'translate-x-8' },
};

/**
 * On/off switch. Controlled: <Toggle checked={on} onChange={setOn} label="…" />
 * With react-hook-form wrap it in <Controller> and pass field.value / field.onChange.
 */
export default function Toggle({
  checked = false,
  onChange,
  label,
  description,
  size = 'md',
  disabled,
  className,
}) {
  const s = SIZES[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-4 rounded-xl text-left disabled:opacity-60',
        className,
      )}
    >
      {(label || description) && (
        <span>
          {label && <span className="block font-medium text-gray-900">{label}</span>}
          {description && <span className="block text-sm text-gray-500">{description}</span>}
        </span>
      )}
      <span
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors',
          s.track,
          checked ? 'bg-brand-600' : 'bg-gray-300',
        )}
      >
        <span
          className={cn(
            'rounded-full bg-white shadow transition-transform',
            s.thumb,
            checked && s.on,
          )}
        />
      </span>
    </button>
  );
}
