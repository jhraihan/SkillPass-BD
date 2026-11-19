import { getErrorMessage } from '@/api/errors';

export function fieldError(errors, name, t) {
  const message = errors?.[name]?.message;
  return message ? t(message) : undefined;
}

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

export function formLevelError(error, fields, t) {
  if (!error) return null;
  const fieldErrors = error.response?.data?.errors;
  if (!fieldErrors || typeof fieldErrors !== 'object') return getErrorMessage(error, t);
  const leftover = Object.entries(fieldErrors)
    .filter(([name]) => !fields.includes(name))
    .flatMap(([, messages]) => [].concat(messages));
  return leftover.length > 0 ? leftover.join(' ') : null;
}
