import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const [location, setLocation] = useState('Select Location');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use OpenStreetMap Nominatim for reverse geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          // Extract city, town, or fallback to state/country
          const city = data.address.city || data.address.town || data.address.state_district || 'Detected Location';
          setLocation(city);
        } catch (error) {
          console.error("Error fetching location data:", error);
        }
      }, (error) => {
        console.error("Geolocation error:", error);
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="fixed w-full z-50 top-0 bg-white border-b border-gray-200 shadow-sm">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6 flex-1">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="Logo" className="h-10 object-contain" />
            </Link>
            
            {/* Search Bar Mockup */}
            <div className="hidden md:flex flex-1 max-w-xl relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search for Movies, Events, Plays, Sports and Activities" 
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Location */}
            <div className="hidden sm:flex items-center text-sm text-gray-700 font-medium cursor-pointer hover:text-gray-900">
              {location}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {token ? (
              <>
                <div className="hidden sm:flex items-center pl-4 space-x-4">
                  <div className="px-3 py-1.5 text-sm font-medium text-gray-700 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-bms-red flex items-center justify-center text-white text-xs">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    {user?.name}
                  </div>
                  <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-bms-red font-medium transition-colors">Logout</button>
                </div>
                {/* Mobile logout */}
                <button onClick={handleLogout} className="sm:hidden text-gray-500 hover:text-bms-red font-medium transition-colors">Logout</button>
              </>
            ) : (
              <div className="space-x-4 flex items-center pl-4">
                <Link to="/login" className="px-5 py-1.5 rounded-md bg-bms-red text-white text-sm font-medium hover:bg-bms-hover transition-colors">Sign In</Link>
              </div>
            )}
            
            {/* Hamburger Icon */}
            <div className="pl-4 cursor-pointer">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Navbar */}
      <div className="bg-gray-50 border-t border-gray-200/60 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-10 text-sm">
            <div className="flex space-x-6 text-gray-600">
              <Link to="/?category=movies" className="hover:text-gray-900 transition-colors">Movies</Link>
              <Link to="/?category=stream" className="hover:text-gray-900 transition-colors">Stream</Link>
              <Link to="/?category=events" className="hover:text-gray-900 transition-colors">Events</Link>
              <Link to="/?category=plays" className="hover:text-gray-900 transition-colors">Plays</Link>
              <Link to="/?category=sports" className="hover:text-gray-900 transition-colors">Sports</Link>
              <Link to="/?category=activities" className="hover:text-gray-900 transition-colors">Activities</Link>
            </div>
            
            <div className="hidden md:flex space-x-6 text-gray-600 text-xs">
              <Link to="/events" className="hover:text-gray-900 transition-colors">ListYourShow</Link>
              <Link to="/bookings" className="hover:text-gray-900 transition-colors">My Bookings</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="hover:text-gray-900 transition-colors">Admin Dashboard</Link>
              )}
              {user?.role === 'organiser' && (
                <Link to="/organiser" className="hover:text-gray-900 transition-colors">Organiser Dashboard</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
