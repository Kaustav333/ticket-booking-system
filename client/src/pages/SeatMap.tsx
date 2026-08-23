import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import api from '../lib/api';
import { Eye } from 'lucide-react';

interface Seat {
  seat_id: string;
  section: string;
  row_identifier: string;
  seat_identifier: string;
  price: number;
  category_name: string;
  status: 'AVAILABLE' | 'HELD' | 'CONFIRMED' | 'WAITLIST_OFFERED';
}

export default function SeatMap() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  
  const [seats, setSeats] = useState<Seat[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string, price: number}[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [presences, setPresences] = useState<Record<string, number>>({});
  const [waitlistCategory, setWaitlistCategory] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState('');
  const [error, setError] = useState('');
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const res = await api.get(`/events/${eventId}/map`);
        setSeats(res.data);
        const catRes = await api.get(`/events/${eventId}/categories`);
        setCategories(catRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (eventId) fetchSeats();

    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8000';
    socketRef.current = io(baseUrl, { path: '/socket.io' });
    
    socketRef.current.on('connect', () => {
      socketRef.current?.emit('join_event_room', { event_id: eventId });
    });

    socketRef.current.on('seat_update', (data: any) => {
      setSeats(prev => prev.map(s => s.seat_id === data.seat_id ? { ...s, status: data.status } : s));
      if (data.status !== 'AVAILABLE') {
        setSelectedSeats(prev => prev.filter(id => id !== data.seat_id));
      }
    });

    socketRef.current.on('seat_presence', (data: any) => {
      setPresences(prev => ({ ...prev, [data.seat_id]: data.viewer_count }));
      setTimeout(() => {
         setPresences(prev => ({ ...prev, [data.seat_id]: 0 }));
      }, 3000);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [eventId]);

  const handleSeatHover = (seatId: string) => {
    socketRef.current?.emit('seat_hover', { event_id: eventId, seat_id: seatId });
  };

  const toggleSelection = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') return;
    if (selectedSeats.includes(seat.seat_id)) {
      setSelectedSeats(prev => prev.filter(id => id !== seat.seat_id));
    } else {
      setSelectedSeats(prev => [...prev, seat.seat_id]);
    }
  };

  const handleHold = async () => {
    try {
      setError('');
      const res = await api.post('/bookings/hold', { event_id: eventId, seat_ids: selectedSeats });
      setSelectedSeats([]);
      navigate(`/checkout/${res.data.booking_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to hold seats. They may have just been taken.');
    }
  };

  const handleJoinWaitlist = async () => {
    if (!waitlistCategory) return;
    try {
      setError('');
      setWaitlistSuccess('');
      await api.post(`/events/${eventId}/waitlist`, { category_id: waitlistCategory });
      setWaitlistSuccess('Successfully joined the waitlist for this category! You will be emailed if a seat becomes available.');
      setWaitlistCategory('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to join waitlist.');
    }
  };


  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-12">
      <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Select Your Seats</h2>
          
          <div className="flex space-x-4 text-xs font-medium">
            <div className="flex items-center"><span className="w-3 h-3 rounded bg-white border border-green-500 mr-2"></span>Available</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400 mr-2"></span>Held</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded bg-gray-200 border border-gray-300 mr-2"></span>Booked</div>
          </div>
        </div>
        
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl">{error}</div>}
        
        <div className="mb-16 relative w-full flex justify-center">
          {/* Curved Stage matching BookMyShow */}
          <div className="w-2/3 h-12 bg-gradient-to-b from-gray-100 to-transparent border-t-[3px] border-bms-red rounded-t-[50%] flex items-center justify-center">
             <span className="text-gray-400 font-semibold tracking-[0.5em] text-sm mt-2">STAGE</span>
          </div>
        </div>
        
        <div className="flex flex-col items-center space-y-4 max-w-4xl mx-auto overflow-x-auto pb-4">
          {Object.entries(
            seats.reduce((acc, seat) => {
              if (!acc[seat.row_identifier]) acc[seat.row_identifier] = [];
              acc[seat.row_identifier].push(seat);
              return acc;
            }, {} as Record<string, Seat[]>)
          )
          .sort(([rowA], [rowB]) => rowA.localeCompare(rowB)) // Sort rows A-Z
          .map(([rowId, rowSeats]) => (
            <div key={rowId} className="flex items-center space-x-4">
              <div className="w-6 text-center font-bold text-gray-400 text-sm">{rowId}</div>
              <div className="flex space-x-2">
                {rowSeats
                  .sort((a, b) => parseInt(a.seat_identifier) - parseInt(b.seat_identifier)) // Sort 1-10
                  .map(seat => {
                  const isSelected = selectedSeats.includes(seat.seat_id);
                  const isHoveredByOther = presences[seat.seat_id] > 0;
                  
                  // Clean minimalist BookMyShow style blocks
                  let styleClass = 'bg-white border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-600'; // Default Available
                  if (isSelected) styleClass = 'bg-green-500 border-green-500 text-white shadow-md';
                  else if (seat.status === 'HELD') styleClass = 'bg-yellow-100 border-yellow-400 text-yellow-700 cursor-not-allowed opacity-70';
                  else if (seat.status === 'CONFIRMED' || seat.status === 'WAITLIST_OFFERED') styleClass = 'bg-gray-200 border-gray-300 text-transparent cursor-not-allowed';

                  return (
                    <div 
                      key={seat.seat_id}
                      onMouseEnter={() => handleSeatHover(seat.seat_id)}
                      onClick={() => toggleSelection(seat)}
                      className={`relative h-8 w-8 md:h-9 md:w-9 border rounded-md flex flex-col items-center justify-center text-[11px] font-medium transition-all duration-150 cursor-pointer ${styleClass}`}
                      title={`${seat.category_name} - ₹${seat.price}`}
                    >
                      <span>{seat.seat_identifier}</span>
                      {isHoveredByOther && (
                        <span className="absolute -top-2 -right-2 bg-blue-100 rounded-full p-0.5 border border-blue-300">
                          <Eye className="h-3 w-3 text-blue-500" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h3>
          {selectedSeats.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50">
              No seats selected.
            </div>
          ) : (
            <div className="space-y-4">
              {selectedSeats.map(id => {
                const seat = seats.find(s => s.seat_id === id);
                return (
                  <div key={id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <div className="font-semibold text-gray-900">{seat?.row_identifier}{seat?.seat_identifier}</div>
                      <div className="text-xs text-gray-500">{seat?.category_name}</div>
                    </div>
                    <span className="font-bold text-gray-900">₹{seat?.price}</span>
                  </div>
                );
              })}
              <div className="pt-4 mt-4 border-t border-gray-200 flex justify-between font-bold text-lg">
                <span className="text-gray-900">Total Amount</span>
                <span className="text-bms-red">
                  ₹{selectedSeats.reduce((sum, id) => {
                    const s = seats.find(st => st.seat_id === id);
                    return sum + (s?.price || 0);
                  }, 0)}
                </span>
              </div>
              <button 
                onClick={handleHold}
                className="w-full mt-6 py-3.5 bg-bms-red text-white rounded-lg font-bold hover:bg-bms-hover transition-colors"
              >
                Proceed to Pay
              </button>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200">
          <h3 className="text-lg font-display font-bold text-gray-900 mb-2">Sold Out? Join Waitlist</h3>
          <p className="text-sm text-gray-500 mb-6">We'll notify you if someone cancels their ticket.</p>
          {waitlistSuccess && <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm">{waitlistSuccess}</div>}
          <select 
            value={waitlistCategory} 
            onChange={(e) => setWaitlistCategory(e.target.value)}
            className="w-full mb-4 px-4 py-3 bg-gray-50 border border-white/10 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="">Select Category...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name} (₹{c.price})</option>
            ))}
          </select>
          <button 
            onClick={handleJoinWaitlist}
            disabled={!waitlistCategory}
            className="w-full py-3 bg-white/5 border border-white/10 text-gray-900 rounded-full font-medium hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Waitlist
          </button>
        </div>
      </div>
    </div>
  );
}
