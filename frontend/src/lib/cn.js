import { clsx } from 'clsx';

/** Join class names conditionally: cn('a', isOn && 'b'). */
export function cn(...inputs) {
  return clsx(inputs);
}
