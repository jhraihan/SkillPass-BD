import i18n from '@/i18n';

export function getErrorMessage(error, t) {
  if (!error?.response) return t('common:errors.network');
  const { status, data } = error.response;
  const codeKey = `common:apiErrors.${data?.code}`;
  const byCode = data?.code && i18n.exists(codeKey) ? t(codeKey) : '';
  if (byCode) return byCode;
  if (status === 404) return data?.detail || t('common:errors.notFound');
  if (status === 403) return t('common:errors.forbidden');
  return data?.detail || t('common:errors.generic');
}
