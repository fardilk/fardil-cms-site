const baseURL = 'http://localhost:8000';

export async function apiFetch(path: string, options?: RequestInit) {
  const response = await fetch(`${baseURL}${path}`, options);
  return response;
}