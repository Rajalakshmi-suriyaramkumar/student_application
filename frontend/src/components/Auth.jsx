import React, { useState } from 'react';

export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp && form.password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    const url = isSignUp ? '/api/register' : '/api/login';
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      onAuthSuccess(data.email, data.hasProfile || false, data.role || 'student');
    } catch (err) {
      alert(err.message || 'Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-card page-card--narrow">
      <h2 className="page-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
      <p className="page-subtitle">
        {isSignUp ? 'Register your student account' : 'Sign in to access your dashboard'}
      </p>

      <form onSubmit={handleSubmit} className="form-group">
        {isSignUp && (
          <>
            <input
              name="firstName"
              className="styled-input"
              type="text"
              placeholder="First Name"
              required
              onChange={handleChange}
            />
            <input
              name="lastName"
              className="styled-input"
              type="text"
              placeholder="Last Name"
              required
              onChange={handleChange}
            />
          </>
        )}
        <input
          name="email"
          className="styled-input"
          type="email"
          placeholder="Email address"
          required
          onChange={handleChange}
        />
        <input
          name="password"
          className="styled-input"
          type="password"
          placeholder="Password"
          required
          onChange={handleChange}
        />
        {isSignUp && (
          <input
            className="styled-input"
            type="password"
            placeholder="Confirm Password"
            required
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <p className="link-text" onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Register Here'}
      </p>
    </div>
  );
}
