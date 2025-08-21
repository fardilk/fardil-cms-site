// Uses Vite env: define VITE_API_BASE_URL in .env files (e.g., http://localhost:8000 or https://api.example.com)
export const baseURL: string = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export async function apiFetch(path: string, options?: RequestInit) {
  const url = /^(https?:)?\/\//i.test(path) ? path : `${baseURL}${path}`;
  const response = await fetch(url, options);
  return response;
}

/**
 * Build a full image URL from a stored path or identifier.
 * Rules:
 * - If input is an absolute http(s) URL, return as is.
 * - If input starts with '/', prefix with baseURL.
 * - Otherwise, assume it's a file name or relative path and prefix with `${baseURL}/images/`.
 */
export function imageURL(input?: string): string {
  if (!input) return '';
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith('/')) return `${baseURL}${input}`;
  // Heuristic: common API serves images under /images or /uploads
  const p = input.startsWith('images/') || input.startsWith('uploads/') ? input : `images/${input}`;
  return `${baseURL}/${p}`;
}