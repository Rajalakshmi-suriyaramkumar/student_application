import React, { useEffect, useState } from 'react';

export default function ProfileView({ userEmail }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/get-profile?email=${encodeURIComponent(userEmail)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [userEmail]);

  if (loading) {
    return (
      <div className="state-message">
        <div className="state-spinner" />
        Loading your profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="state-message state-message--error">
        Profile not found. Please complete your enrollment.
      </div>
    );
  }

  return (
    <div className="page-card page-card--narrow page-card--transparent">
      <h2 className="page-title page-title--spaced">Your Student ID</h2>

      <div className="id-card">
        <div className="id-card__header">
          <h3 className="id-card__institution">{profile.institution}</h3>
          <span className="id-card__badge">Student ID Card</span>
        </div>

        <div className="id-card__body">
          <div className="id-card__row">
            <span className="id-card__label">Name</span>
            <span className="id-card__value">{profile.name}</span>
          </div>
          <div className="id-card__row">
            <span className="id-card__label">Roll No</span>
            <span className="id-card__value">{profile.rollNumber}</span>
          </div>
          <div className="id-card__row">
            <span className="id-card__label">Class</span>
            <span className="id-card__value">{profile.class}</span>
          </div>
          <div className="id-card__row">
            <span className="id-card__label">Emergency</span>
            <span className="id-card__value">{profile.parentContact}</span>
          </div>
        </div>

        <div className="id-card__footer">
          <span className="id-card__dot" />
          VERIFIED STUDENT
        </div>
      </div>
    </div>
  );
}
