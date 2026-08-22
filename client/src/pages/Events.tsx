import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  venue_id: string;
  thumbnail_url: string;
  category: string;
  venue_location: string;
  venue_name: string;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const locationFilter = searchParams.get('location');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Filter events based on URL query params
  let filteredEvents = events;
  if (categoryFilter) {
    filteredEvents = filteredEvents.filter(e => e.category && e.category.toLowerCase() === categoryFilter.toLowerCase());
  }
  
  let isLocationFallback = false;
  if (locationFilter) {
    const locFiltered = filteredEvents.filter(e => e.venue_location && e.venue_location.toLowerCase() === locationFilter.toLowerCase());
    if (locFiltered.length > 0) {
      filteredEvents = locFiltered;
    } else {
      isLocationFallback = true;
      // Show all category-filtered events as fallback
    }
  }

  let displayCategory = categoryFilter 
    ? categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)
    : "Recommended Events";
  
  if (locationFilter && !isLocationFallback) {
    displayCategory += ` in ${locationFilter.charAt(0).toUpperCase() + locationFilter.slice(1)}`;
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bms-red"></div>
    </div>
  );

  return (
    <div className="space-y-12 pb-12 w-full">
      {/* Hero Carousel Banner Mockup */}
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden rounded-xl group cursor-pointer bg-gray-900">
        <img 
          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&h=400&fit=crop" 
          alt="Banner" 
          className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-24">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Endless Entertainment<br/>Anytime. Anywhere!</h1>
          <button className="bg-bms-red text-white px-6 py-2 rounded-md font-medium w-max hover:bg-bms-hover transition-colors">
            Book Now
          </button>
        </div>
      </div>

      <div>
        {isLocationFallback && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 flex items-start space-x-3">
            <svg className="h-6 w-6 text-yellow-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold">No events found in {locationFilter?.charAt(0).toUpperCase() + (locationFilter?.slice(1) || '')}.</h3>
              <p className="text-sm mt-1 text-yellow-700">We couldn't find any events matching your location right now. Showing popular events across other cities instead.</p>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{displayCategory}</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredEvents.map((event) => (
            <Link to={`/events/${event.id}/seats`} key={event.id} className="group flex flex-col cursor-pointer">
              
              {/* Poster Image */}
              <div className="w-full aspect-[2/3] rounded-lg overflow-hidden relative shadow-sm mb-3">
                {event.thumbnail_url ? (
                  <img src={event.thumbnail_url} alt={event.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    event.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </div>

              {/* Event Details */}
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-bms-red transition-colors">{event.title}</h3>
                
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {event.venue_name}, {event.venue_location}
                </p>
                <p className="text-xs text-gray-400 mt-1 font-medium">
                  {new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </Link>
          ))}
          {filteredEvents.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 border-dashed">
              No {categoryFilter ? categoryFilter : 'events'} found. Check back later!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
