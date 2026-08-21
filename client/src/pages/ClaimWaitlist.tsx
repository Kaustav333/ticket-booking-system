import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function ClaimWaitlist() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const claimOffer = async () => {
      try {
        const res = await api.post(`/waitlist/claim/${token}`);
        setSuccess(`Successfully claimed seat! Booking Ref: ${res.data.booking_reference}`);
        setTimeout(() => navigate('/bookings'), 3000);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to claim waitlist offer. It may have expired.');
      } finally {
        setLoading(false);
      }
    };
    claimOffer();
  }, [token, navigate]);

  return (
    <div className="max-w-md mx-auto mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Waitlist Claim</h1>
      {loading ? (
        <div className="text-gray-500">Processing your claim... Please wait.</div>
      ) : error ? (
        <div className="text-red-600 font-medium">{error}</div>
      ) : (
        <div className="text-green-600 font-medium">
          {success}
          <div className="mt-4 text-sm text-gray-500">Redirecting to your bookings...</div>
        </div>
      )}
    </div>
  );
}
