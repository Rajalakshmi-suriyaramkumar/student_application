import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/get-all-profiles')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        return res.json();
      })
      .then((data) => setStudents(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
