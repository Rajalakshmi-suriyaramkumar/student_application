import React, { useCallback, useEffect, useState } from 'react';
export default function AdminDashboard({onOpenGmail}) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingEmail, setDeletingEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const loadStudents = useCallback(() => {
    setLoading(true);
    setErrorMessage('');
    fetch('/api/get-all-profiles')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        return res.json();
      })
      .then((data) => setStudents(data))
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);
  const handleDelete = async (email) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) {
      return;
    }
    setDeletingEmail(email);
    setErrorMessage('');
    try {
      const response = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
      setStudents((prev) => prev.filter((s) => s.email !== email));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setDeletingEmail('');
    }
  };
  if (loading) {
    return (
      <div className="state-message">
        <div className="state-spinner" />
        Loading dashboard data...
      </div>
    );
  }
  const withProfiles = students.filter((s) => s.institution !== '—').length;
  return (
    <div className="page-card page-card--wide">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Admin Dashboard</h2>
        <p className="dashboard-subtitle">Registered student profiles and accounts</p>
      </div>
      <button type="button" className="btn btn-primary" onClick={onOpenGmail} style={{ marginBottom: '20px' }}>
      Open Gmail Processor
      </button>
      {errorMessage && (
        <p className="form-error" role="alert">{errorMessage}</p>
      )}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card__value">{students.length}</div>
          <div className="stat-card__label">Total Accounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{withProfiles}</div>
          <div className="stat-card__label">Profiles Complete</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{students.length - withProfiles}</div>
          <div className="stat-card__label">Pending Enrollment</div>
        </div>
      </div>
      {students.length === 0 ? (
        <div className="empty-state">No student profiles found.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Institution</th>
                <th>Roll No</th>
                <th>Class</th>
                <th>Parent Contact</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.email}>
                  <td><span className="table-name">{student.name}</span></td>
                  <td><span className="table-email">{student.email}</span></td>
                  <td>{student.institution}</td>
                  <td><span className="table-roll">{student.rollNumber}</span></td>
                  <td>
                    <span className="table-badge">{student.class}</span>
                  </td>
                  <td><span className="table-contact">{student.parentContact}</span></td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={deletingEmail === student.email}
                      onClick={() => handleDelete(student.email)}
                    >
                      {deletingEmail === student.email ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
