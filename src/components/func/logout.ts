export const logout = async (navigate: (path: string) => void) => {
  await fetch('http://localhost:8000/logout', {
    method: 'POST',
    credentials: 'include',
  });
  navigate('/');
};