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
  return (
    <div className="app-container">
      {view === 'auth' && <Auth onAuthSuccess={handleAuth} />}
      {view === 'create' && <ProfileCreate userEmail={email} onProfileComplete={() => setView('view')} />}
      {view === 'view' && <ProfileView userEmail={email} />}
      {view === 'admin' && <AdminDashboard />}
    </div>
  );
}
