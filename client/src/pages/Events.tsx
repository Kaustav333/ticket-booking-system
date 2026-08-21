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

  if (loading) return <div className="text-center mt-10">Loading events...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div key={event.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 flex flex-col">
            <div className="px-4 py-5 sm:p-6 flex-1">
              <h3 className="text-lg font-medium text-gray-900 truncate">{event.title}</h3>
              <p className="mt-1 text-sm text-gray-500">
                Starts: {new Date(event.start_time).toLocaleString()}
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {event.status}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <Link 
                to={`/events/${event.id}/seats`} 
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                View Seats
              </Link>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            No events found. Check back later!
          </div>
        )}
      </div>
    </div>
  );
}
