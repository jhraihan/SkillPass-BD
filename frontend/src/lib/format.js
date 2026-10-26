const LOCALES = { bn: 'bn-BD', en: 'en-GB' };

function locale(lang) {
  return LOCALES[lang] ?? LOCALES.en;
}

/** formatDate('2026-10-25', 'bn') -> "২৫ অক্টো, ২০২৬" */
export function formatDate(value, lang, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '';
  return new Intl.DateTimeFormat(locale(lang), options).format(new Date(value));
}

export function formatDateTime(value, lang) {
  return formatDate(value, lang, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

/** Numbers in the user's script: formatNumber(28, 'bn') -> "২৮" */
export function formatNumber(value, lang, options) {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat(locale(lang), options).format(value);
}
