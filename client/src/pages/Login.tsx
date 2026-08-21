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
    <div className="max-w-md mx-auto mt-10 bg-navy-800 p-8 border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
      <h2 className="text-3xl font-display font-bold mb-6 text-center text-white">Welcome Back</h2>
      {error && <div className="mb-4 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm">{error}</div>}
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="block w-full rounded-xl bg-navy-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-3 text-white transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="block w-full rounded-xl bg-navy-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-3 text-white transition-colors"
            required
          />
        </div>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all transform hover:-translate-y-0.5 mt-4">
          Sign In
        </button>
      </form>
    </div>
  );
}
