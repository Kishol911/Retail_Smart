import { useState } from 'react';
import { checkExistingProduct, createProduct, restockProduct } from '../utils/productApi';

// Flow:
// 1. User types a product name and clicks "Check"
// 2. If a product with that exact name already exists -> show its details
//    and a single "quantity to add" field (restock only, no other edits here)
// 3. If it doesn't exist -> show the full new-product form (price/qty/category)
const AddProductModal = ({ open, onClose, onSaved }) => {
  const [step, setStep] = useState('name'); // 'name' | 'new' | 'restock'
  const [name, setName] = useState('');
  const [checking, setChecking] = useState(false);
  const [matchedProduct, setMatchedProduct] = useState(null);

  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [restockQty, setRestockQty] = useState('');

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep('name');
    setName('');
    setMatchedProduct(null);
    setPrice('');
    setQuantity('');
    setCategory('');
    setRestockQty('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!open) return null;

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter a product name first.');
      return;
    }
    setError('');
    setChecking(true);
    try {
      const { exists, product } = await checkExistingProduct(name.trim());
      if (exists) {
        setMatchedProduct(product);
        setStep('restock');
      } else {
        setStep('new');
      }
    } catch (err) {
      setError('Failed to check product. Try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    if (price === '' || quantity === '' || !category) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createProduct({
        name: name.trim(),
        price: Number(price),
        quantity: Number(quantity),
        category: category.trim(),
      });
      onSaved();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockQty || Number(restockQty) <= 0) {
      setError('Enter a valid quantity to add.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await restockProduct(matchedProduct.productId, Number(restockQty));
      onSaved();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restock product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Add Product</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        {step === 'name' && (
          <form onSubmit={handleCheck} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Product Name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. RAM 16GB DDR5"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                We'll check if this product already exists in your inventory.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={checking}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {checking ? 'Checking...' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {step === 'new' && (
          <form onSubmit={handleCreateNew} className="space-y-3">
            <div className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
              "{name}" is a new product — a unique ID will be assigned automatically.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Electronics"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="mt-5 flex justify-between">
              <button
                type="button"
                onClick={() => setStep('name')}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
              >
                ← Back
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Add Product'}
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 'restock' && matchedProduct && (
          <form onSubmit={handleRestock} className="space-y-3">
            <div className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              "{matchedProduct.name}" already exists (ID: <strong>{matchedProduct.productId}</strong>,
              current stock: {matchedProduct.quantity}). You can only add stock — other details
              can be changed via Edit.
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Quantity to add
              </label>
              <input
                type="number"
                min="1"
                autoFocus
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="mt-5 flex justify-between">
              <button
                type="button"
                onClick={() => setStep('name')}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
              >
                ← Back
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Restock'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddProductModal;
