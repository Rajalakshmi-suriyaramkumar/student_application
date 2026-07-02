import React, { useState } from 'react';
export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp && form.password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    const url = isSignUp ? '/api/register' : '/api/login';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }
      onAuthSuccess(data.email, data.hasProfile || false, data.role || 'student');
    } catch (err) {
      alert(err.message || "Network error. Please try again later.");
    }
  };
  return (
    <div className="styled-card">
      <h2 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '24px' }}>
        {isSignUp ? "Create Account" : "Welcome Back"}
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
        {isSignUp ? "Register your student account" : "Sign in to access your dashboard"}
      </p>
      <form onSubmit={handleSubmit} className="form-group">
        {isSignUp && (
          <>
            <input name="firstName" className="styled-input" type="text" placeholder="First Name" required onChange={handleChange} />
            <input name="lastName" className="styled-input" type="text" placeholder="Last Name" required onChange={handleChange} />
          </>
        )}
        <input name="email" className="styled-input" type="email" placeholder="Email" required onChange={handleChange} />
        <input name="password" className="styled-input" type="password" placeholder="Password" required onChange={handleChange} />
        {isSignUp && (
          <input className="styled-input" type="password" placeholder="Confirm Password" required onChange={e => setConfirmPassword(e.target.value)} />
        )}
        <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
          {isSignUp ? "Sign Up" : "Log In"}
        </button>
      </form>
      <p onClick={() => setIsSignUp(!isSignUp)} style={{ color: 'var(--primary-color)', cursor: 'pointer', textAlign: 'center', fontSize: '14px', marginTop: '20px', fontWeight: '500' }}>
        {isSignUp ? "Already have an account? Sign In" : "Need an account? Register Here"}
      </p>
    </div>
  );
}
