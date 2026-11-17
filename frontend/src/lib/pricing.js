export const MAX_PRICE = 100000;

function toPrice(value) {
  if (value === '' || value === null || value === undefined) return null;
  return Math.min(Math.max(Math.round(Number(value)) || 0, 0), MAX_PRICE);
}

function fromPrice(value) {
  return value === null || value === undefined ? '' : String(value);
}

export function initialPricing(profile) {
  return {
    visitCharge: fromPrice(profile.visit_charge),
    skills: Object.fromEntries(profile.skills.map((s) => [s.id, fromPrice(s.starting_price)])),
  };
}

export function pricingPayload(pricing, skillIds) {
  return {
    visitCharge: toPrice(pricing.visitCharge),
    skillPrices: skillIds.map((id) => ({ skill: id, price: toPrice(pricing.skills[id]) })),
  };
}
