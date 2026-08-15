import api from './api';

export const updateProfile = async (profileData) => {
  const { data } = await api.put('/auth/profile', profileData);
  return data;
};

export const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
  const { data } = await api.put('/auth/change-password', {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return data;
};

export const fetchSettings = async () => {
  const { data } = await api.get('/settings');
  return data;
};

export const updateSettings = async (settingsData) => {
  const { data } = await api.put('/settings', settingsData);
  return data;
};
