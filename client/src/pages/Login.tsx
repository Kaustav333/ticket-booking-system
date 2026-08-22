import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-200 rounded-2xl shadow-xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-bms-red"></div>
      <h2 className="text-3xl font-display font-bold mb-6 text-center text-gray-900">Welcome Back</h2>
      {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg text-sm">{error}</div>}
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="block w-full rounded-xl bg-gray-50 border border-gray-200 focus:border-bms-red focus:ring-1 focus:ring-bms-red p-3 text-gray-900 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="block w-full rounded-xl bg-gray-50 border border-gray-200 focus:border-bms-red focus:ring-1 focus:ring-bms-red p-3 text-gray-900 transition-colors"
            required
          />
        </div>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-bms-red hover:bg-bms-hover transition-all mt-4">
          Sign In
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="/signup" className="text-bms-red font-bold hover:underline">
          Sign up
        </a>
      </div>
    </div>
  );
}
