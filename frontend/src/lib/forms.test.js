import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '@/api/errors';
import i18n from '@/i18n';
import { formLevelError } from './forms';

const t = i18n.getFixedT('en', 'customer');
const apiError = (status, data) => ({ response: { status, data } });

describe('form level errors', () => {
  it('shows errors for keys that are not form fields', () => {
    const error = apiError(400, { code: 'invalid', errors: { worker: ['Not available.'] } });
    expect(formLevelError(error, ['area', 'category'], t)).toBe('Not available.');
  });

  it('stays quiet when every error belongs to a form field', () => {
    const error = apiError(400, { code: 'invalid', errors: { area: ['Required.'] } });
    expect(formLevelError(error, ['area'], t)).toBeNull();
  });

  it('falls back to a readable message for codes without a translation', () => {
    const error = apiError(418, { code: 'brand_new_code', detail: 'Server said no.' });
    expect(getErrorMessage(error, t)).toBe('Server said no.');
  });

  it('translates known codes such as not_found', () => {
    expect(getErrorMessage(apiError(404, { code: 'not_found' }), t)).toBe(
      'We could not find that. It may have been removed.',
    );
  });
});
