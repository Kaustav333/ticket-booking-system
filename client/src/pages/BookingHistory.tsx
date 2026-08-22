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
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bms-red"></div>
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-200 max-w-4xl mx-auto mt-8">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Looks like you're new here!</h2>
          <p className="mb-6">You haven't booked any tickets yet. Catch the latest movies, plays, and events now.</p>
          <Link to="/" className="bg-bms-red text-white px-8 py-3 rounded-md font-medium hover:bg-bms-hover transition-colors inline-block">
            Start Booking
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:shadow-md transition-shadow group">
              <div className="mb-6 sm:mb-0">
                <div className="flex items-center space-x-4 mb-3">
                  <span className="font-mono font-bold text-xl text-gray-900">{booking.booking_reference}</span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border
                    ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 border-green-200' : 
                      booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700 border-red-200' : 
                      'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Total Amount: <span className="font-semibold text-gray-900">₹{booking.total_amount}</span></p>
                <p className="text-sm text-gray-400">Booked on: {new Date(booking.created_at + 'Z').toLocaleString()}</p>
              </div>
              
              <div className="flex space-x-3">
                {booking.status === 'HELD' && (
                  <Link
                    to={`/checkout/${booking.id}`}
                    className="px-6 py-2 border border-bms-red text-bms-red rounded-md hover:bg-bms-red hover:text-white font-medium transition-colors text-sm"
                  >
                    Resume Checkout
                  </Link>
                )}
                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="px-6 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium transition-colors text-sm"
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
