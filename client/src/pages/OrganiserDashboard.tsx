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
  
  const [newEvent, setNewEvent] = useState({ venue_id: '', title: '', category: '', start_time: '', end_time: '', payment_details: '', payment_qr_url: '', thumbnail_url: '' });
  const [newCategory, setNewCategory] = useState({ name: '', price: 0 });
  const [newVenue, setNewVenue] = useState({ name: '', location: '', capacity: '' });

  useEffect(() => {
    fetchEvents();
    fetchVenues();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events/');
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

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const capacity = parseInt(newVenue.capacity);
      if (isNaN(capacity) || capacity <= 0) {
        alert("Please enter a valid capacity");
        return;
      }
      // Create Venue
      const res = await api.post('/venues/', { name: newVenue.name, location: newVenue.location });
      const venueId = res.data.id;
      
      // Auto-generate generic seats
      const seats = [];
      for (let i = 1; i <= capacity; i++) {
        seats.push({
          section: 'Main',
          row_identifier: 'A',
          seat_identifier: i.toString(),
          default_category: 'Standard'
        });
      }
      await api.post(`/venues/${venueId}/seats`, seats);
      
      alert(`Venue created with ${capacity} seats!`);
      setNewVenue({ name: '', location: '', capacity: '' });
      fetchVenues();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create venue');
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
      setNewEvent({ venue_id: '', title: '', category: '', start_time: '', end_time: '', payment_details: '', payment_qr_url: '', thumbnail_url: '' });
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEvent({ ...newEvent, thumbnail_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 py-8 space-y-8 pb-12">
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">Organiser Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Create Actions */}
        <div className="lg:col-span-1 space-y-8">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-display font-bold text-gray-900 mb-4">1. Create Venue</h2>
            <p className="text-sm text-gray-500 mb-4">Define a new venue and its seat capacity.</p>
            <form onSubmit={handleCreateVenue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                <input type="text" required value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location / City</label>
                <input type="text" required value={newVenue.location} onChange={e => setNewVenue({...newVenue, location: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Seat Capacity</label>
                <input type="number" required value={newVenue.capacity} onChange={e => setNewVenue({...newVenue, capacity: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none" placeholder="e.g. 100" />
              </div>
              <button type="submit" className="w-full bg-gray-900 text-white rounded-xl py-3 font-bold hover:bg-gray-800 transition-colors">Add Venue</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-display font-bold text-gray-900 mb-4">2. Create Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input type="text" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category (e.g. Concert, Comedy)</label>
                <input type="text" required value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Venue</label>
                <select required value={newEvent.venue_id} onChange={e => setNewEvent({...newEvent, venue_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none appearance-none">
                  <option value="">Choose...</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.location})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="datetime-local" required value={newEvent.start_time} onChange={e => setNewEvent({...newEvent, start_time: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm text-gray-900 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                  <input type="datetime-local" required value={newEvent.end_time} onChange={e => setNewEvent({...newEvent, end_time: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm text-gray-900 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank / Payment Details (Optional)</label>
                <textarea placeholder="e.g. Account No, IFSC, UPI" value={newEvent.payment_details} onChange={e => setNewEvent({...newEvent, payment_details: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment QR URL (Optional)</label>
                <input type="url" placeholder="https://..." value={newEvent.payment_qr_url} onChange={e => setNewEvent({...newEvent, payment_qr_url: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Poster</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-gray-900 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-bms-red hover:file:bg-red-100" 
                />
                {newEvent.thumbnail_url && (
                  <div className="mt-2 text-xs text-green-600 font-semibold">✓ Image selected</div>
                )}
              </div>
              <button type="submit" className="w-full mt-4 bg-bms-red text-white rounded-xl py-3 font-bold hover:bg-bms-hover transition-colors">Publish Event</button>
            </form>
          </div>
        </div>

        {/* Right Column: Manage Events */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 min-h-full">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">3. Manage Your Events</h2>
            
            <div className="space-y-6">
              {Object.values(summaries).length === 0 && (
                <div className="text-center p-12 border border-gray-100 rounded-2xl bg-gray-50">
                  <p className="text-gray-500">You haven't created any events yet.</p>
                </div>
              )}
              {Object.values(summaries).map((sum, idx) => (
                <div key={idx} className="border border-gray-200 p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-display font-bold text-xl text-gray-900 mb-4">{sum.title}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Bookings</div>
                      <div className="text-gray-900 font-bold text-lg">{sum.total_bookings}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                      <div className="text-green-600 text-xs uppercase tracking-wider mb-1">Confirmed</div>
                      <div className="text-green-700 font-bold text-lg">{sum.confirmed_bookings}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                      <div className="text-red-600 text-xs uppercase tracking-wider mb-1">Cancelled</div>
                      <div className="text-red-700 font-bold text-lg">{sum.cancelled_bookings}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <div className="text-blue-600 text-xs uppercase tracking-wider mb-1">Revenue</div>
                      <div className="text-blue-700 font-bold text-lg">₹{sum.revenue}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-5 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <input type="text" placeholder="Category (e.g. Standard)" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-900 flex-1 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none" />
                      <input type="number" placeholder="Price (₹)" value={newCategory.price || ''} onChange={e => setNewCategory({...newCategory, price: Number(e.target.value)})} className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-900 w-32 focus:border-bms-red focus:ring-1 focus:ring-bms-red outline-none" />
                      <button onClick={() => handleAddCategory(sum.id)} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Add Ticket Tier</button>
                    </div>
                    <div>
                      <button onClick={() => handleInstantiate(sum.id)} className="w-full bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-3 rounded-lg text-sm font-bold transition-colors">
                        Instantiate Venue Seats for this Event (Required before selling)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
