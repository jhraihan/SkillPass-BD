import { describe, expect, it } from 'vitest';
import { isValidBdPhone, isWeakPin, normalizeBdPhone, pinError } from './validation';

describe('normalizeBdPhone', () => {
  it.each(['01712345678', '+8801712345678', '8801712345678', '017-1234-5678', ' 01712 345678 '])(
    'normalizes %s',
    (raw) => {
      expect(normalizeBdPhone(raw)).toBe('+8801712345678');
    },
  );

  it.each(['', '0171234567', '01212345678', 'abc'])('rejects %s', (raw) => {
    expect(isValidBdPhone(raw)).toBe(false);
  });
});

describe('PIN rules', () => {
  it.each(['000000', '123456', '654321', '112233'])('flags %s as weak', (pin) => {
    expect(isWeakPin(pin)).toBe(true);
  });

  it('flags the last six digits of the phone', () => {
    expect(isWeakPin('345678', '01712345678')).toBe(true);
  });

  it('returns translation keys for errors', () => {
    expect(pinError('12345')).toBe('common:errors.pinFormat');
    expect(pinError('111111')).toBe('common:errors.pinWeak');
    expect(pinError('482915', '01712345678')).toBeNull();
  });
});
