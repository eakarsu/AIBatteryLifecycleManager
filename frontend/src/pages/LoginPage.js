import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, loginDemo, setToken, setStoredUser } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const request = useRef(null);
  const locked = useRef(false);

  useEffect(() => () => request.current?.abort(), []);

  const acceptSession = ({ token, user } = {}) => {
    if (!token || !user?.id || !user?.email || !user?.role) {
      throw new Error('Authentication returned an invalid session');
    }
    setToken(token);
    setStoredUser(user);
    navigate('/', { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setError(null);
    setLoading(true);
    try {
      acceptSession(await login(email, password));
    } catch (err) {
      setError(err.message);
    } finally {
      locked.current = false;
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    if (locked.current) return;
    locked.current = true;
    const controller = new AbortController();
    request.current = controller;
    setError(null);
    setLoading(true);
    try {
      acceptSession(await loginDemo({ signal: controller.signal }));
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      if (request.current === controller) request.current = null;
      locked.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-brand">BATTERY LIFECYCLE</h1>
        <p className="login-sub">BESS + EV Second-Life Hub</p>

        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <div className="ai-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

        <button
          type="button"
          className="btn secondary"
          onClick={handleDemo}
          disabled={loading}
          aria-label="Log In as Demo"
          style={{ width: '100%', marginBottom: '12px' }}
        >
          {loading ? 'Authenticating…' : 'Log In as Demo'}
        </button>
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? <><span className="spinner" />Authenticating...</> : 'Sign In'}
        </button>

        <p className="login-hint">Demo access uses an existing fictional actor and never exposes its password.</p>
      </form>
    </div>
  );
}
