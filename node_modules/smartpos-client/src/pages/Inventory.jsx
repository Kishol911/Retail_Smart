import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../components/Navbar';
import ProductFormModal from '../components/ProductFormModal';
import AddProductModal from '../components/AddProductModal';
import RestockModal from '../components/RestockModal';
import { fetchProducts, deleteProduct, updateProduct } from '../utils/productApi';

// Small clickable column header with an A-Z / Z-A sort toggle.
const SortableHeader = ({ label, field, sort, order, onSort }) => {
  const active = sort === field;
  return (
    <th
      className="cursor-pointer select-none px-4 py-3 hover:text-gray-700"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={active ? 'text-indigo-600' : 'text-gray-300'}>
          {active && order === 'desc' ? '▼' : '▲'}
        </span>
      </span>
    </th>
  );
};

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('');
  const [order, setOrder] = useState('asc');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [restockModalOpen, setRestockModalOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchProducts({
        search,
        category: category === 'All' ? '' : category,
        sort,
        order,
      });
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, order]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category));
    return ['All', ...unique];
  }, [products]);

  const handleSort = (field) => {
    if (sort === field) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder('asc');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditModalOpen(true);
  };

  const handleEditSave = async (formData) => {
    await updateProduct(editingProduct._id, formData);
    await loadProducts();
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product._id);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  return (
    <Navbar>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setRestockModalOpen(true)}
            className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Restock by ID/Name
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add Product
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name..."
          className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <SortableHeader label="Name" field="name" sort={sort} order={order} onSort={handleSort} />
              <th className="px-4 py-3">Category</th>
              <SortableHeader label="Price (₹)" field="price" sort={sort} order={order} onSort={handleSort} />
              <SortableHeader label="Quantity" field="quantity" sort={sort} order={order} onSort={handleSort} />
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No products found. Click "Add Product" to create one.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.productId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 text-gray-600">₹{p.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.quantity === 0
                          ? 'bg-red-100 text-red-600'
                          : p.quantity < 10
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {p.quantity} in stock
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEditModal(p)}
                      className="mr-2 rounded-lg px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="rounded-lg px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductFormModal
        open={editModalOpen}
        initialData={editingProduct}
        onClose={() => setEditModalOpen(false)}
        onSave={handleEditSave}
      />
      <AddProductModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSaved={loadProducts}
      />
      <RestockModal
        open={restockModalOpen}
        onClose={() => setRestockModalOpen(false)}
        onSaved={loadProducts}
      />
    </Navbar>
  );
};

export default Inventory;
