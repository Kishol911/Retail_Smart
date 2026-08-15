import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { fetchDashboardStats } from '../utils/billApi';

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard stats.');
      }
    };
    load();
  }, []);

  return (
    <Navbar>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      {!stats ? (
        <p className="text-gray-400">Loading dashboard...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Today's Sales" value={`₹${stats.todaySales.toFixed(2)}`} />
            <StatCard label="Today's Orders" value={stats.todayOrders} />
            <StatCard label="This Month's Sales" value={`₹${stats.monthSales.toFixed(2)}`} />
            <StatCard label="This Month's Orders" value={stats.monthOrders} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow">
              <h2 className="mb-3 font-semibold text-gray-800">Best-Selling Products</h2>
              {stats.bestSellers.length === 0 ? (
                <p className="text-sm text-gray-400">No sales yet.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.bestSellers.map((p, idx) => (
                    <li key={p.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {idx + 1}. {p.name}
                      </span>
                      <span className="text-gray-500">{p.unitsSold} sold</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl bg-white p-5 shadow">
              <h2 className="mb-3 font-semibold text-gray-800">Recent Orders</h2>
              {stats.recentBills.length === 0 ? (
                <p className="text-sm text-gray-400">No orders yet.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.recentBills.map((b) => (
                    <li key={b._id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {new Date(b.date).toLocaleDateString()} — {b.customerName}
                      </span>
                      <span className="font-medium text-gray-800">
                        ₹{b.totalAmount.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </Navbar>
  );
};

export default Dashboard;
