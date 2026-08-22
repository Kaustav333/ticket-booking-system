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
    { title: 'Holds / Sec', value: metrics.holds_per_second.toFixed(2), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Confirmations / Sec', value: metrics.confirmations_per_second.toFixed(2), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Active Holds', value: metrics.active_holds, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { title: 'TTL Expirations', value: metrics.ttl_expirations, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Cancellations', value: metrics.cancellations, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
    { title: 'Waitlist Size', value: metrics.waitlist_size, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Waitlist Conv. Rate', value: `${metrics.waitlist_conversion_rate.toFixed(1)}%`, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Total Revenue', value: `₹${metrics.revenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
    <div className="max-w-7xl mx-auto p-4 py-8 space-y-8 pb-12">
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">Admin Observability Dashboard</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-200 p-5 flex items-center hover:shadow-md transition-shadow">
              <div className={`flex-shrink-0 p-3 rounded-xl ${card.bg} ${card.color}`}>
                <Icon className={`h-6 w-6`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                  <dd className="text-2xl font-display font-bold text-gray-900">{card.value}</dd>
                </dl>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-6">Create Venue</h2>
          <form onSubmit={handleCreateVenue} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
              <input type="text" required value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-1 focus:ring-bms-red focus:border-bms-red outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" required value={newVenue.location} onChange={e => setNewVenue({...newVenue, location: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-1 focus:ring-bms-red focus:border-bms-red outline-none" />
            </div>
            <button type="submit" className="w-full mt-2 bg-gray-900 text-white rounded-xl py-3 font-bold hover:bg-gray-800 transition-colors">Create Venue</button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-6">Add Seats to Layout</h2>
          <form onSubmit={handleAddSeat} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Venue</label>
              <select required value={newSeat.venueId} onChange={e => setNewSeat({...newSeat, venueId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-1 focus:ring-bms-red focus:border-bms-red outline-none appearance-none">
                <option value="">Select Venue...</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input type="text" required value={newSeat.section} onChange={e => setNewSeat({...newSeat, section: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-1 focus:ring-bms-red focus:border-bms-red outline-none" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Row</label>
                  <input type="text" required value={newSeat.row_identifier} onChange={e => setNewSeat({...newSeat, row_identifier: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-1 focus:ring-bms-red focus:border-bms-red outline-none" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seat</label>
                  <input type="text" required value={newSeat.seat_identifier} onChange={e => setNewSeat({...newSeat, seat_identifier: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-1 focus:ring-bms-red focus:border-bms-red outline-none" />
               </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Category</label>
              <input type="text" required value={newSeat.default_category} onChange={e => setNewSeat({...newSeat, default_category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-1 focus:ring-bms-red focus:border-bms-red outline-none" />
            </div>
            <button type="submit" className="w-full mt-2 bg-white border border-gray-200 text-gray-900 rounded-xl py-3 font-bold hover:bg-gray-50 transition-colors">Add Seat</button>
          </form>
        </div>
      </div>
    </div>
  );
}
