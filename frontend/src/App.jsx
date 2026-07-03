import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ProfileCreate from './components/ProfileCreate';
import ProfileView from './components/ProfileView';
import AdminDashboard from './components/AdminDashboard';
import AdminGmail from './components/AdminGmail';

const SESSION_KEY = 'edcounselor_session';

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(email, role, view) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, role, view }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export default function App() {
  const [view, setView] = useState('auth');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthView = params.get('view');
    const oauthEmail = params.get('adminEmail');

    if (oauthView === 'admin-gmail') {
      const session = loadSession();
      const restoredEmail = oauthEmail || session?.email || '';
      if (restoredEmail) {
        setEmail(restoredEmail);
        setView('admin-gmail');
        saveSession(restoredEmail, 'admin', 'admin-gmail');
      } else {
        setView('auth');
      }
      window.history.replaceState({}, '', '/');
      return;
    }

    const session = loadSession();
    if (session?.email) {
      setEmail(session.email);
      setView(session.view || (session.role === 'admin' ? 'admin' : 'view'));
    }
  }, []);

  const handleAuth = (userEmail, hasProfile, role) => {
    setEmail(userEmail);
    if (role === 'admin') {
      setView('admin');
      saveSession(userEmail, role, 'admin');
      return;
    }
    const nextView = hasProfile ? 'view' : 'create';
    setView(nextView);
    saveSession(userEmail, role, nextView);
  };

  const handleLogout = () => {
    setEmail('');
    setView('auth');
    clearSession();
  };

  const goToAdminGmail = () => {
    setView('admin-gmail');
    saveSession(email, 'admin', 'admin-gmail');
  };

  const goToAdminDashboard = () => {
    setView('admin');
    saveSession(email, 'admin', 'admin');
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
        {view === 'admin' && (
          <AdminDashboard onOpenGmail={goToAdminGmail} />
        )}
        {view === 'admin-gmail' && (
          <AdminGmail adminEmail={email} onBack={goToAdminDashboard} />
        )}
      </main>
    </div>
  );
}
