import api from './api';

// Thin wrappers around the /products endpoints — keeps the Inventory page
// focused on UI logic instead of raw axios calls.

export const fetchProducts = async ({ search = '', category = '', sort = '', order = '' } = {}) => {
  const params = {};
  if (search) params.search = search;
  if (category) params.category = category;
  if (sort) params.sort = sort;
  if (order) params.order = order;

  const { data } = await api.get('/products', { params });
  return data;
};

// Checks if a product with this exact name already exists — used by the
// Add Product modal to decide whether to create new or restock existing.
export const checkExistingProduct = async (name) => {
  const { data } = await api.get('/products/check', { params: { name } });
  return data; // { exists, product }
};

export const createProduct = async (product) => {
  const { data } = await api.post('/products', product);
  return data;
};

// Adds `addQuantity` on top of the current stock for a product found by
// its productId (e.g. "E1") or exact name.
export const restockProduct = async (identifier, addQuantity) => {
  const { data } = await api.post('/products/restock', { identifier, addQuantity });
  return data;
};

export const updateProduct = async (id, product) => {
  const { data } = await api.put(`/products/${id}`, product);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};
