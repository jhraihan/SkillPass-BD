export function mockRequest(data, { delay = 350 } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(data)), delay);
  });
}

export function mockError(status, detail, errors = {}, { delay = 350, code = 'error' } = {}) {
  const error = new Error(detail);
  error.response = { status, data: { detail, code, errors } };
  return new Promise((_, reject) => {
    setTimeout(() => reject(error), delay);
  });
}

export function mockPaginate(items, page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize;
  return {
    count: items.length,
    next: start + pageSize < items.length ? page + 1 : null,
    previous: page > 1 ? page - 1 : null,
    results: items.slice(start, start + pageSize),
  };
}

export function mockFind(items, id) {
  const item = items.find((entry) => String(entry.id) === String(id));
  return item ? mockRequest(item) : mockError(404, 'Not found.');
}
