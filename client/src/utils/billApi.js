import api from './api';

export const createBill = async (billData) => {
  const { data } = await api.post('/bills', billData);
  return data;
};

export const fetchBills = async ({ from = '', to = '', search = '' } = {}) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (search) params.search = search;

  const { data } = await api.get('/bills', { params });
  return data;
};

export const fetchBillById = async (id) => {
  const { data } = await api.get(`/bills/${id}`);
  return data;
};

export const fetchDashboardStats = async () => {
  const { data } = await api.get('/dashboard/stats');
  return data;
};
