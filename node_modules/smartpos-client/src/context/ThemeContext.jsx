import { createContext, useContext, useState, useEffect } from 'react';
import { updateProfile } from '../utils/settingsApi';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('smartpos_theme') || 'light');

  // Apply/remove the 'dark' class on <html> whenever theme changes — this is
  // what Tailwind's darkMode: 'class' setting looks for.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('smartpos_theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    // Best-effort sync to backend so the preference follows the user's account.
    try {
      await updateProfile({ theme: next });
    } catch (err) {
      // Non-critical — theme still works locally even if this fails.
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
