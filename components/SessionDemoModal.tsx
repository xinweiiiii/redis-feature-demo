'use client';

import { useState, useEffect } from 'react';

interface Session {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  provider: string;
  loginTime: string;
  expiresAt: string;
  ipAddress: string;
  ttl?: number;
}

interface SessionDemoModalProps {
  onClose: () => void;
}

export default function SessionDemoModal({ onClose }: SessionDemoModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [lastCommand, setLastCommand] = useState('');
  const [showLogin, setShowLogin] = useState(true);
  const [countdown, setCountdown] = useState(0);

  // Login form state
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [selectedProvider, setSelectedProvider] = useState('google');

  const providers = [
    { id: 'google', name: 'Google', color: '#4285f4', icon: 'G' },
    { id: 'github', name: 'GitHub', color: '#333', icon: 'GH' },
    { id: 'microsoft', name: 'Microsoft', color: '#00a4ef', icon: 'M' },
    { id: 'okta', name: 'Okta', color: '#007dc1', icon: 'O' },
  ];

  useEffect(() => {
    if (currentSession) {
      loadActiveSessions();
    }
  }, [currentSession]);

  // Countdown timer effect
  useEffect(() => {
    if (!currentSession) {
      setCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const expiresAt = new Date(currentSession.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setCountdown(remaining);

      if (remaining === 0) {
        setStatusMessage({ type: 'error', text: 'Session expired!' });
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);

  const handleLogin = async (provider: string) => {
    setLoading(true);
    setStatusMessage(null);
    setLastCommand(`HSET session:{sessionId} userId "{userId}" email "${email}" name "${name}" provider "${provider}" loginTime "{timestamp}" expiresAt "{timestamp+30min}" ipAddress "{ip}"\nEXPIRE session:{sessionId} 1800\nSADD user_sessions:${email} {sessionId}`);

    try {
      const response = await fetch('/api/session/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }

      setCurrentSession(data.session);
      setShowLogin(false);
      setStatusMessage({
        type: 'success',
        text: `Logged in successfully with ${provider}! Session created.`,
      });
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const loadActiveSessions = async () => {
    if (!currentSession) return;

    try {
      const response = await fetch(`/api/session/list?email=${currentSession.email}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setActiveSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleLogout = async (sessionId?: string) => {
    const logoutSessionId = sessionId || currentSession?.sessionId;
    if (!logoutSessionId) return;

    setLoading(true);
    setLastCommand(`DEL session:${logoutSessionId}\nSREM user_sessions:${currentSession?.email} ${logoutSessionId}`);

    try {
      const response = await fetch('/api/session/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: logoutSessionId, email: currentSession?.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to logout');
      }

      if (logoutSessionId === currentSession?.sessionId) {
        setCurrentSession(null);
        setShowLogin(true);
        setActiveSessions([]);
        setStatusMessage({ type: 'success', text: 'Logged out successfully' });
      } else {
        loadActiveSessions();
        setStatusMessage({ type: 'success', text: 'Session terminated' });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    if (!currentSession) return;

    setLoading(true);
    setLastCommand(`HSET session:${currentSession.sessionId} expiresAt "{timestamp+30min}"\nEXPIRE session:${currentSession.sessionId} 1800\nEXPIRE user_sessions:${currentSession.email} 1800`);

    try {
      const response = await fetch('/api/session/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSession.sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh session');
      }

      setCurrentSession(data.session);
      setStatusMessage({ type: 'success', text: 'Session refreshed! Extended by 30 minutes.' });
      loadActiveSessions();
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (ttl: number) => {
    if (ttl <= 0) return 'Expired';
    const minutes = Math.floor(ttl / 60);
    const seconds = ttl % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content session-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Session Management Demo</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          {showLogin ? (
            /* Login View */
            <div className="session-login">
              <h3>OAuth SSO Login</h3>
              <p className="section-description">Simulate OAuth login with different providers</p>

              <div className="login-form">
                <div className="input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    placeholder="John Doe"
                  />
                </div>

                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div className="provider-selection">
                  <label>Select OAuth Provider</label>
                  <div className="provider-buttons">
                    {providers.map((provider) => (
                      <button
                        key={provider.id}
                        className={`provider-button ${selectedProvider === provider.id ? 'selected' : ''}`}
                        onClick={() => setSelectedProvider(provider.id)}
                        disabled={loading}
                        style={{ borderColor: provider.color }}
                      >
                        <span className="provider-icon" style={{ background: provider.color }}>
                          {provider.icon}
                        </span>
                        <span>{provider.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="primary login-button"
                  onClick={() => handleLogin(selectedProvider)}
                  disabled={loading || !name || !email}
                >
                  Sign in with {providers.find(p => p.id === selectedProvider)?.name}
                </button>
              </div>
            </div>
          ) : (
            /* Session View */
            <div className="session-view">
              <div className="session-container">
                {/* Current Session */}
                <div className="session-panel">
                  <h3>Current Session</h3>
                  <p className="section-description">Active session information stored in Redis</p>

                  {currentSession && (
                    <div className="session-card current">
                      <div className="session-header">
                        <div className="session-user">
                          <div className="user-avatar">
                            {currentSession.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-info">
                            <div className="user-name">{currentSession.name}</div>
                            <div className="user-email">{currentSession.email}</div>
                          </div>
                        </div>
                        <div className={`session-badge ${currentSession.provider}`}>
                          {currentSession.provider}
                        </div>
                      </div>

                      <div className="session-details">
                        <div className="detail-row">
                          <span className="detail-label">Session ID:</span>
                          <span className="detail-value monospace">
                            {currentSession.sessionId.substring(0, 16)}...
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">User ID:</span>
                          <span className="detail-value monospace">{currentSession.userId}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">IP Address:</span>
                          <span className="detail-value">{currentSession.ipAddress}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Login Time:</span>
                          <span className="detail-value">
                            {new Date(currentSession.loginTime).toLocaleString()}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Expires:</span>
                          <span className="detail-value">
                            {new Date(currentSession.expiresAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Countdown Timer */}
                      <div className={`session-countdown ${countdown <= 300 ? 'expiring' : ''}`}>
                        <div className="countdown-label">Time Remaining</div>
                        <div className="countdown-value">
                          {formatTimeRemaining(countdown)}
                        </div>
                        {countdown <= 300 && countdown > 0 && (
                          <div className="countdown-warning">
                            Session expiring soon!
                          </div>
                        )}
                        {countdown === 0 && (
                          <div className="countdown-expired">
                            Session expired
                          </div>
                        )}
                      </div>

                      <div className="session-actions">
                        <button
                          className="secondary refresh-button"
                          onClick={handleRefreshSession}
                          disabled={loading || countdown === 0}
                        >
                          Refresh Session
                        </button>
                        <button
                          className="logout-button"
                          onClick={() => handleLogout()}
                          disabled={loading}
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Sessions */}
                <div className="session-panel">
                  <h3>All Active Sessions</h3>
                  <p className="section-description">
                    Sessions for {currentSession?.email} ({activeSessions.length})
                  </p>

                  <div className="sessions-list">
                    {activeSessions.length === 0 ? (
                      <div className="no-sessions">No active sessions</div>
                    ) : (
                      activeSessions.map((session) => (
                        <div
                          key={session.sessionId}
                          className={`session-card ${session.sessionId === currentSession?.sessionId ? 'highlight' : ''}`}
                        >
                          <div className="session-info-compact">
                            <div className={`provider-badge ${session.provider}`}>
                              {session.provider}
                            </div>
                            <div className="session-meta">
                              <div className="session-id">
                                {session.sessionId.substring(0, 12)}...
                              </div>
                              <div className="session-time">
                                {new Date(session.loginTime).toLocaleTimeString()}
                              </div>
                              {session.ttl && (
                                <div className="session-ttl">
                                  ⏱ {formatTimeRemaining(session.ttl)}
                                </div>
                              )}
                            </div>
                            {session.sessionId !== currentSession?.sessionId && (
                              <button
                                className="terminate-button"
                                onClick={() => handleLogout(session.sessionId)}
                                disabled={loading}
                              >
                                Terminate
                              </button>
                            )}
                            {session.sessionId === currentSession?.sessionId && (
                              <span className="current-tag">Current</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Redis Command */}
          {lastCommand && (
            <div className="redis-command">
              <strong>Redis Commands:</strong>
              <code>{lastCommand}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
