import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const [location, setLocation] = useState('Select Location');
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [searchLocationInput, setSearchLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  const handleLocationSelect = (loc: string) => {
    setLocation(loc);
    setIsLocationMenuOpen(false);
    setSearchLocationInput('');
    navigate(`/?location=${loc.toLowerCase()}`);
  };

  const handleLocationSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchLocationInput.trim()) {
      handleLocationSelect(searchLocationInput.trim());
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchLocationInput.trim() || searchLocationInput.length < 3) {
        setLocationSuggestions([]);
        return;
      }
      setIsSearchingLocation(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocationInput)}&featuretype=city&limit=5`);
        const data = await response.json();
        
        // Extract unique city names
        const uniqueCities = Array.from(new Set(data.map((item: any) => {
          const parts = item.display_name.split(',');
          return parts[0].trim();
        })));
        
        setLocationSuggestions(uniqueCities.slice(0, 5));
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
      } finally {
        setIsSearchingLocation(false);
      }
    };

    const timerId = setTimeout(() => {
      fetchSuggestions();
    }, 500); // 500ms debounce

    return () => clearTimeout(timerId);
  }, [searchLocationInput]);

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
            <div className="relative hidden sm:flex items-center">
              <div 
                className="flex items-center text-sm text-gray-700 font-medium cursor-pointer hover:text-gray-900"
                onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
              >
                {location}
                <svg className={`w-4 h-4 ml-1 transition-transform ${isLocationMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Location Dropdown */}
              {isLocationMenuOpen && (
                <div className="absolute top-8 right-0 w-72 bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-50">
                  <div className="relative mb-4">
                    <svg className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                      type="text" 
                      placeholder="Search for your city..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded text-gray-900 focus:outline-none focus:border-bms-red"
                      value={searchLocationInput}
                      onChange={(e) => setSearchLocationInput(e.target.value)}
                      onKeyDown={handleLocationSearch}
                      autoFocus
                    />
                  </div>
                  
                  {searchLocationInput.length > 0 ? (
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search Results</div>
                      {isSearchingLocation ? (
                        <div className="text-sm text-gray-500 py-2">Searching...</div>
                      ) : locationSuggestions.length > 0 ? (
                        <div className="flex flex-col space-y-1">
                          {locationSuggestions.map((city, idx) => (
                            <div 
                              key={idx}
                              className="text-sm text-gray-700 hover:text-bms-red cursor-pointer py-2 px-2 rounded hover:bg-gray-50 transition-colors"
                              onClick={() => handleLocationSelect(city as string)}
                            >
                              {city}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 py-2">No cities found</div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Popular Cities</div>
                      <div className="grid grid-cols-2 gap-2">
                        {['Mumbai', 'Delhi', 'Bengaluru', 'Sydney', 'Hyderabad', 'Pune', 'Guwahati', 'Kolkata'].map(city => (
                          <div 
                            key={city}
                            className="text-sm text-gray-700 hover:text-bms-red cursor-pointer py-1 px-2 rounded hover:bg-gray-50 transition-colors"
                            onClick={() => handleLocationSelect(city)}
                          >
                            {city}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {token ? (
              <>
                <div className="hidden sm:flex items-center pl-4 space-x-4">
                  <div className="px-3 py-1.5 text-sm font-medium text-gray-700 flex items-center gap-2 cursor-default">
                    <div className="w-6 h-6 rounded-full bg-bms-red flex items-center justify-center text-white text-xs">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {user?.name || 'User'}
                  </div>
                  <button onClick={handleLogout} className="text-sm text-bms-red hover:text-bms-hover font-bold transition-colors">
                    Logout
                  </button>
                </div>
                {/* Mobile logout */}
                <button onClick={handleLogout} className="sm:hidden text-bms-red hover:text-bms-hover font-bold transition-colors ml-4 text-sm">
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-4 flex items-center pl-4">
                <Link to="/login" className="px-5 py-1.5 rounded-md bg-bms-red text-white text-sm font-medium hover:bg-bms-hover transition-colors">Sign In</Link>
              </div>
            )}
            
            {/* Hamburger Icon */}
            <div className="pl-4 cursor-pointer relative">
              <svg 
                onClick={() => setIsHamburgerOpen(!isHamburgerOpen)}
                className="w-6 h-6 text-gray-700 hover:text-bms-red transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>

              {/* Hamburger Dropdown Menu */}
              {isHamburgerOpen && (
                <div className="absolute top-10 right-0 w-64 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden z-50 animate-in slide-in-from-top-2">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">Hey!</p>
                  </div>
                  <div className="flex flex-col py-2">
                    <Link to="/bookings" onClick={() => setIsHamburgerOpen(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-bms-red transition-colors flex items-center justify-between">
                      <span>Your Orders</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                    <Link to="/events" onClick={() => setIsHamburgerOpen(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-bms-red transition-colors flex items-center justify-between">
                      <span>ListYourShow</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setIsHamburgerOpen(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-bms-red transition-colors flex items-center justify-between">
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    {user?.role === 'organiser' && (
                      <Link to="/organiser" onClick={() => setIsHamburgerOpen(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-bms-red transition-colors flex items-center justify-between">
                        <span>Organiser Dashboard</span>
                      </Link>
                    )}
                    <div className="h-px bg-gray-100 my-1"></div>
                    <Link to="/support" onClick={() => setIsHamburgerOpen(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-bms-red transition-colors flex items-center justify-between">
                      <span>Help & Support</span>
                    </Link>
                    <Link to="/rewards" onClick={() => setIsHamburgerOpen(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-bms-red transition-colors flex items-center justify-between">
                      <span>Rewards</span>
                    </Link>
                    {token && (
                      <>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button 
                          onClick={() => {
                            setIsHamburgerOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-between"
                        >
                          <span>Sign Out</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Navbar */}
      <div className="bg-gray-50 border-t border-gray-200/60 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-10 text-sm">
            <div className="flex space-x-6 text-gray-600">
              <Link to="/" className="hover:text-gray-900 transition-colors font-semibold">Home</Link>
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
