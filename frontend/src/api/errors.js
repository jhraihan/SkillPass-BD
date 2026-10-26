/** Human-readable message for any API error, translated. */
export function getErrorMessage(error, t) {
  if (!error?.response) return t('common:errors.network');
  const { status, data } = error.response;
  if (status === 404) return data?.detail || t('common:errors.notFound');
  if (status === 403) return t('common:errors.forbidden');
  return data?.detail || t('common:errors.generic');
}
