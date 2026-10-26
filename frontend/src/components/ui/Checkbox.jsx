import { useId } from 'react';

export default function Checkbox({ label, error, className, id, ref, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="flex min-h-11 cursor-pointer items-center gap-3 text-base">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="size-5 rounded border-gray-300 accent-brand-600"
          aria-invalid={error ? true : undefined}
          {...props}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
