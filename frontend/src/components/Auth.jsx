import React, { useState } from 'react';

function getPasswordError(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character (e.g. @ # $ !).';
  }
  return '';
}

export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isSignUp) {
      const passwordError = getPasswordError(form.password);
      if (passwordError) {
        setErrorMessage(passwordError);
        return;
      }
      if (form.password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please check and try again.');
        return;
      }
    }

    const apiUrl = isSignUp ? '/api/register' : '/api/login';
    setLoading(true);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      onAuthSuccess(data.email, data.hasProfile || false, data.role || 'student');
    } catch (error) {
      setErrorMessage(error.message || 'Network error. Please check your connection.');
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

      {errorMessage && (
        <p className="form-error" role="alert">{errorMessage}</p>
      )}

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
          placeholder={isSignUp ? 'Password (8+ chars, Aa1@)' : 'Password'}
          minLength={isSignUp ? 8 : undefined}
          required
          onChange={handleChange}
        />
        {isSignUp && (
          <>
            <p className="password-hint">
              Use 8+ characters with uppercase, lowercase, number, and symbol.
            </p>
            <input
              className="styled-input"
              type="password"
              placeholder="Confirm Password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorMessage('');
              }}
            />
          </>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <p className="link-text" onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); setConfirmPassword(''); }}>
        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Register Here'}
      </p>
    </div>
  );
}
