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
    parentContact: ''
  });
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile");
      }
      onProfileComplete();
    } catch (err) {
      alert(err.message);
    }
  };
  return (
    <div className="styled-card" style={{ maxWidth: '440px' }}>
      <h3 style={{ margin: '0 0 6px 0', fontSize: '22px', textAlign: 'center' }}>Student Enrollment</h3>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 10px 0' }}>
        Fill out your information to generate your student ID card.
      </p>
      <form onSubmit={handleSubmit} className="form-group">
        <input name="institutionName" className="styled-input" type="text" placeholder="School / College Name" required onChange={handleChange} />
        <input name="dateOfBirth" className="styled-input" type="date" required onChange={handleChange} />
        <select name="gender" className="styled-select" required onChange={handleChange}>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <input name="rollNumber" className="styled-input" type="text" placeholder="Roll Number" required onChange={handleChange} />
        <input name="gradeClass" className="styled-input" type="text" placeholder="Grade / Class (e.g. 12th)" required onChange={handleChange} />
        <input name="section" className="styled-input" type="text" placeholder="Section (e.g. A)" required onChange={handleChange} />
        <input name="parentContact" className="styled-input" type="tel" placeholder="Parent's Phone Number" required onChange={handleChange} />
        <button type="submit" className="btn btn-success" style={{ marginTop: '8px' }}>
          Save & Generate ID Card
        </button>
      </form>
    </div>
  );
}
