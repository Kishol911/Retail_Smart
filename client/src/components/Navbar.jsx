import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-blue-500 text-white'
      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
  }`;

const linkClassProfile = ({ isActive }) =>
  `rounded-lg px-1 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-blue-200 text-white'
      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
  }`;
// Wraps every authenticated page with a consistent top nav + logout.
// Usage: <Navbar><ActualPageContent /></Navbar>
const Navbar = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="border-b bg-white px-6 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-indigo-600">Empress-XT</span>
            <nav className="flex gap-1">
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/inventory" className={linkClass}>
                Inventory
              </NavLink>
              <NavLink to="/billing" className={linkClass}>
                Billing
              </NavLink>
              <NavLink to="/history" className={linkClass}>
                History
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-1">
            {user?.avatar && (
             <NavLink to="/settings" className={linkClassProfile}>
              <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
              </NavLink>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-300">{user?.name}</span>
            <button
              onClick={logout}
              className="ml-4 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
};

export default Navbar;
