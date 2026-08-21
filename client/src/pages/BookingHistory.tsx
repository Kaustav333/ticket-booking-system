import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface Booking {
  id: string;
  event_id: string;
  booking_reference: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings/history');
        setBookings(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      alert('Booking cancelled successfully');
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel booking');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-400 bg-navy-800 rounded-2xl border border-white/10 max-w-4xl mx-auto mt-8">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      <h1 className="text-3xl font-display font-bold text-white mb-8">My Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="bg-navy-800 rounded-3xl shadow-xl border border-white/5 p-12 text-center text-gray-400">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-indigo-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          You have no bookings yet. <br />
          <Link to="/events" className="text-indigo-400 hover:text-indigo-300 transition-colors mt-4 inline-block font-medium">Browse Events</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-navy-800 rounded-2xl shadow-xl border border-white/5 p-6 md:p-8 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:border-indigo-500/30 transition-colors group">
              <div className="mb-6 sm:mb-0">
                <div className="flex items-center space-x-4 mb-3">
                  <span className="font-mono font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">{booking.booking_reference}</span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border
                    ${booking.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                      booking.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-1">Total: <span className="font-medium text-white">₹{booking.total_amount}</span></p>
                <p className="text-sm text-gray-500">Created: {new Date(booking.created_at + 'Z').toLocaleString()}</p>
              </div>
              
              <div className="flex space-x-3">
                {booking.status === 'HELD' && (
                  <Link
                    to={`/checkout/${booking.id}`}
                    className="px-6 py-2.5 border border-indigo-500 text-indigo-400 rounded-full hover:bg-indigo-500 hover:text-white font-medium transition-all text-sm"
                  >
                    Resume Checkout
                  </Link>
                )}
                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="px-6 py-2.5 border border-red-500/50 text-red-400 rounded-full hover:bg-red-500 hover:text-white font-medium transition-all text-sm"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
