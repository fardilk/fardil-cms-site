import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function useLoginHandler() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    username: string,
    password: string
  ) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Login successful!');
        toast.success('Login Berhasil'); // Stylish green popup
        navigate('/dashboard');
      } else {
        setMessage(data.message || 'Login failed.');
        toast.error('Login Gagal');
      }
    } catch {
      setMessage('Network error.');
      toast.error('Gagal Menghubungkan');
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, message, loading };
}