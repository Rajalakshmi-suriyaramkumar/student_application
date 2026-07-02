import React, { useState } from 'react';
import Auth from './components/Auth';
import ProfileCreate from './components/ProfileCreate';
import ProfileView from './components/ProfileView';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [view, setView] = useState('auth');
  const [email, setEmail] = useState('');

  const handleAuth = (userEmail, hasProfile, role) => {
    setEmail(userEmail);
    if (role === 'admin') {
      setView('admin');
      return;
    }
    setView(hasProfile ? 'view' : 'create');
  };

  const handleLogout = () => {
    setEmail('');
    setView('auth');
  };

  const isCentered = view === 'auth' || view === 'create' || view === 'view';

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo">🎓</span>
          <span>EdCounselor</span>
        </div>
        {email && (
          <div className="header-actions">
            <span className="app-user">{email}</span>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </header>

      <main className={`app-main${isCentered ? ' app-main--center' : ''}`}>
        {view === 'auth' && <Auth onAuthSuccess={handleAuth} />}
        {view === 'create' && (
          <ProfileCreate userEmail={email} onProfileComplete={() => setView('view')} />
        )}
        {view === 'view' && <ProfileView userEmail={email} />}
        {view === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
}
