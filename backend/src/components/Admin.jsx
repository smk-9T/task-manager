import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, ShieldAlert, FileText, Trash2, 
  RefreshCw, Award, LogOut, Terminal, AlertTriangle 
} from 'lucide-react';

export default function Admin({ API_URL, token }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    failedLogins: 0,
    tasksByStatus: [],
    tasksByPriority: []
  });
  
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch system statistics
      const statsRes = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (!statsRes.ok) throw new Error(statsData.error || 'Failed to fetch statistics.');
      setStats(statsData);

      // 2. Fetch all users
      const usersRes = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (!usersRes.ok) throw new Error(usersData.error || 'Failed to fetch users list.');
      setUsers(usersData);

      // 3. Fetch audit logs
      const logsRes = await fetch(`${API_URL}/api/admin/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const logsData = await logsRes.json();
      if (!logsRes.ok) throw new Error(logsData.error || 'Failed to fetch audit logs.');
      setLogs(logsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleRole = async (userId, currentRole) => {
    setError('');
    setSuccess('');
    const newRole = currentRole === 'Admin' ? 'User' : 'Admin';

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update user role.');

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccess('User security level modified successfully.');
      fetchAdminData(); // Refresh metrics
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`SECURITY WARNING: Are you sure you want to completely delete user '${username}'? This deletes all associated tasks permanently.`)) return;
    
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete user.');

      setUsers(users.filter(u => u.id !== userId));
      setSuccess(`Account '${username}' has been deleted.`);
      fetchAdminData(); // Refresh statistics
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Clear all historical security audit logs?')) return;
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/admin/logs`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to clear logs.');

      setLogs([]);
      setSuccess('Audit logs purged.');
      fetchAdminData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Calculate completion percentage
  const taskCompletionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return (
    <div>
      
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>Admin Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>System statistics, threat monitoring, and user authorization control.</p>
        </div>
        
        <button className="btn-secondary" onClick={fetchAdminData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh Panel
        </button>
      </div>

      {error && (
        <div className="alert error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Aggregate Statistics Row */}
      <div className="admin-stats-row">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper admin">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalTasks}</span>
            <span className="stat-label">System Tasks</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--priority-low)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{taskCompletionRate}%</span>
            <span className="stat-label">Task Progress</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper danger">
            <ShieldAlert size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.failedLogins}</span>
            <span className="stat-label">Failed Logins</span>
          </div>
        </div>
      </div>

      {/* Grid of Users & Live Logs */}
      <div className="admin-section-grid">
        
        {/* Users Management Panel */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Users size={20} style={{ color: 'var(--primary)' }} />
              User Profiles & Roles
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{users.length} profiles</span>
          </div>

          <div className="users-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="username-cell">{user.username}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          title={`Switch role to ${user.role === 'Admin' ? 'User' : 'Admin'}`}
                          onClick={() => handleToggleRole(user.id, user.role)}
                        >
                          <Award size={12} />
                          Toggle Role
                        </button>
                        
                        <button
                          className="btn-danger"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          title="Delete User account"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Security Log Panel */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Terminal size={20} style={{ color: 'var(--secondary)' }} />
              Security Audit Logs
            </h3>
            <button 
              className="btn-secondary" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'var(--priority-high)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
              onClick={handleClearLogs}
            >
              Clear Logs
            </button>
          </div>

          <div className="logs-stream-container">
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No audit events recorded.
              </div>
            ) : (
              logs.map(log => (
                <div className={`log-entry ${log.event_type}`} key={log.id}>
                  <div className="log-meta">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    <span className={`log-tag ${log.event_type}`}>{log.event_type}</span>
                  </div>
                  <div className="log-desc">{log.description}</div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
