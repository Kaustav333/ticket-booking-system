import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

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

  if (loading) return <div className="p-8 text-center">Loading bookings...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          You have no bookings yet. <br />
          <Link to="/events" className="text-indigo-600 hover:underline mt-2 inline-block">Browse Events</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="font-mono font-bold text-gray-900">{booking.booking_reference}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full
                    ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                      booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                      'bg-orange-100 text-orange-800'}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Total: ₹{booking.total_amount}</p>
                <p className="text-sm text-gray-500">Created: {new Date(booking.created_at + 'Z').toLocaleString()}</p>
              </div>
              
              <div className="flex space-x-3">
                {booking.status === 'HELD' && (
                  <Link
                    to={`/checkout/${booking.id}`}
                    className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50 font-medium transition text-sm"
                  >
                    Resume Checkout
                  </Link>
                )}
                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 font-medium transition text-sm"
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
