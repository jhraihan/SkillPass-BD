import { cn } from '@/lib/cn';

/** Label + control + hint/error. Used by Input, Select, Textarea and custom controls. */
export default function Field({ id, label, hint, error, required, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-800">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-gray-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
