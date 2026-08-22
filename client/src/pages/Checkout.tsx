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
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | null>(null);

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
    if (!paymentMethod) {
      alert("Please select a payment method first.");
      return;
    }
    try {
      setConfirming(true);
      const res = await api.post(`/bookings/${id}/confirm`, { payment_token: `mock_token_${paymentMethod}` });
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
  if (error) return <div className="p-8 text-center text-red-400 bg-white rounded-2xl border border-white/10">{error}</div>;
  if (!booking) return null;

  const isExpired = timeLeft === 0 || booking.status !== 'HELD';
  const mins = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const secs = timeLeft !== null ? timeLeft % 60 : 0;

  return (
    <div className="max-w-3xl mx-auto p-4 py-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl bg-indigo-600/20 rounded-full blur-[100px] z-0 pointer-events-none"></div>
      
      <div className="bg-white rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative z-10">
        <div className="px-8 py-6 border-b border-white/10 bg-gray-50 flex justify-between items-center backdrop-blur-sm">
          <h1 className="text-2xl font-display font-bold text-gray-900">Checkout</h1>
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
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Booking Reference</h3>
            <p className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">{booking.booking_reference}</p>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Selected Seats</h3>
            <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
              {booking.seats.map((seat, idx) => (
                <div key={idx} className="py-4 flex justify-between items-center group">
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Section {seat.section}</p>
                    <p className="text-sm text-gray-500">Row {seat.row_identifier}, Seat {seat.seat_identifier}</p>
                  </div>
                  <div className="font-bold text-lg text-gray-900">₹{seat.price}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-xl font-display font-bold text-gray-500">Total Amount</span>
            <span className="text-4xl font-display font-extrabold text-gray-900">₹{booking.total_amount}</span>
          </div>

          {/* Payment Method Selection */}
          <div className="pt-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button 
                onClick={() => setPaymentMethod('UPI')}
                className={`p-4 rounded-xl border-2 font-bold transition-all ${paymentMethod === 'UPI' ? 'border-bms-red text-bms-red bg-red-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                UPI / QR Code
              </button>
              <button 
                onClick={() => setPaymentMethod('CARD')}
                className={`p-4 rounded-xl border-2 font-bold transition-all ${paymentMethod === 'CARD' ? 'border-bms-red text-bms-red bg-red-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                Credit/Debit Card
              </button>
              <button 
                onClick={() => setPaymentMethod('NET_BANKING')}
                className={`p-4 rounded-xl border-2 font-bold transition-all ${paymentMethod === 'NET_BANKING' ? 'border-bms-red text-bms-red bg-red-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                Net Banking
              </button>
            </div>
          </div>

          {/* Conditional Payment UI based on selection */}
          {paymentMethod === 'UPI' && (eventData?.payment_details || eventData?.payment_qr_url) && (
            <div className="bg-gray-50 rounded-2xl p-6 mt-4 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4">Scan QR to Pay</h3>
              {eventData.payment_details && (
                <div className="whitespace-pre-wrap text-gray-600 text-sm mb-6 leading-relaxed font-medium bg-white p-4 rounded-xl border border-gray-100">
                  {eventData.payment_details}
                </div>
              )}
              {eventData.payment_qr_url && (
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <img src={eventData.payment_qr_url} alt="Payment QR Code" className="w-48 h-48 object-cover rounded-xl" />
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complete payment then click confirm below
              </p>
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div className="bg-gray-50 rounded-2xl p-6 mt-4 border border-gray-200 space-y-4">
               <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-2">Card Details</h3>
               <input type="text" placeholder="Card Number" className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-bms-red" />
               <div className="flex gap-4">
                  <input type="text" placeholder="MM/YY" className="w-1/2 p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-bms-red" />
                  <input type="text" placeholder="CVV" className="w-1/2 p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-bms-red" />
               </div>
               <input type="text" placeholder="Name on Card" className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-bms-red" />
            </div>
          )}

          {paymentMethod === 'NET_BANKING' && (
            <div className="bg-gray-50 rounded-2xl p-6 mt-4 border border-gray-200 space-y-4">
               <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-2">Select Bank</h3>
               <select className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-bms-red appearance-none bg-white">
                  <option>State Bank of India</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
               </select>
            </div>
          )}
          
          {booking.status === 'HELD' ? (
            <button
              onClick={handleConfirm}
              disabled={isExpired || confirming || !paymentMethod}
              className={`w-full py-5 rounded-full text-lg font-bold transition-all transform
                ${isExpired || confirming || !paymentMethod
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-bms-red text-white hover:bg-bms-hover hover:shadow-lg hover:-translate-y-1'}`}
            >
              {isExpired ? 'Hold Expired' : confirming ? 'Processing...' : !paymentMethod ? 'Select Payment Method to Continue' : `Pay ₹${booking.total_amount}`}
            </button>
          ) : (
            <div className="w-full py-5 text-center rounded-full text-lg font-bold bg-gray-50 border border-gray-200 text-gray-500">
              Booking is {booking.status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
