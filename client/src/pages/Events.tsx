import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  venue_id: string;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-navy-800 border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-navy-900/80 to-navy-900 z-0"></div>
        <div className="relative z-10 px-8 py-16 md:py-24 max-w-3xl flex flex-col items-start">
          <span className="px-3 py-1 text-xs font-semibold tracking-wider text-indigo-300 uppercase bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
            Live Experiences
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white leading-tight mb-6">
            Book your next <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">unforgettable</span> experience
          </h1>
          <p className="text-lg text-gray-400 mb-8 max-w-xl">
            Discover the best concerts, shows, and events happening around you. Secure your seats before they sell out.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-white">Upcoming Events</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {events.map((event) => (
          <div key={event.id} className="group relative bg-navy-800 overflow-hidden shadow-lg rounded-2xl border border-white/5 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-300 hover:-translate-y-1 flex flex-col">
            
            {/* Poster Gradient Placeholder */}
            <div className="h-40 w-full bg-gradient-to-br from-violet-600/80 to-indigo-900/80 relative">
              <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay"></div>
              <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
                  event.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
                  'bg-white/10 text-white border border-white/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${event.status === 'AVAILABLE' ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                  {event.status}
                </span>
              </div>
            </div>

            <div className="px-5 py-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{event.title}</h3>
              
              <div className="flex items-center text-sm text-gray-400 mb-4">
                <svg className="h-4 w-4 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              
              <div className="mt-auto pt-6">
                <Link 
                  to={`/events/${event.id}/seats`} 
                  className="w-full flex justify-center items-center px-4 py-3 border border-transparent shadow-sm text-sm font-bold rounded-full text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all"
                >
                  View Seats
                </Link>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400 bg-navy-800/50 rounded-2xl border border-dashed border-white/10">
            No events found. Check back later!
          </div>
        )}
      </div>
    </div>
  );
}
