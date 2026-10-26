import { useId } from 'react';
import Field from './Field';
import { controlClass, describedBy } from './styles';

/** options: [{ value, label }] */
export default function Select({
  label,
  hint,
  error,
  required,
  options = [],
  placeholder,
  className,
  id,
  ref,
  ...props
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <select
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, { error, hint })}
        className={controlClass(Boolean(error), 'pr-10')}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
