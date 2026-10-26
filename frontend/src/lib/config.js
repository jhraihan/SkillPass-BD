export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/** When true, hooks return fake data from src/mocks instead of calling the API. */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
