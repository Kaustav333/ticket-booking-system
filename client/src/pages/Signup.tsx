import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { name, email, password, role });
      const loginRes = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', loginRes.data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-200 rounded-2xl shadow-xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-bms-red"></div>
      <h2 className="text-3xl font-display font-bold mb-6 text-center text-gray-900">Create Account</h2>
      {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg text-sm">{error}</div>}
      <form onSubmit={handleSignup} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="block w-full rounded-xl bg-gray-50 border border-gray-200 focus:border-bms-red focus:ring-1 focus:ring-bms-red p-3 text-gray-900 transition-colors"
            required
          />
        </div>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value="customer" checked={role === 'customer'} onChange={(e) => setRole(e.target.value)} className="text-bms-red focus:ring-bms-red bg-gray-50 border-gray-300" />
              <span className="text-sm text-gray-700">Customer</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value="organiser" checked={role === 'organiser'} onChange={(e) => setRole(e.target.value)} className="text-bms-red focus:ring-bms-red bg-gray-50 border-gray-300" />
              <span className="text-sm text-gray-700">Organiser</span>
            </label>
          </div>
        </div>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-bms-red hover:bg-bms-hover transition-all mt-4">
          Sign Up
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account? <Link to="/login" className="text-bms-red font-bold hover:underline transition-colors">Log in</Link>
      </div>
    </div>
  );
}
