import { useState, useEffect } from 'react';
import api from '../lib/api';

interface EventSummary {
  id: string;
  title: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  revenue: number;
}

export default function OrganiserDashboard() {
  const [summaries, setSummaries] = useState<Record<string, EventSummary>>({});
  const [venues, setVenues] = useState<any[]>([]);
  
  const [newEvent, setNewEvent] = useState({ venue_id: '', title: '', start_time: '', end_time: '' });
  const [newCategory, setNewCategory] = useState({ name: '', price: 0 });

  useEffect(() => {
    fetchEvents();
    fetchVenues();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events/');
      // Fetch summaries for each event
      res.data.forEach(async (ev: any) => {
        try {
          const sumRes = await api.get(`/events/${ev.id}/summary`);
          setSummaries(prev => ({ ...prev, [ev.id]: { ...sumRes.data, id: ev.id, title: ev.title } }));
        } catch (e) {
          // ignore if not owner
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVenues = async () => {
    try {
      const res = await api.get('/venues/');
      setVenues(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/events/', {
        ...newEvent,
        start_time: new Date(newEvent.start_time).toISOString(),
        end_time: new Date(newEvent.end_time).toISOString(),
      });
      alert('Event created!');
      setNewEvent({ venue_id: '', title: '', start_time: '', end_time: '' });
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create event');
    }
  };

  const handleAddCategory = async (eventId: string) => {
    try {
      await api.post(`/events/${eventId}/categories`, [newCategory]);
      alert('Category added!');
      setNewCategory({ name: '', price: 0 });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add category');
    }
  };

  const handleInstantiate = async (eventId: string) => {
    try {
      await api.post(`/events/${eventId}/instantiate_seats`);
      alert('Seats instantiated based on venue layout!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to instantiate seats');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Organiser Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Create New Event</h2>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input type="text" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Venue</label>
              <select required value={newEvent.venue_id} onChange={e => setNewEvent({...newEvent, venue_id: e.target.value})} className="w-full border rounded p-2">
                <option value="">Select Venue...</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.location})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input type="datetime-local" required value={newEvent.start_time} onChange={e => setNewEvent({...newEvent, start_time: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input type="datetime-local" required value={newEvent.end_time} onChange={e => setNewEvent({...newEvent, end_time: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white rounded py-2 hover:bg-indigo-700">Create Event</button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Your Event Analytics</h2>
          <div className="space-y-4">
            {Object.values(summaries).length === 0 && <p className="text-gray-500">No events found.</p>}
            {Object.values(summaries).map((sum, idx) => (
              <div key={idx} className="border border-gray-100 p-4 rounded-lg bg-gray-50">
                <h3 className="font-bold text-lg mb-2">{sum.title}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Total Bookings:</span> {sum.total_bookings}</div>
                  <div><span className="text-gray-500">Confirmed:</span> <span className="text-green-600 font-bold">{sum.confirmed_bookings}</span></div>
                  <div><span className="text-gray-500">Cancelled:</span> {sum.cancelled_bookings}</div>
                  <div><span className="text-gray-500">Revenue:</span> <span className="text-indigo-600 font-bold">₹{sum.revenue}</span></div>
                </div>
                
                <div className="mt-4 pt-4 border-t flex space-x-2">
                  <input type="text" placeholder="Category Name (e.g. VIP)" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="border rounded p-1 text-sm w-1/3" />
                  <input type="number" placeholder="Price" value={newCategory.price} onChange={e => setNewCategory({...newCategory, price: Number(e.target.value)})} className="border rounded p-1 text-sm w-1/4" />
                  <button onClick={() => handleAddCategory(sum.id)} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm font-medium">Add Category</button>
                </div>
                <div className="mt-2">
                  <button onClick={() => handleInstantiate(sum.id)} className="w-full bg-green-100 text-green-800 px-3 py-2 rounded text-sm font-medium">Instantiate Venue Seats</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
