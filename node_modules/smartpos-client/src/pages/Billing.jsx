import { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { fetchProducts } from '../utils/productApi';
import { createBill } from '../utils/billApi';
import { downloadInvoicePDF } from '../utils/generateInvoice';

const GST_RATE = 18; // India-specific default GST %. Adjustable per bill below.

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [sortAZ, setSortAZ] = useState(false); // A-Z filter toggle for the product picker
  const [cart, setCart] = useState([]); // [{ productId, name, price, stock, quantity }]
  const [taxRate, setTaxRate] = useState(GST_RATE);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGST, setCustomerGST] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastBill, setLastBill] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        setError('Failed to load products.');
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (search) {
      list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (sortAZ) {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, search, sortAZ]);

  const addToCart = (product) => {
    if (product.quantity <= 0) return; // out of stock

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev; // don't exceed stock
        return prev.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          stock: product.quantity,
          quantity: 1,
        },
      ];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(item.stock, Math.max(1, item.quantity + delta)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const taxAmount = useMemo(() => Math.round(((subtotal * taxRate) / 100) * 100) / 100, [
    subtotal,
    taxRate,
  ]);
  const total = useMemo(() => Math.round((subtotal + taxAmount) * 100) / 100, [
    subtotal,
    taxAmount,
  ]);

  const handleGenerateBill = async () => {
    if (cart.length === 0) return;
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const bill = await createBill({
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        taxRate,
        customerName,
        customerPhone,
        customerGST,
        customerAddress,
      });
      setLastBill(bill);
      setSuccess('Bill generated successfully!');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerGST('');
      setCustomerAddress('');
      // Refresh product list so stock quantities reflect the sale
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate bill.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Navbar>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Billing</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          <span>{success}</span>
          {lastBill && (
            <button
              onClick={() => downloadInvoicePDF(lastBill)}
              className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              Download Invoice PDF
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Product picker */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products to add..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={() => setSortAZ((prev) => !prev)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium ${
                sortAZ
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="Sort products A-Z"
            >
              A-Z
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredProducts.map((p) => (
              <button
                key={p._id}
                onClick={() => addToCart(p)}
                disabled={p.quantity <= 0}
                className="rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-500">₹{p.price.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{p.quantity} in stock</p>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="col-span-full text-sm text-gray-400">No products found.</p>
            )}
          </div>
        </div>

        {/* Cart / invoice summary */}
        <div className="rounded-2xl bg-white p-4 shadow">
          <h2 className="mb-3 font-semibold text-gray-800">Cart</h2>

          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer name (optional)"
            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Customer phone number"
            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            value={customerGST}
            onChange={(e) => setCustomerGST(e.target.value)}
            placeholder="Customer GST number (optional)"
            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="Customer address (optional)"
            className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400">Cart is empty. Click a product to add it.</p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-700">{item.name}</p>
                    <p className="text-xs text-gray-400">₹{item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.productId, -1)}
                      className="h-6 w-6 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      −
                    </button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, 1)}
                      className="h-6 w-6 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span className="flex items-center gap-1">
                GST
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-14 rounded border border-gray-300 px-1 py-0.5 text-xs"
                />
                %
              </span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-gray-800">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleGenerateBill}
            disabled={cart.length === 0 || saving}
            className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Generating...' : 'Generate Bill'}
          </button>
        </div>
      </div>
    </Navbar>
  );
};

export default Billing;
