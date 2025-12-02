'use client';

import { useState, useEffect, useRef } from 'react';

interface RateLimitResponse {
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
  resetInSeconds: number;
  resetTime: string | null;
  message: string;
}

interface RequestLog {
  id: string;
  timestamp: string;
  allowed: boolean;
  current: number;
  limit: number;
}

interface RateLimitDemoModalProps {
  onClose: () => void;
}

export default function RateLimitDemoModal({ onClose }: RateLimitDemoModalProps) {
  const [identifier, setIdentifier] = useState('user:123');
  const [limit, setLimit] = useState(5);
  const [windowSeconds, setWindowSeconds] = useState(10);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rateLimitData, setRateLimitData] = useState<RateLimitResponse | null>(null);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [lastCommand, setLastCommand] = useState('');
  const [resetCountdown, setResetCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (rateLimitData && rateLimitData.resetInSeconds > 0) {
      setResetCountdown(rateLimitData.resetInSeconds);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setResetCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [rateLimitData]);

  const handleApiRequest = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const key = `rate_limit:${identifier}`;
      setLastCommand(`INCR ${key}\nEXPIRE ${key} ${windowSeconds}\nTTL ${key}`);

      const response = await fetch('/api/ratelimit/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, limit, windowSeconds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check rate limit');
      }

      setRateLimitData(data);

      // Add to request log
      const logEntry: RequestLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        allowed: data.allowed,
        current: data.current,
        limit: data.limit,
      };
      setRequestLogs((prev) => [logEntry, ...prev.slice(0, 19)]);

      setStatusMessage({
        type: data.allowed ? 'success' : 'error',
        text: data.message,
      });
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setStatusMessage(null);
    setLastCommand(`DEL rate_limit:${identifier}`);

    try {
      const response = await fetch('/api/ratelimit/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset rate limit');
      }

      setRateLimitData(null);
      setResetCountdown(0);
      setStatusMessage({ type: 'success', text: 'Rate limit reset successfully' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setRequestLogs([]);
  };

  const percentage = rateLimitData ? (rateLimitData.current / rateLimitData.limit) * 100 : 0;
  const isThrottled = rateLimitData && !rateLimitData.allowed;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ratelimit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rate Limiting Demo</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          <div className="ratelimit-container">
            {/* Configuration Section */}
            <div className="ratelimit-config">
              <h3>Configuration</h3>
              <p className="section-description">Set rate limit parameters</p>

              <div className="input-group">
                <label>Identifier (User/IP)</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  placeholder="user:123"
                />
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>Max Requests</label>
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 1)}
                    disabled={loading}
                    min="1"
                  />
                </div>

                <div className="input-group">
                  <label>Time Window (seconds)</label>
                  <input
                    type="number"
                    value={windowSeconds}
                    onChange={(e) => setWindowSeconds(parseInt(e.target.value) || 1)}
                    disabled={loading}
                    min="1"
                  />
                </div>
              </div>

              <div className="config-summary">
                <strong>Rule:</strong> {limit} requests per {windowSeconds} seconds
              </div>
            </div>

            {/* Status Display */}
            <div className="ratelimit-status">
              <h3>Rate Limit Status</h3>
              <p className="section-description">Current request count and limits</p>

              {rateLimitData ? (
                <>
                  <div className={`rate-counter ${isThrottled ? 'throttled' : ''}`}>
                    <div className="counter-value">
                      {rateLimitData.current} / {rateLimitData.limit}
                    </div>
                    <div className="counter-label">Requests Used</div>
                  </div>

                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${isThrottled ? 'throttled' : ''}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="rate-stats">
                    <div className="stat-item">
                      <span className="stat-label">Remaining:</span>
                      <span className="stat-value">{rateLimitData.remaining}</span>
                    </div>
                    {resetCountdown > 0 && (
                      <div className="stat-item">
                        <span className="stat-label">Reset in:</span>
                        <span className="stat-value countdown">{resetCountdown}s</span>
                      </div>
                    )}
                  </div>

                  {isThrottled && (
                    <div className="throttle-warning">
                      <strong>⚠️ Throttled!</strong>
                      <p>Rate limit exceeded. Please wait {resetCountdown}s before trying again.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-data">
                  <p>No requests made yet. Click "Make API Request" to start.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="button-group">
            <button
              className="primary"
              onClick={handleApiRequest}
              disabled={loading}
            >
              Make API Request
            </button>
            <button
              className="secondary"
              onClick={handleReset}
              disabled={loading || !rateLimitData}
            >
              Reset Rate Limit
            </button>
          </div>

          {/* Redis Command */}
          {lastCommand && (
            <div className="redis-command">
              <strong>Redis Commands:</strong>
              <code>{lastCommand}</code>
            </div>
          )}

          {/* Request Logs */}
          {requestLogs.length > 0 && (
            <div className="request-logs">
              <div className="logs-header">
                <h4>Request History ({requestLogs.length})</h4>
                <button className="clear-button" onClick={clearLogs}>
                  Clear
                </button>
              </div>
              <div className="logs-list">
                {requestLogs.map((log) => (
                  <div key={log.id} className={`log-item ${log.allowed ? 'allowed' : 'denied'}`}>
                    <span className="log-time">{log.timestamp}</span>
                    <span className={`log-status ${log.allowed ? 'success' : 'error'}`}>
                      {log.allowed ? '✓ Allowed' : '✗ Denied'}
                    </span>
                    <span className="log-count">
                      {log.current}/{log.limit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
