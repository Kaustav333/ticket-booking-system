import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface Seat {
  seat_id: string;
  price: number;
  category: string;
  section: string;
  row_identifier: string;
  seat_identifier: string;
}

interface Booking {
  id: string;
  event_id: string;
  booking_reference: string;
  status: string;
  total_amount: number;
  expires_at: string;
  seats: Seat[];
}

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchBookingAndEvent = async () => {
      try {
        const res = await api.get(`/bookings/${id}`);
        setBooking(res.data);
        const evRes = await api.get(`/events/${res.data.event_id}`);
        setEventData(evRes.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    fetchBookingAndEvent();
  }, [id]);

  useEffect(() => {
    if (!booking || booking.status !== 'HELD' || !booking.expires_at) return;

    const interval = setInterval(() => {
      // API returns UTC time, add 'Z' if missing so JS parses it as UTC correctly
      const expiresString = booking.expires_at.endsWith('Z') ? booking.expires_at : booking.expires_at + 'Z';
      const expires = new Date(expiresString).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(diff);
      if (diff === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      const res = await api.post(`/bookings/${id}/confirm`, { payment_token: 'mock_token' });
      alert(`Booking Confirmed! Reference: ${res.data.booking_reference}`);
      navigate('/bookings');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to confirm booking');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading checkout...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!booking) return null;

  const isExpired = timeLeft === 0 || booking.status !== 'HELD';
  const mins = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const secs = timeLeft !== null ? timeLeft % 60 : 0;

  return (
    <div className="max-w-3xl mx-auto p-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
          {booking.status === 'HELD' && timeLeft !== null && (
            <div className={`px-4 py-2 rounded font-mono font-bold text-lg ${isExpired ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
              {isExpired ? 'EXPIRED' : `${mins}:${secs.toString().padStart(2, '0')}`}
            </div>
          )}
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Booking Reference</h3>
            <p className="text-2xl font-mono font-bold text-gray-900">{booking.booking_reference}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Selected Seats</h3>
            <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
              {booking.seats.map((seat, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Section {seat.section}</p>
                    <p className="text-sm text-gray-500">Row {seat.row_identifier}, Seat {seat.seat_identifier}</p>
                  </div>
                  <div className="font-medium text-gray-900">₹{seat.price}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <span className="text-lg font-bold text-gray-900">Total Amount</span>
            <span className="text-2xl font-bold text-indigo-600">₹{booking.total_amount}</span>
          </div>
          
          {(eventData?.payment_details || eventData?.payment_qr_url) && (
            <div className="bg-indigo-50 rounded-lg p-4 mt-6 border border-indigo-100">
              <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3">Payment Instructions</h3>
              {eventData.payment_details && (
                <div className="whitespace-pre-wrap text-indigo-800 text-sm mb-4">
                  {eventData.payment_details}
                </div>
              )}
              {eventData.payment_qr_url && (
                <div className="flex justify-center">
                  <img src={eventData.payment_qr_url} alt="Payment QR Code" className="max-w-xs rounded shadow-sm" />
                </div>
              )}
              <p className="text-xs text-indigo-600 mt-4 text-center">
                Please complete the payment and then click "Confirm & Pay" below to finalize your booking.
              </p>
            </div>
          )}
          
          {booking.status === 'HELD' ? (
            <button
              onClick={handleConfirm}
              disabled={isExpired || confirming}
              className={`w-full py-4 rounded-lg text-lg font-bold text-white transition shadow-sm
                ${isExpired || confirming 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow'}`}
            >
              {isExpired ? 'Hold Expired' : confirming ? 'Processing...' : 'Confirm Booking'}
            </button>
          ) : (
            <div className="w-full py-4 text-center rounded-lg text-lg font-bold bg-gray-100 text-gray-600">
              Booking is {booking.status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
