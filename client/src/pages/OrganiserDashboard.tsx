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
  
  const [newEvent, setNewEvent] = useState({ venue_id: '', title: '', start_time: '', end_time: '', payment_details: '', payment_qr_url: '' });
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
      setNewEvent({ venue_id: '', title: '', start_time: '', end_time: '', payment_details: '', payment_qr_url: '' });
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
    <div className="max-w-7xl mx-auto p-4 py-8 space-y-8 pb-12">
      <h1 className="text-3xl font-display font-bold text-white mb-8">Organiser Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-navy-800 p-8 rounded-3xl shadow-xl border border-white/5">
          <h2 className="text-xl font-display font-bold text-white mb-6">Create New Event</h2>
          <form onSubmit={handleCreateEvent} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input type="text" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Venue</label>
              <select required value={newEvent.venue_id} onChange={e => setNewEvent({...newEvent, venue_id: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none appearance-none">
                <option value="">Select Venue...</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.location})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
                <input type="datetime-local" required value={newEvent.start_time} onChange={e => setNewEvent({...newEvent, start_time: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
                <input type="datetime-local" required value={newEvent.end_time} onChange={e => setNewEvent({...newEvent, end_time: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none [color-scheme:dark]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Payment Instructions / Bank Details (Optional)</label>
              <textarea placeholder="e.g. Bank Account No, IFSC, UPI ID" value={newEvent.payment_details} onChange={e => setNewEvent({...newEvent, payment_details: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Payment QR Code Image URL (Optional)</label>
              <input type="url" placeholder="https://..." value={newEvent.payment_qr_url} onChange={e => setNewEvent({...newEvent, payment_qr_url: e.target.value})} className="w-full bg-navy-900 border border-white/10 rounded-xl p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <button type="submit" className="w-full mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full py-3 font-bold hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all transform hover:-translate-y-0.5">Create Event</button>
          </form>
        </div>

        <div className="bg-navy-800 p-8 rounded-3xl shadow-xl border border-white/5">
          <h2 className="text-xl font-display font-bold text-white mb-6">Your Event Analytics</h2>
          <div className="space-y-6">
            {Object.values(summaries).length === 0 && (
              <div className="text-center p-8 border border-white/5 rounded-2xl bg-white/5">
                <p className="text-gray-400">No events found.</p>
              </div>
            )}
            {Object.values(summaries).map((sum, idx) => (
              <div key={idx} className="border border-white/10 p-6 rounded-2xl bg-navy-900/50 hover:border-indigo-500/30 transition-colors">
                <h3 className="font-display font-bold text-xl text-white mb-4">{sum.title}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Bookings</div>
                    <div className="text-white font-bold text-lg">{sum.total_bookings}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Confirmed</div>
                    <div className="text-green-400 font-bold text-lg">{sum.confirmed_bookings}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Cancelled</div>
                    <div className="text-white font-bold text-lg">{sum.cancelled_bookings}</div>
                  </div>
                  <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                    <div className="text-indigo-300 text-xs uppercase tracking-wider mb-1">Revenue</div>
                    <div className="text-indigo-400 font-bold text-lg">₹{sum.revenue}</div>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex space-x-2">
                    <input type="text" placeholder="Category (e.g. VIP)" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="bg-navy-900 border border-white/10 rounded-lg p-2 text-sm text-white w-2/5 focus:ring-1 focus:ring-indigo-500 outline-none" />
                    <input type="number" placeholder="Price" value={newCategory.price || ''} onChange={e => setNewCategory({...newCategory, price: Number(e.target.value)})} className="bg-navy-900 border border-white/10 rounded-lg p-2 text-sm text-white w-1/4 focus:ring-1 focus:ring-indigo-500 outline-none" />
                    <button onClick={() => handleAddCategory(sum.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex-1">Add Category</button>
                  </div>
                  <div>
                    <button onClick={() => handleInstantiate(sum.id)} className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-3 rounded-lg text-sm font-bold transition-colors">
                      Instantiate Venue Seats
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
