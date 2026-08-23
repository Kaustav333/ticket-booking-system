import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import api from '../lib/api';

const CITY_COORDINATES: Record<string, { lat: number, lon: number }> = {
  mumbai: { lat: 19.0760, lon: 72.8777 },
  delhi: { lat: 28.7041, lon: 77.1025 },
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  hyderabad: { lat: 17.3850, lon: 78.4867 },
  pune: { lat: 18.5204, lon: 73.8567 },
  guwahati: { lat: 26.1445, lon: 91.7362 },
  ahmedabad: { lat: 23.0225, lon: 72.5714 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  surat: { lat: 21.1702, lon: 72.8311 },
  lucknow: { lat: 26.8467, lon: 80.9462 },
  kanpur: { lat: 26.4499, lon: 80.3319 },
  nagpur: { lat: 21.1458, lon: 79.0882 },
  indore: { lat: 22.7196, lon: 75.8577 },
  thane: { lat: 19.2183, lon: 72.9781 },
  bhopal: { lat: 23.2599, lon: 77.4126 },
  visakhapatnam: { lat: 17.6868, lon: 83.2185 },
  patna: { lat: 25.5941, lon: 85.1376 },
  vadodara: { lat: 22.3072, lon: 73.1812 },
  ghaziabad: { lat: 28.6692, lon: 77.4538 },
  ludhiana: { lat: 30.9010, lon: 75.8523 },
  agra: { lat: 27.1767, lon: 78.0081 },
  nashik: { lat: 20.0110, lon: 73.7902 },
  faridabad: { lat: 28.4089, lon: 77.3178 },
  meerut: { lat: 28.9845, lon: 77.7064 },
  rajkot: { lat: 22.3039, lon: 70.8022 },
  kalyan: { lat: 19.2403, lon: 73.1305 },
  vasai: { lat: 19.3919, lon: 72.8397 },
  varanasi: { lat: 25.3176, lon: 83.0034 },
  sydney: { lat: -33.8688, lon: 151.2093 }
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
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
  average_rating: number | null;
}

const EventCard = ({ event }: { event: Event }) => (
  <Link to={`/events/${event.id}/seats`} className="group flex flex-col cursor-pointer h-full">
    
    {/* Poster Image */}
    <div className="w-full aspect-[2/3] rounded-xl overflow-hidden relative shadow-sm mb-3">
      {true ? (
        <img src={`https://picsum.photos/seed/${event.title.replace(/\s+/g, '')}/600/800`} alt={event.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
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

      {/* Rating Badge */}
      {event.average_rating && (
        <div className="absolute bottom-2 right-2 bg-gray-900/80 backdrop-blur-sm text-white px-2 py-1 rounded-md flex items-center space-x-1">
          <Star className="w-3 h-3 text-bms-red fill-current" />
          <span className="text-xs font-bold">{event.average_rating.toFixed(1)}</span>
        </div>
      )}
    </div>

    {/* Event Details */}
    <div className="flex flex-col">
      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-bms-red transition-colors">{event.title}</h3>
      
      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
        {event.category || 'Event'} • {event.venue_location}
      </p>
      <p className="text-xs text-gray-400 mt-1 font-medium">
        {new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
    </div>
  </Link>
);

const EventSection = ({ title, subtitle, eventsList }: { title: string, subtitle?: string, eventsList: Event[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (eventsList.length === 0) return null;
  return (
    <div className="space-y-4 pt-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-bms-red text-sm font-semibold hover:underline flex items-center"
        >
          {isExpanded ? 'Collapse' : 'See All'} <span className="ml-1">{isExpanded ? '‹' : '›'}</span>
        </button>
      </div>
      
      {isExpanded ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-6 pt-2">
          {eventsList.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="flex overflow-x-auto space-x-6 pb-6 pt-2 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {eventsList.map((event) => (
            <div key={event.id} className="snap-start shrink-0 w-[200px]">
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
  let fallbackCityName = '';
  let fallbackDistance = 0;

  if (locationFilter) {
    const locFiltered = filteredEvents.filter(e => e.venue_location && e.venue_location.toLowerCase() === locationFilter.toLowerCase());
    if (locFiltered.length > 0) {
      filteredEvents = locFiltered;
    } else {
      isLocationFallback = true;
      
      const targetCityCoords = CITY_COORDINATES[locationFilter.toLowerCase()];
      if (targetCityCoords) {
        // Find all unique cities we HAVE events for
        const availableCities = Array.from(new Set(filteredEvents.map(e => e.venue_location?.toLowerCase()).filter(Boolean)));
        
        let nearestCity = '';
        let minDistance = Infinity;

        availableCities.forEach(city => {
          const coords = CITY_COORDINATES[city as string];
          if (coords) {
            const dist = getDistance(targetCityCoords.lat, targetCityCoords.lon, coords.lat, coords.lon);
            if (dist < minDistance) {
              minDistance = dist;
              nearestCity = city as string;
            }
          }
        });

        if (nearestCity) {
          filteredEvents = filteredEvents.filter(e => e.venue_location?.toLowerCase() === nearestCity);
          fallbackCityName = nearestCity.charAt(0).toUpperCase() + nearestCity.slice(1);
          fallbackDistance = Math.round(minDistance);
        }
      }
    }
  }

  // Group events by category logic for the homepage
  const movies = filteredEvents.filter(e => e.category === 'Movie');
  const recommended = filteredEvents.filter(e => e.category !== 'Movie' && (!e.average_rating || e.average_rating < 8.5));
  const topPicks = [...filteredEvents].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0)).slice(0, 10); // Top 10 highest rated



  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bms-red"></div>
    </div>
  );

  return (
    <div className="space-y-12 pb-12 w-full">
      {/* Hero Carousel Banner Mockup */}
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden rounded-xl group cursor-pointer bg-gray-900 mt-6">
        <img 
          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&h=400&fit=crop" 
          alt="Banner" 
          className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-24">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Endless Entertainment<br/>Anytime. Anywhere!</h1>
          <button 
            onClick={() => document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-bms-red text-white px-6 py-2 rounded-md font-medium w-max hover:bg-bms-hover transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>

      <div id="events-grid">
        {isLocationFallback && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 flex items-start space-x-3">
            <svg className="h-6 w-6 text-yellow-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold">No events found in {locationFilter?.charAt(0).toUpperCase() + (locationFilter?.slice(1) || '')}.</h3>
              <p className="text-sm mt-1 text-yellow-700">
                {fallbackCityName 
                  ? `Showing nearest shows in ${fallbackCityName} (approx. ${fallbackDistance} km away).`
                  : "We couldn't find any events matching your location right now. Showing popular events across other cities instead."}
              </p>
            </div>
          </div>
        )}

        {categoryFilter ? (
          // If a category filter is active, just show a normal grid of those events
          <div className="space-y-6 pt-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">{categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredEvents.map(evt => <EventCard key={evt.id} event={evt} />)}
            </div>
            {filteredEvents.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-500 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 border-dashed">
                No {categoryFilter} events found.
              </div>
            )}
          </div>
        ) : (
          // If no category filter, show the categorized horizontal rows
          <div className="space-y-2">
            <EventSection title="Now Showing" subtitle="Book tickets for the latest movies now" eventsList={movies} />
            <EventSection title="Top Picks For You" subtitle="Curated just for you based on ratings" eventsList={topPicks} />
            <EventSection title="Recommended Events" subtitle="The best of live events, concerts & more" eventsList={recommended} />
            
            {/* Show all as grid if no specific categorizations fit */}
            {filteredEvents.length > 0 && movies.length === 0 && topPicks.length === 0 && recommended.length === 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-8">
                {filteredEvents.map(evt => <EventCard key={evt.id} event={evt} />)}
              </div>
            )}
            {filteredEvents.length === 0 && (
              <div className="py-20 text-center text-gray-500 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 border-dashed">
                No events found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
