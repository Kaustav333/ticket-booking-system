import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Activity, CheckCircle, Clock, AlertTriangle, Users, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<any[]>([]);
  const [newVenue, setNewVenue] = useState({ name: '', location: '' });
  const [newSeat, setNewSeat] = useState({ venueId: '', section: 'Main', row_identifier: '', seat_identifier: '', default_category: 'Standard' });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/admin/metrics');
        setMetrics(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
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
    fetchMetrics();
    fetchVenues();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center mt-10">Loading metrics...</div>;
  if (!metrics) return <div className="text-center mt-10 text-red-600">Failed to load metrics</div>;

  const cards = [
    { title: 'Holds / Sec', value: metrics.holds_per_second.toFixed(2), icon: Activity, color: 'text-blue-600' },
    { title: 'Confirmations / Sec', value: metrics.confirmations_per_second.toFixed(2), icon: CheckCircle, color: 'text-green-600' },
    { title: 'Active Holds', value: metrics.active_holds, icon: Clock, color: 'text-yellow-600' },
    { title: 'TTL Expirations', value: metrics.ttl_expirations, icon: AlertTriangle, color: 'text-red-600' },
    { title: 'Cancellations', value: metrics.cancellations, icon: AlertTriangle, color: 'text-red-500' },
    { title: 'Waitlist Size', value: metrics.waitlist_size, icon: Users, color: 'text-purple-600' },
    { title: 'Waitlist Conv. Rate', value: `${metrics.waitlist_conversion_rate.toFixed(1)}%`, icon: Activity, color: 'text-indigo-600' },
    { title: 'Total Revenue', value: `₹${metrics.revenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-600' },
  ];

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/venues/', newVenue);
      alert('Venue created!');
      setNewVenue({ name: '', location: '' });
      const res = await api.get('/venues/');
      setVenues(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create venue');
    }
  };

  const handleAddSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/venues/${newSeat.venueId}/seats`, [{
        section: newSeat.section,
        row_identifier: newSeat.row_identifier,
        seat_identifier: newSeat.seat_identifier,
        default_category: newSeat.default_category
      }]);
      alert('Seat layout added!');
      setNewSeat({ ...newSeat, seat_identifier: '' }); // keep row, increment seat mentally
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add seat');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Observability Dashboard</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 p-5 flex items-center">
              <div className="flex-shrink-0">
                <Icon className={`h-8 w-8 ${card.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{card.value}</dd>
                </dl>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Create Venue</h2>
          <form onSubmit={handleCreateVenue} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Venue Name</label>
              <input type="text" required value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input type="text" required value={newVenue.location} onChange={e => setNewVenue({...newVenue, location: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white rounded py-2 hover:bg-indigo-700">Create</button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Add Seats to Venue Layout</h2>
          <form onSubmit={handleAddSeat} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Venue</label>
              <select required value={newSeat.venueId} onChange={e => setNewSeat({...newSeat, venueId: e.target.value})} className="w-full border rounded p-2">
                <option value="">Select Venue...</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
               <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <input type="text" required value={newSeat.section} onChange={e => setNewSeat({...newSeat, section: e.target.value})} className="w-full border rounded p-2" />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">Row</label>
                  <input type="text" required value={newSeat.row_identifier} onChange={e => setNewSeat({...newSeat, row_identifier: e.target.value})} className="w-full border rounded p-2" />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">Seat</label>
                  <input type="text" required value={newSeat.seat_identifier} onChange={e => setNewSeat({...newSeat, seat_identifier: e.target.value})} className="w-full border rounded p-2" />
               </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default Category</label>
              <input type="text" required value={newSeat.default_category} onChange={e => setNewSeat({...newSeat, default_category: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white rounded py-2 hover:bg-green-700">Add Seat</button>
          </form>
        </div>
      </div>
    </div>
  );
}
