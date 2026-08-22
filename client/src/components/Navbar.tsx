import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="fixed w-full z-50 top-0 bg-navy-900/70 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="AuraTix" className="h-10 object-contain" />
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {token ? (
              <>
                <Link to="/events" className="text-gray-300 hover:text-white font-medium transition-colors">Events</Link>
                <Link to="/bookings" className="text-gray-300 hover:text-white font-medium transition-colors">My Bookings</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-gray-300 hover:text-white font-medium transition-colors">Admin</Link>
                )}
                {user?.role === 'organiser' && (
                  <Link to="/organiser" className="text-gray-300 hover:text-white font-medium transition-colors">Organiser</Link>
                )}
                <div className="hidden sm:flex items-center pl-4 border-l border-white/10 space-x-4">
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px]">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    {user?.name}
                  </div>
                  <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-400 font-medium transition-colors">Logout</button>
                </div>
                {/* Mobile logout */}
                <button onClick={handleLogout} className="sm:hidden text-gray-400 hover:text-red-400 font-medium transition-colors">Logout</button>
              </>
            ) : (
              <div className="space-x-4 flex items-center">
                <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors">Login</Link>
                <Link to="/signup" className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
