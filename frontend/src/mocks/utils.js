/** Resolve with a copy of `data` after a short delay, like a real API call. */
export function mockRequest(data, { delay = 350 } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(data)), delay);
  });
}

/** Reject with an axios-shaped error, to test error UI: mockError(400, 'Invalid input.', { phone: ['Taken'] }) */
export function mockError(status, detail, errors = {}, { delay = 350 } = {}) {
  const error = new Error(detail);
  error.response = { status, data: { detail, code: 'error', errors } };
  return new Promise((_, reject) => {
    setTimeout(() => reject(error), delay);
  });
}

/** Shape a list like a DRF paginated response. */
export function mockPaginate(items, page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize;
  return {
    count: items.length,
    next: start + pageSize < items.length ? page + 1 : null,
    previous: page > 1 ? page - 1 : null,
    results: items.slice(start, start + pageSize),
  };
}

/** Find an item by id or fail like a 404 response. */
export function mockFind(items, id) {
  const item = items.find((entry) => String(entry.id) === String(id));
  return item ? mockRequest(item) : mockError(404, 'Not found.');
}
