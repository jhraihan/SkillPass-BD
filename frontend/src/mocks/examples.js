const CATEGORIES = ['ac', 'plumbing', 'electrical'];
const AREAS = ['Mirpur', 'Dhanmondi', 'Uttara', 'Mohammadpur', 'Gulshan', 'Badda'];
const STATUSES = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export const exampleItems = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  title: `Example job #${index + 1}`,
  category: CATEGORIES[index % CATEGORIES.length],
  area: AREAS[index % AREAS.length],
  status: STATUSES[index % STATUSES.length],
  rating: (index % 5) + 1,
  created_at: new Date(2026, 9, 25 - index).toISOString(),
}));
