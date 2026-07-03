import React, { useEffect, useState } from 'react';

export default function AdminGmail({ adminEmail, onBack }) {
  const [filter, setFilter] = useState('');
  const [searchIn, setSearchIn] = useState('all');
  const [emails, setEmails] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/gmail/status?adminEmail=${encodeURIComponent(adminEmail)}`)
      .then((res) => res.json())
      .then((data) => setConnected(!!data.connected))
      .catch(() => setConnected(false));
  }, [adminEmail]);

  const connectGmail = () => {
    window.location.href = `/api/gmail/connect?adminEmail=${encodeURIComponent(adminEmail)}`;
  };

  const fetchEmails = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        adminEmail,
        filter,
        searchIn,
      });
      const res = await fetch(`/api/gmail/messages?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch emails');
      setEmails(data);
    } catch (e) {
      setError(e.message);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-card page-card--wide">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Gmail Processor</h2>
        <p className="dashboard-subtitle">
          Connect Gmail, enter filter words, and fetch matching emails
        </p>
      </div>

      <button type="button" className="btn btn-ghost" onClick={onBack}>
        ← Back to Dashboard
      </button>

      <div className="form-group" style={{ marginTop: '20px' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={connectGmail}
        >
          {connected ? 'Reconnect Gmail' : 'Connect Gmail'}
        </button>

        <input
          className="styled-input"
          placeholder="Filter words (e.g. admission, student, fees)"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        <select
          className="styled-select"
          value={searchIn}
          onChange={(e) => setSearchIn(e.target.value)}
        >
          <option value="all">Search everywhere</option>
          <option value="subject">Subject only</option>
          <option value="from">From only</option>
        </select>

        <button
          type="button"
          className="btn btn-success"
          onClick={fetchEmails}
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Fetch Emails'}
        </button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {emails.length === 0 ? (
        <div className="empty-state">No emails to show. Connect Gmail and fetch.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((mail) => (
                <tr key={mail.id}>
                  <td>{mail.from}</td>
                  <td>{mail.subject}</td>
                  <td>{mail.date}</td>
                  <td>{mail.snippet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}