import { areas, categories, districts, skills } from './catalogData';
import { mockError, mockRequest } from './utils';

const store = {
  categories: structuredClone(categories),
  skills: structuredClone(skills),
  areas: structuredClone(areas),
  districts: structuredClone(districts),
};

let nextId = 1000;

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function withSkillCount(category) {
  const count = store.skills.filter((s) => s.category === category.id && s.is_active).length;
  return { ...category, skill_count: count };
}

function decorate(resource, item) {
  if (resource === 'categories') return withSkillCount(item);
  if (resource === 'skills') {
    const category = store.categories.find((c) => c.id === Number(item.category));
    return { ...item, category: Number(item.category), category_slug: category?.slug };
  }
  if (resource === 'areas') {
    const district = store.districts.find((d) => d.id === Number(item.district));
    return { ...item, district: Number(item.district), district_detail: district };
  }
  return item;
}

export function mockCatalogList(resource, { includeInactive = false, category, district } = {}) {
  let items = store[resource].map((item) => decorate(resource, item));
  if (!includeInactive && resource !== 'districts') items = items.filter((i) => i.is_active);
  if (category) items = items.filter((i) => i.category_slug === category);
  if (district) items = items.filter((i) => i.district_detail?.slug === district);
  return mockRequest(items);
}

export function mockCatalogSave(resource, { id, ...values }) {
  const items = store[resource];
  const slug = values.slug || slugify(values.name_en) || `item-${nextId}`;
  if (items.some((item) => item.slug === slug && item.id !== id)) {
    return mockError(400, 'Invalid input.', { slug: ['An item with this slug already exists.'] });
  }
  if (id) {
    const index = items.findIndex((item) => item.id === id);
    items[index] = { ...items[index], ...values, slug };
    return mockRequest(decorate(resource, items[index]));
  }
  const created = { id: (nextId += 1), is_active: true, sort_order: 0, ...values, slug };
  items.push(created);
  return mockRequest(decorate(resource, created));
}

export function mockCatalogDelete(resource, id) {
  const inUse =
    (resource === 'categories' && store.skills.some((s) => s.category === id)) ||
    (resource === 'districts' && store.areas.some((a) => a.district === id));
  if (inUse) {
    return mockError(
      409,
      'This item is in use and cannot be deleted. Deactivate it instead.',
      {},
      { code: 'in_use' },
    );
  }
  store[resource] = store[resource].filter((item) => item.id !== id);
  return mockRequest(null);
}
