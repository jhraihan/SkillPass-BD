export function getErrorMessage(error, t) {
  if (!error?.response) return t('common:errors.network');
  const { status, data } = error.response;
  const byCode = data?.code ? t(`common:apiErrors.${data.code}`, { defaultValue: '' }) : '';
  if (byCode) return byCode;
  if (status === 404) return data?.detail || t('common:errors.notFound');
  if (status === 403) return t('common:errors.forbidden');
  return data?.detail || t('common:errors.generic');
}
