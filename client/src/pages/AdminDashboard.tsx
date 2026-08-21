import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Activity, CheckCircle, Clock, AlertTriangle, Users, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center mt-10">Loading metrics...</div>;
  if (!metrics) return <div className="text-center mt-10 text-red-600">Failed to load metrics</div>;

  const cards = [
    { title: 'Holds / Sec', value: metrics.holds_per_second.toFixed(2), icon: Activity, color: 'text-blue-600' },
    { title: 'Confirmations / Sec', value: metrics.confirmations_per_second.toFixed(2), icon: CheckCircle, color: 'text-green-600' },
    { title: 'Active Holds', value: metrics.active_holds, icon: Clock, color: 'text-yellow-600' },
    { title: 'TTL Expirations', value: metrics.ttl_expirations, icon: AlertTriangle, color: 'text-red-600' },
    { title: 'Cancellations', value: metrics.cancellations, icon: AlertTriangle, color: 'text-red-500' },
    { title: 'Waitlist Size', value: metrics.waitlist_size, icon: Users, color: 'text-purple-600' },
    { title: 'Waitlist Conv. Rate', value: `${metrics.waitlist_conversion_rate.toFixed(1)}%`, icon: Activity, color: 'text-indigo-600' },
    { title: 'Total Revenue', value: `$${metrics.revenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Observability Dashboard</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 p-5 flex items-center">
              <div className="flex-shrink-0">
                <Icon className={`h-8 w-8 ${card.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{card.value}</dd>
                </dl>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
