import React, { useState, useEffect } from 'react';
import { Shield, Lock, User, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Register({ onToggleAuthMode, API_URL }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [strength, setStrength] = useState(0); // 0 to 3
  const [strengthLabel, setStrengthLabel] = useState('Empty');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Evaluate password strength in real time
  useEffect(() => {
    if (!password) {
      setStrength(0);
      setStrengthLabel('Empty');
      return;
    }

    let score = 0;
    
    // Condition 1: Length >= 8
    if (password.length >= 8) score += 1;
    
    // Condition 2: Has letters and digits
    const hasLetters = /[A-Za-z]/.test(password);
    const hasDigits = /\d/.test(password);
    if (hasLetters && hasDigits) score += 1;
    
    // Condition 3: Has special characters
    const hasSpecial = /[@$!%*#?&]/.test(password);
    if (hasSpecial) score += 1;

    setStrength(score);
    
    if (score === 1) setStrengthLabel('Weak (Requires letters/numbers)');
    else if (score === 2) setStrengthLabel('Medium (Add special characters)');
    else if (score === 3) setStrengthLabel('Strong (Ready!)');
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password) {
      setError('Please fill in all security fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (strength < 3) {
      setError('Security Constraint: Password must be STRONG (at least 8 characters, containing letters, numbers, and special characters).');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccess('Account created successfully! You can now log in.');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card">
        <div className="auth-header">
          <div className="brand-container" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            <Shield size={36} className="brand-logo" />
            <span className="brand-name">SHIELD TASK</span>
          </div>
          <h2 className="auth-title">Register Portal</h2>
          <p className="auth-subtitle">Initialize a new secure developer profile</p>
        </div>

        {error && (
          <div className="alert error">
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert success">
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="Choose username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Choose strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            
            {password && (
              <>
                <div className="strength-indicator">
                  <div className={`strength-bar ${strength >= 1 ? (strength === 1 ? 'weak' : strength === 2 ? 'medium' : 'strong') : ''}`}></div>
                  <div className={`strength-bar ${strength >= 2 ? (strength === 2 ? 'medium' : 'strong') : ''}`}></div>
                  <div className={`strength-bar ${strength >= 3 ? 'strong' : ''}`}></div>
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: strength === 3 ? 'var(--priority-low)' : strength === 2 ? 'var(--priority-medium)' : 'var(--priority-high)' }}>
                  Strength: {strengthLabel}
                </div>
              </>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register Profile'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <span className="auth-link" onClick={onToggleAuthMode}>
            Sign in here
          </span>
        </div>
      </div>
    </div>
  );
}
