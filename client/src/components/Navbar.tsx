import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-indigo-600">Ticketing System</Link>
          </div>
          <div className="flex items-center space-x-4">
            {token ? (
              <>
                <Link to="/events" className="text-gray-700 hover:text-indigo-600">Events</Link>
                <Link to="/admin" className="text-gray-700 hover:text-indigo-600">Admin</Link>
                <button onClick={handleLogout} className="text-gray-700 hover:text-red-600">Logout</button>
              </>
            ) : (
              <Link to="/login" className="text-indigo-600 font-medium">Login</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
