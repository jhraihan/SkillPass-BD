import { useId } from 'react';
import Field from './Field';
import { controlClass, describedBy } from './styles';

export default function Textarea({
  label,
  hint,
  error,
  required,
  className,
  id,
  rows = 4,
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
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, { error, hint })}
        className={controlClass(Boolean(error), 'resize-y')}
        {...props}
      />
    </Field>
  );
}
