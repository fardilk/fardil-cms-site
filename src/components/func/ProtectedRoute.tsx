import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
  apiFetch('/me', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(() => setLoading(false))
      .catch(() => {
        navigate('/');
      });
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}