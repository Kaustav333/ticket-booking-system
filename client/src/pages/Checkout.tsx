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

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-400 bg-navy-800 rounded-2xl border border-white/10">{error}</div>;
  if (!booking) return null;

  const isExpired = timeLeft === 0 || booking.status !== 'HELD';
  const mins = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const secs = timeLeft !== null ? timeLeft % 60 : 0;

  return (
    <div className="max-w-3xl mx-auto p-4 py-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl bg-indigo-600/20 rounded-full blur-[100px] z-0 pointer-events-none"></div>
      
      <div className="bg-navy-800 rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative z-10">
        <div className="px-8 py-6 border-b border-white/10 bg-white/5 flex justify-between items-center backdrop-blur-sm">
          <h1 className="text-2xl font-display font-bold text-white">Checkout</h1>
          {booking.status === 'HELD' && timeLeft !== null && (
            <div className={`px-4 py-2 rounded-xl font-mono font-bold text-lg border ${
              isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
            }`}>
              {isExpired ? 'EXPIRED' : `${mins}:${secs.toString().padStart(2, '0')}`}
            </div>
          )}
        </div>
        
        <div className="p-8 space-y-8">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Booking Reference</h3>
            <p className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">{booking.booking_reference}</p>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Selected Seats</h3>
            <div className="divide-y divide-white/10 border-t border-b border-white/10">
              {booking.seats.map((seat, idx) => (
                <div key={idx} className="py-4 flex justify-between items-center group">
                  <div>
                    <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">Section {seat.section}</p>
                    <p className="text-sm text-gray-400">Row {seat.row_identifier}, Seat {seat.seat_identifier}</p>
                  </div>
                  <div className="font-bold text-lg text-white">₹{seat.price}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-xl font-display font-bold text-gray-300">Total Amount</span>
            <span className="text-4xl font-display font-extrabold text-white">₹{booking.total_amount}</span>
          </div>
          
          {(eventData?.payment_details || eventData?.payment_qr_url) && (
            <div className="bg-indigo-900/30 rounded-2xl p-6 mt-8 border border-indigo-500/30">
              <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4">Payment Instructions</h3>
              {eventData.payment_details && (
                <div className="whitespace-pre-wrap text-indigo-100/80 text-sm mb-6 leading-relaxed font-medium bg-black/20 p-4 rounded-xl">
                  {eventData.payment_details}
                </div>
              )}
              {eventData.payment_qr_url && (
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white rounded-2xl shadow-xl">
                    <img src={eventData.payment_qr_url} alt="Payment QR Code" className="w-48 h-48 object-cover rounded-xl" />
                  </div>
                </div>
              )}
              <p className="text-sm text-indigo-300/80 text-center flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complete payment then click confirm below
              </p>
            </div>
          )}
          
          {booking.status === 'HELD' ? (
            <button
              onClick={handleConfirm}
              disabled={isExpired || confirming}
              className={`w-full py-5 rounded-full text-lg font-bold text-white transition-all transform
                ${isExpired || confirming 
                  ? 'bg-gray-700 cursor-not-allowed opacity-70' 
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:-translate-y-1'}`}
            >
              {isExpired ? 'Hold Expired' : confirming ? 'Processing...' : 'Confirm Booking'}
            </button>
          ) : (
            <div className="w-full py-5 text-center rounded-full text-lg font-bold bg-white/5 border border-white/10 text-gray-400">
              Booking is {booking.status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
