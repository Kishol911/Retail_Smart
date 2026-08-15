import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { fetchBills } from '../utils/billApi';
import { downloadInvoicePDF } from '../utils/generateInvoice';

const History = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState(''); // searches by Bill ID or customer phone

  const [selectedBill, setSelectedBill] = useState(null); // for detail modal

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBills({ from, to, search });
      setBills(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sales history.');
    } finally {
      setLoading(false);
    }
  }, [from, to, search]);

  useEffect(() => {
    const timer = setTimeout(loadBills, 300);
    return () => clearTimeout(timer);
  }, [loadBills]);

  return (
    <Navbar>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Sales History</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Search (Bill ID or Phone)
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. BILL-1001 or 9876543210"
            className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        {(from || to || search) && (
          <button
            onClick={() => {
              setFrom('');
              setTo('');
              setSearch('');
            }}
            className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Bill ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total (₹)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  No bills found for this range.
                </td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{bill.billId}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(bill.date).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{bill.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{bill.customerPhone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{bill.items.length} item(s)</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    ₹{bill.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedBill(bill)}
                      className="mr-2 rounded-lg px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      View
                    </button>
                    <button
                      onClick={() => downloadInvoicePDF(bill)}
                      className="rounded-lg px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Bill Detail</h2>
              <button
                onClick={() => setSelectedBill(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="mb-1 text-xs font-mono text-gray-400">{selectedBill.billId}</p>
            <p className="mb-1 text-sm text-gray-500">
              {new Date(selectedBill.date).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Customer: {selectedBill.customerName}</p>
            {selectedBill.customerPhone && (
              <p className="text-sm text-gray-500">Phone: {selectedBill.customerPhone}</p>
            )}
            {selectedBill.customerAddress && (
              <p className="text-sm text-gray-500">Address: {selectedBill.customerAddress}</p>
            )}
            {selectedBill.customerGST && (
              <p className="mb-4 text-sm text-gray-500">GSTIN: {selectedBill.customerGST}</p>
            )}
            {!selectedBill.customerGST && <div className="mb-4" />}

            <div className="max-h-56 space-y-2 overflow-y-auto border-t pt-3">
              {selectedBill.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{selectedBill.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST ({selectedBill.taxRate}%)</span>
                <span>₹{selectedBill.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-800">
                <span>Total</span>
                <span>₹{selectedBill.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => downloadInvoicePDF(selectedBill)}
              className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Download Invoice PDF
            </button>
          </div>
        </div>
      )}
    </Navbar>
  );
};

export default History;
