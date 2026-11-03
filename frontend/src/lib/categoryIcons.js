import {
  Car,
  Droplets,
  Hammer,
  PaintRoller,
  Snowflake,
  Sparkles,
  WashingMachine,
  Wrench,
  Zap,
} from 'lucide-react';

export const CATEGORY_ICONS = {
  snowflake: Snowflake,
  zap: Zap,
  droplets: Droplets,
  'washing-machine': WashingMachine,
  hammer: Hammer,
  'paint-roller': PaintRoller,
  sparkles: Sparkles,
  car: Car,
};

export const FALLBACK_ICON = Wrench;

export function iconFor(name) {
  return CATEGORY_ICONS[name] ?? FALLBACK_ICON;
}
