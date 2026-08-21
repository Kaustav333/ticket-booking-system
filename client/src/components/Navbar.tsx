import { Link, useNavigate } from 'react-router-dom';

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
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-indigo-600">AuraTix</Link>
          </div>
          <div className="flex items-center space-x-6">
            {token ? (
              <>
                <span className="text-sm text-gray-500 hidden sm:inline-block">Hello, {user?.name} ({user?.role})</span>
                <Link to="/events" className="text-gray-700 hover:text-indigo-600 font-medium">Events</Link>
                <Link to="/bookings" className="text-gray-700 hover:text-indigo-600 font-medium">My Bookings</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-indigo-600 font-medium">Admin</Link>
                )}
                {user?.role === 'organiser' && (
                  <Link to="/organiser" className="text-gray-700 hover:text-indigo-600 font-medium">Organiser</Link>
                )}
                <button onClick={handleLogout} className="text-gray-700 hover:text-red-600 font-medium">Logout</button>
              </>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-indigo-600 font-medium">Login</Link>
                <Link to="/signup" className="text-indigo-600 font-medium hover:underline">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
