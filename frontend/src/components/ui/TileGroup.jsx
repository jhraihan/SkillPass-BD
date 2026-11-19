import { cn } from '@/lib/cn';

const COLUMNS = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  row3: 'grid-cols-3',
};

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
  const selected = multiple ? (value ?? []) : value;
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
      {label && <legend className="mb-2 text-sm font-semibold text-gray-800">{label}</legend>}
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
                'flex min-h-24 flex-col items-center justify-center gap-2 rounded-3xl border-2 p-3 text-center transition-all duration-200 active:scale-[0.97]',
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-lg shadow-brand-600/15 ring-4 ring-brand-500/10'
                  : 'neu border-white bg-white text-gray-800 hover:border-brand-200',
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
