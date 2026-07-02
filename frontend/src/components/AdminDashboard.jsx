import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/get-all-profiles')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        return res.json();
      })
      .then(data => setStudents(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500 mt-10">Loading dashboard data...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0">Admin Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1 m-0">Registered student profiles and accounts</p>
        </div>
      </div>
      
      <table className="custom-table">
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
              <td><strong className="text-gray-900">{student.name}</strong></td>
              <td className="font-mono text-gray-500">{student.email}</td>
              <td>{student.institution}</td>
              <td className="font-mono font-semibold text-indigo-600">{student.rollNumber}</td>
              <td>
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {student.class}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {students.length === 0 && (
        <p className="text-center text-gray-400 py-10 text-sm">No student profiles found.</p>
      )}
    </div>
  );
}
