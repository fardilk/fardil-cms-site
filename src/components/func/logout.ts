import { apiFetch } from '@/lib/api';

export const logout = async (navigate: (path: string) => void) => {
  await apiFetch('/logout', {
    method: 'POST',
    credentials: 'include',
  });
  navigate('/');
};