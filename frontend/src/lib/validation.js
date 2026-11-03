const BD_MOBILE = /^(?:\+?880|0)(1[3-9]\d{8})$/;
const COMMON_PINS = new Set([
  '112233',
  '121212',
  '123123',
  '696969',
  '000123',
  '102030',
  '147258',
  '159753',
]);

export const PIN_LENGTH = 6;
export const MIN_PASSWORD_LENGTH = 8;

export function normalizeBdPhone(value) {
  const match = String(value ?? '')
    .replace(/[\s\-()]/g, '')
    .match(BD_MOBILE);
  return match ? `+880${match[1]}` : null;
}

export function isValidBdPhone(value) {
  return normalizeBdPhone(value) !== null;
}

export function isPinFormat(value) {
  return /^\d{6}$/.test(value ?? '');
}

function isSequential(pin) {
  const steps = new Set();
  for (let i = 1; i < pin.length; i += 1) steps.add(Number(pin[i]) - Number(pin[i - 1]));
  return steps.size === 1 && (steps.has(1) || steps.has(-1));
}

export function isWeakPin(pin, phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  return (
    new Set(pin).size === 1 ||
    isSequential(pin) ||
    COMMON_PINS.has(pin) ||
    (digits.length >= PIN_LENGTH && pin === digits.slice(-PIN_LENGTH))
  );
}

export function pinError(pin, phone) {
  if (!isPinFormat(pin)) return 'common:errors.pinFormat';
  if (isWeakPin(pin, phone)) return 'common:errors.pinWeak';
  return null;
}
