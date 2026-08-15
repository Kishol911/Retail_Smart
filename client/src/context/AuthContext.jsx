import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

// Custom hook for easy access to auth state anywhere in the app
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check if a user is already stored in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('smartpos_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Calls the backend login API and stores the returned user + token
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('smartpos_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  // Calls the backend register API (creates the first admin account)
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('smartpos_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  // Sends the Google ID token (from the "Sign in with Google" button) to the backend
  // for verification. Backend creates the account automatically on first sign-in.
  const loginWithGoogle = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('smartpos_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('smartpos_user');
    setUser(null);
  };

  // Merges updated fields (e.g. from Settings > profile edit) into the stored
  // user object, keeping the existing JWT token intact.
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('smartpos_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
