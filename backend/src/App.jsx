import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, CheckCircle, LogOut, LayoutDashboard, Settings } from 'lucide-react';

import Login from './components/Login';
import Register from './components/Register';
import Tasks from './components/Tasks';
import Admin from './components/Admin';

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [activeView, setActiveView] = useState('tasks'); // 'tasks' | 'admin'
  const [systemHealthy, setSystemHealthy] = useState(true);

  const API_URL = 'http://localhost:5000';

  // Check for stored token and session on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('shield_task_token');
    const storedUser = localStorage.getItem('shield_task_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    // Verify backend health connection
    fetch(`${API_URL}/api/health`)
      .then(res => {
        if (!res.ok) setSystemHealthy(false);
      })
      .catch(() => setSystemHealthy(false));
  }, []);

  const handleLoginSuccess = (newToken, loggedInUser) => {
    setToken(newToken);
    setUser(loggedInUser);
    setActiveView('tasks');
  };

  const handleLogout = () => {
    localStorage.removeItem('shield_task_token');
    localStorage.removeItem('shield_task_user');
    setToken(null);
    setUser(null);
    setAuthMode('login');
    setActiveView('tasks');
  };

  return (
    <div>
      {/* Dynamic Navbar */}
      <header className="navbar">
        <div className="brand-container">
          <Shield size={28} className="brand-logo" />
          <span className="brand-name">ShieldTask</span>
        </div>

        {token && user ? (
          <div className="nav-links">
            {/* View selectors */}
            <button 
              className="btn-secondary"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                borderColor: activeView === 'tasks' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                background: activeView === 'tasks' ? 'rgba(56, 189, 248, 0.05)' : 'none'
              }}
              onClick={() => setActiveView('tasks')}
            >
              <LayoutDashboard size={14} />
              Tasks Panel
            </button>

            {user.role === 'Admin' && (
              <button 
                className="btn-secondary"
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.85rem',
                  borderColor: activeView === 'admin' ? 'var(--secondary)' : 'rgba(255,255,255,0.08)',
                  background: activeView === 'admin' ? 'rgba(168, 85, 247, 0.05)' : 'none'
                }}
                onClick={() => setActiveView('admin')}
              >
                <Settings size={14} />
                Admin Dashboard
              </button>
            )}

            <div className="nav-user">
              <span>{user.username}</span>
              <span className={`role-badge ${user.role.toLowerCase()}`}>
                {user.role}
              </span>
            </div>

            <button className="btn-icon" onClick={handleLogout} title="Log Out Securely">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: systemHealthy ? 'var(--priority-low)' : 'var(--priority-high)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: systemHealthy ? 'var(--priority-low)' : 'var(--priority-high)' }}></span>
              Server: {systemHealthy ? 'HEALTHY' : 'OFFLINE'}
            </span>
          </div>
        )}
      </header>

      {/* Main Workspace Frame */}
      <main className="app-container">
        {!token ? (
          authMode === 'login' ? (
            <Login 
              onLoginSuccess={handleLoginSuccess}
              onToggleAuthMode={() => setAuthMode('register')}
              API_URL={API_URL}
            />
          ) : (
            <Register 
              onToggleAuthMode={() => setAuthMode('login')}
              API_URL={API_URL}
            />
          )
        ) : (
          activeView === 'admin' && user.role === 'Admin' ? (
            <Admin API_URL={API_URL} token={token} />
          ) : (
            <Tasks API_URL={API_URL} token={token} />
          )
        )}
      </main>
    </div>
  );
}
