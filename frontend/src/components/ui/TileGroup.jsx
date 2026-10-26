import { cn } from '@/lib/cn';

const COLUMNS = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' };

/**
 * Big picture tiles instead of a text list (worker-friendly choices, PRD §14.2).
 * options: [{ value, label, icon?: LucideIcon | string (emoji), description? }]
 * Single: value='ac', onChange(value). Multiple: multiple, value=['ac'], onChange(values).
 */
export default function TileGroup({
  options = [],
  value,
  onChange,
  multiple = false,
  columns = 2,
  label,
  error,
  className,
}) {
  const selected = multiple ? value ?? [] : value;
  const isSelected = (optionValue) =>
    multiple ? selected.includes(optionValue) : selected === optionValue;

  const toggle = (optionValue) => {
    if (!multiple) return onChange?.(optionValue);
    onChange?.(
      isSelected(optionValue)
        ? selected.filter((v) => v !== optionValue)
        : [...selected, optionValue],
    );
  };

  return (
    <fieldset className={className}>
      {label && <legend className="mb-2 text-sm font-medium text-gray-800">{label}</legend>}
      <div
        role={multiple ? 'group' : 'radiogroup'}
        aria-invalid={error ? true : undefined}
        className={cn('grid gap-3', COLUMNS[columns])}
      >
        {options.map(({ value: optionValue, label: optionLabel, icon: Icon, description }) => {
          const active = isSelected(optionValue);
          return (
            <button
              key={optionValue}
              type="button"
              role={multiple ? undefined : 'radio'}
              aria-checked={multiple ? undefined : active}
              aria-pressed={multiple ? active : undefined}
              onClick={() => toggle(optionValue)}
              className={cn(
                'flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center transition-colors',
                active
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300',
              )}
            >
              {typeof Icon === 'string' ? (
                <span className="text-3xl" aria-hidden="true">
                  {Icon}
                </span>
              ) : (
                Icon && <Icon className="size-8" aria-hidden="true" />
              )}
              <span className="text-base font-semibold leading-tight">{optionLabel}</span>
              {description && <span className="text-sm text-gray-500">{description}</span>}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
