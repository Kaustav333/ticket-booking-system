import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
  
  
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [presences, setPresences] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const res = await api.get(`/events/${eventId}/map`);
        setSeats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (eventId) fetchSeats();

    socketRef.current = io('http://localhost:8000', { path: '/socket.io' });
    
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
      alert(`Successfully held! Booking Ref: ${res.data.booking_reference}`);
      setSelectedSeats([]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to hold seats. They may have just been taken.');
    }
  };

  const getSeatColor = (status: string, isSelected: boolean) => {
    if (isSelected) return 'bg-indigo-600 text-white';
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 hover:bg-green-200 border-green-300 text-green-800 cursor-pointer';
      case 'HELD': return 'bg-yellow-100 border-yellow-300 text-yellow-800 cursor-not-allowed opacity-60';
      case 'CONFIRMED': return 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed opacity-40';
      case 'WAITLIST_OFFERED': return 'bg-orange-100 border-orange-300 text-orange-800 cursor-not-allowed opacity-60';
      default: return 'bg-gray-100 border-gray-200 text-gray-500';
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Select Your Seats</h2>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
        
        <div className="mb-8 p-4 bg-gray-100 text-center text-gray-400 tracking-[0.5em] rounded">STAGE</div>
        
        <div className="grid grid-cols-10 gap-3">
          {seats.map(seat => {
            const isSelected = selectedSeats.includes(seat.seat_id);
            const isHoveredByOther = presences[seat.seat_id] > 0;
            return (
              <div 
                key={seat.seat_id}
                onMouseEnter={() => handleSeatHover(seat.seat_id)}
                onClick={() => toggleSelection(seat)}
                className={`relative h-12 w-full border rounded-t-lg flex flex-col items-center justify-center text-xs transition-colors ${getSeatColor(seat.status, isSelected)}`}
                title={`${seat.section} Row ${seat.row_identifier} Seat ${seat.seat_identifier} - $${seat.price}`}
              >
                <span className="font-semibold">{seat.row_identifier}{seat.seat_identifier}</span>
                {isHoveredByOther && (
                  <span className="absolute -top-2 -right-2 bg-blue-100 rounded-full p-0.5">
                    <Eye className="h-3 w-3 text-blue-500" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="w-full md:w-80 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
        <h3 className="text-lg font-bold mb-4 border-b pb-2">Selection</h3>
        {selectedSeats.length === 0 ? (
          <p className="text-gray-500 text-sm">No seats selected.</p>
        ) : (
          <div className="space-y-3">
            {selectedSeats.map(id => {
              const seat = seats.find(s => s.seat_id === id);
              return (
                <div key={id} className="flex justify-between text-sm">
                  <span>{seat?.row_identifier}{seat?.seat_identifier} ({seat?.category_name})</span>
                  <span className="font-medium">${seat?.price}</span>
                </div>
              );
            })}
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>
                ${selectedSeats.reduce((sum, id) => {
                  const s = seats.find(st => st.seat_id === id);
                  return sum + (s?.price || 0);
                }, 0)}
              </span>
            </div>
            <button 
              onClick={handleHold}
              className="w-full mt-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition"
            >
              Hold Seats & Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
