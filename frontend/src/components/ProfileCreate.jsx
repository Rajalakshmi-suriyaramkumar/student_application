import React, { useState } from 'react';

export default function ProfileCreate({ userEmail, onProfileComplete }) {
  const [form, setForm] = useState({
    email: userEmail,
    institutionName: '',
    dateOfBirth: '',
    gender: '',
    rollNumber: '',
    gradeClass: '',
    section: '',
    parentContact: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not save your profile. Please try again.');
      }

      onProfileComplete();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-card page-card--medium">
      <h2 className="page-title">Student Enrollment</h2>
      <p className="page-subtitle">
        Fill out your information to generate your student ID card.
      </p>

      {errorMessage && (
        <p className="form-error" role="alert">{errorMessage}</p>
      )}

      <form onSubmit={handleSubmit} className="form-group">
        <input
          name="institutionName"
          className="styled-input"
          type="text"
          placeholder="School / College Name"
          required
          onChange={handleChange}
        />
        <input
          name="dateOfBirth"
          className="styled-input"
          type="date"
          required
          onChange={handleChange}
        />
        <select name="gender" className="styled-select" required onChange={handleChange} defaultValue="">
          <option value="" disabled>Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <input
          name="rollNumber"
          className="styled-input"
          type="text"
          placeholder="Roll Number"
          required
          onChange={handleChange}
        />
        <input
          name="gradeClass"
          className="styled-input"
          type="text"
          placeholder="Grade / Class (e.g. 12th)"
          required
          onChange={handleChange}
        />
        <input
          name="section"
          className="styled-input"
          type="text"
          placeholder="Section (e.g. A)"
          required
          onChange={handleChange}
        />
        <input
          name="parentContact"
          className="styled-input"
          type="tel"
          placeholder="Parent's Phone Number"
          required
          onChange={handleChange}
        />
        <button type="submit" className="btn btn-success" disabled={loading}>
          {loading ? 'Saving...' : 'Save & Generate ID Card'}
        </button>
      </form>
    </div>
  );
}
