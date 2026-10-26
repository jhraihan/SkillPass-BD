/**
 * Translate a react-hook-form error. Schemas store translation keys as messages,
 * e.g. z.string().min(1, 'common:errors.required').
 */
export function fieldError(errors, name, t) {
  const message = errors?.[name]?.message;
  return message ? t(message) : undefined;
}

/**
 * Copy DRF field errors ({ errors: { phone: ["..."] } }) onto the form.
 * Returns true if at least one field error was applied.
 */
export function applyServerErrors(error, setError) {
  const fieldErrors = error?.response?.data?.errors;
  if (!fieldErrors || typeof fieldErrors !== 'object') return false;

  let applied = false;
  for (const [name, messages] of Object.entries(fieldErrors)) {
    if (name === 'non_field_errors') continue;
    setError(name, { type: 'server', message: [].concat(messages).join(' ') });
    applied = true;
  }
  return applied;
}
