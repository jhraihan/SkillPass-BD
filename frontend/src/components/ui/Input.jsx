import { useId } from 'react';
import Field from './Field';
import { controlClass, describedBy } from './styles';

/** Text input. Works with react-hook-form: <Input label="…" {...register('name')} /> */
export default function Input({
  label,
  hint,
  error,
  required,
  className,
  inputClassName,
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
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, { error, hint })}
        className={controlClass(Boolean(error), inputClassName)}
        {...props}
      />
    </Field>
  );
}
