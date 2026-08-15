import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  updateProfile,
  changePassword,
  fetchSettings,
  updateSettings,
} from '../utils/settingsApi';

const TABS = ['General', 'User & Access Control', 'Report Settings', 'Advanced'];

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-lg px-4 py-2 text-left text-sm font-medium transition ${
      active
        ? 'bg-indigo-600 text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
    }`}
  >
    {label}
  </button>
);

const Card = ({ children }) => (
  <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-800 dark:text-gray-100">
    {children}
  </div>
);

const Field = ({ label, ...props }) => (
  <div className="mb-3">
    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <input
      {...props}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
    />
  </div>
);

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <Navbar>
      <h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <nav className="flex gap-1 md:flex-col">
          {TABS.map((tab) => (
            <TabButton
              key={tab}
              label={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </nav>

        <div className="md:col-span-3">
          {activeTab === 'General' && <GeneralTab user={user} />}
          {activeTab === 'User & Access Control' && (
            <AccessControlTab user={user} updateUser={updateUser} />
          )}
          {activeTab === 'Report Settings' && <ReportSettingsTab />}
          {activeTab === 'Advanced' && <AdvancedTab theme={theme} toggleTheme={toggleTheme} />}
        </div>
      </div>
    </Navbar>
  );
};

// ---------- General: view profile + shop info ----------
const GeneralTab = ({ user }) => (
  <div className="space-y-4">
    <Card>
      <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">Profile</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between border-b pb-2 dark:border-gray-700">
          <dt className="text-gray-500 dark:text-gray-400">Name</dt>
          <dd className="text-gray-800 dark:text-gray-100">{user?.name || '—'}</dd>
        </div>
        <div className="flex justify-between border-b pb-2 dark:border-gray-700">
          <dt className="text-gray-500 dark:text-gray-400">Email</dt>
          <dd className="text-gray-800 dark:text-gray-100">{user?.email || '—'}</dd>
        </div>
        <div className="flex justify-between border-b pb-2 dark:border-gray-700">
          <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
          <dd className="text-gray-800 dark:text-gray-100">{user?.phone || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500 dark:text-gray-400">Login method</dt>
          <dd className="text-gray-800 dark:text-gray-100">
            {user?.avatar ? 'Google' : 'Email & Password'}
          </dd>
        </div>
      </dl>
    </Card>

    <Card>
      <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">About the Shop</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between border-b pb-2 dark:border-gray-700">
          <dt className="text-gray-500 dark:text-gray-400">Shop Name</dt>
          <dd className="text-gray-800 dark:text-gray-100">{user?.shopName || '—'}</dd>
        </div>
        <div className="flex justify-between border-b pb-2 dark:border-gray-700">
          <dt className="text-gray-500 dark:text-gray-400">Shop Address</dt>
          <dd className="text-gray-800 dark:text-gray-100">{user?.shopAddress || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500 dark:text-gray-400">Shop GST Number</dt>
          <dd className="text-gray-800 dark:text-gray-100">{user?.shopGST || '—'}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-gray-400">
        Edit these under "User & Access Control".
      </p>
    </Card>
  </div>
);

// ---------- User & Access Control: edit profile + change password ----------
const AccessControlTab = ({ user, updateUser }) => {
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    shopAddress: user?.shopAddress || '',
    shopGST: user?.shopGST || '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    setSavingProfile(true);
    try {
      const updated = await updateProfile(form);
      updateUser(updated);
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwError('');
    setSavingPw(true);
    try {
      await changePassword(pwForm);
      setPwMsg('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">
          Add / Edit Profile
        </h2>
        {profileError && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {profileError}
          </div>
        )}
        {profileMsg && (
          <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {profileMsg}
          </div>
        )}
        <form onSubmit={handleProfileSubmit}>
          <Field
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Field
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Field
            label="Shop Address"
            value={form.shopAddress}
            onChange={(e) => setForm({ ...form, shopAddress: e.target.value })}
          />
          <Field
            label="Shop's GST Number"
            value={form.shopGST}
            onChange={(e) => setForm({ ...form, shopGST: e.target.value })}
          />
          <button
            type="submit"
            disabled={savingProfile}
            className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">Change Password</h2>
        {!user?.avatar ? (
          <>
            {pwError && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {pwError}
              </div>
            )}
            {pwMsg && (
              <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                {pwMsg}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit}>
              <Field
                label="Current Password"
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              />
              <Field
                label="New Password"
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              />
              <Field
                label="Confirm New Password"
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              />
              <button
                type="submit"
                disabled={savingPw}
                className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {savingPw ? 'Saving...' : 'Change Password'}
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This account signs in with Google, so there's no password to change.
          </p>
        )}
      </Card>
    </div>
  );
};

// ---------- Report Settings ----------
const ReportSettingsTab = () => {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSettings();
        setSettings(data);
      } catch (err) {
        setError('Failed to load report settings.');
      }
    };
    load();
  }, []);

  const handleChange = async (partial) => {
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const updated = await updateSettings(partial);
      setSettings(updated);
      setMsg('Settings saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <Card>
        <p className="text-sm text-gray-400">{error || 'Loading...'}</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">Report Settings</h2>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}
      {msg && (
        <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>
      )}

      <div className="space-y-4 text-sm">
        <label className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">Enable Reports</span>
          <input
            type="checkbox"
            checked={settings.reportsEnabled}
            disabled={saving}
            onChange={(e) => handleChange({ reportsEnabled: e.target.checked })}
            className="h-4 w-4"
          />
        </label>

        <div>
          <label className="mb-1 block text-gray-700 dark:text-gray-300">Export Format</label>
          <select
            value={settings.exportFormat}
            disabled={saving}
            onChange={(e) => handleChange({ exportFormat: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="PDF">PDF</option>
            <option value="Excel">Excel</option>
          </select>
        </div>

        <label className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">Auto Monthly Report Generation</span>
          <input
            type="checkbox"
            checked={settings.autoMonthlyReport}
            disabled={saving}
            onChange={(e) => handleChange({ autoMonthlyReport: e.target.checked })}
            className="h-4 w-4"
          />
        </label>
      </div>
    </Card>
  );
};

// ---------- Advanced: theme ----------
const AdvancedTab = ({ theme, toggleTheme }) => (
  <Card>
    <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">Theme</h2>
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700 dark:text-gray-300">
        Currently using <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong> mode
      </span>
      <button
        onClick={toggleTheme}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
      </button>
    </div>
  </Card>
);

export default Settings;
