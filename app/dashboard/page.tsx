'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RedisMetrics {
  server: {
    redis_version: string;
    uptime_in_seconds: number;
    uptime_in_days: number;
    connected_clients: number;
  };
  memory: {
    used_memory_human: string;
    used_memory_peak_human: string;
    maxmemory_human: string;
    mem_fragmentation_ratio: string;
  };
  stats: {
    total_connections_received: number;
    total_commands_processed: number;
    instantaneous_ops_per_sec: number;
    keyspace_hits: number;
    keyspace_misses: number;
    hit_rate: number;
    // Delta values (filters out monitoring overhead)
    keyspace_hits_delta: number;
    keyspace_misses_delta: number;
    hit_rate_delta: number;
    actual_ops_per_sec: number;
  };
  keyspace: {
    total_keys: number;
    expires: number;
    avg_ttl: number;
  };
  replication: {
    role: string;
    connected_slaves: number;
  };
}

interface HotKey {
  key: string;
  type: string;
  size: number;
  ttl: number;
  memory: number;
}

interface TimeSeriesDataPoint {
  timestamp: number;
  ops_per_sec: number;
  used_memory: number;
  connected_clients: number;
  hit_rate: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<RedisMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hotKeys, setHotKeys] = useState<HotKey[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeseries' | 'hotkeys'>('overview');

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/dashboard/metrics');
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotKeys = async () => {
    try {
      const response = await fetch('/api/dashboard/hotkeys');
      const data = await response.json();

      if (data.success) {
        setHotKeys(data.hotKeys);
      }
    } catch (err) {
      console.error('Failed to fetch hot keys:', err);
    }
  };

  const fetchTimeSeries = async () => {
    try {
      const response = await fetch('/api/dashboard/timeseries');
      const data = await response.json();

      if (data.success) {
        setTimeSeriesData(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch time series:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchHotKeys();
    fetchTimeSeries();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
      fetchHotKeys();
      fetchTimeSeries();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h1>Loading Dashboard...</h1>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem', color: 'var(--accent-color)', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Redis Dashboard</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh (5s)
            </label>
            <button
              onClick={() => {
                fetchMetrics();
                fetchHotKeys();
                fetchTimeSeries();
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Refresh Now
            </button>
          </div>
        </div>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          Real-time Redis metrics and performance monitoring
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderBottom: '2px solid #e0e0e0' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: activeTab === 'overview' ? 'var(--accent-color)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '3px solid var(--accent-color)' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
              fontSize: '1rem',
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('timeseries')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: activeTab === 'timeseries' ? 'var(--accent-color)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'timeseries' ? '3px solid var(--accent-color)' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'timeseries' ? 'bold' : 'normal',
              fontSize: '1rem',
            }}
          >
            Time Series
          </button>
          <button
            onClick={() => setActiveTab('hotkeys')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: activeTab === 'hotkeys' ? 'var(--accent-color)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'hotkeys' ? '3px solid var(--accent-color)' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'hotkeys' ? 'bold' : 'normal',
              fontSize: '1rem',
            }}
          >
            Hot Keys
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#f44336', color: 'white', borderRadius: '8px', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Server Info */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Server Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Redis Version:</span>
                <strong>{metrics.server.redis_version}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Uptime:</span>
                <strong>{formatUptime(metrics.server.uptime_in_seconds)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Connected Clients:</span>
                <strong>{metrics.server.connected_clients}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Role:</span>
                <strong style={{ textTransform: 'capitalize' }}>{metrics.replication.role}</strong>
              </div>
            </div>
          </div>

          {/* Memory Info */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Memory Usage</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Used Memory:</span>
                <strong>{metrics.memory.used_memory_human}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Peak Memory:</span>
                <strong>{metrics.memory.used_memory_peak_human}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Max Memory:</span>
                <strong>{metrics.memory.maxmemory_human || 'Unlimited'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Fragmentation:</span>
                <strong>{metrics.memory.mem_fragmentation_ratio}</strong>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Statistics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Connections:</span>
                <strong>{metrics.stats.total_connections_received.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Commands:</span>
                <strong>{metrics.stats.total_commands_processed.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>App Ops/sec:</span>
                <strong>{metrics.stats.actual_ops_per_sec}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>App Hit Rate:</span>
                <strong style={{ color: metrics.stats.hit_rate_delta > 80 ? '#4CAF50' : metrics.stats.hit_rate_delta > 50 ? '#FF9800' : '#f44336' }}>
                  {Number(metrics.stats.hit_rate_delta).toFixed(2)}%
                </strong>
              </div>
            </div>
          </div>

          {/* Keyspace */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Keyspace</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Keys:</span>
                <strong>{metrics.keyspace.total_keys.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Keys with Expiry:</span>
                <strong>{metrics.keyspace.expires.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Avg TTL:</span>
                <strong>{metrics.keyspace.avg_ttl > 0 ? `${metrics.keyspace.avg_ttl}s` : 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Hits:</span>
                <strong style={{ color: '#4CAF50' }}>{metrics.stats.keyspace_hits.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Series Tab */}
      {activeTab === 'timeseries' && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Performance Metrics Over Time</h2>

          {timeSeriesData.length > 0 ? (
            <div style={{ display: 'grid', gap: '2rem' }}>
              {/* Operations per Second */}
              <div className="card">
                <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Operations per Second</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatTimestamp}
                      stroke="var(--text-secondary)"
                    />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip
                      labelFormatter={formatTimestamp}
                      contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid #e0e0e0' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ops_per_sec"
                      stroke="#2196F3"
                      name="Ops/sec"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Memory Usage */}
              <div className="card">
                <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Memory Usage</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatTimestamp}
                      stroke="var(--text-secondary)"
                    />
                    <YAxis
                      tickFormatter={formatBytes}
                      stroke="var(--text-secondary)"
                    />
                    <Tooltip
                      labelFormatter={formatTimestamp}
                      formatter={(value: number | undefined) => value !== undefined ? formatBytes(value) : ''}
                      contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid #e0e0e0' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="used_memory"
                      stroke="#FF9800"
                      fill="#FF9800"
                      fillOpacity={0.3}
                      name="Memory"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Connected Clients */}
              <div className="card">
                <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Connected Clients</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatTimestamp}
                      stroke="var(--text-secondary)"
                    />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip
                      labelFormatter={formatTimestamp}
                      contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid #e0e0e0' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="connected_clients"
                      stroke="#4CAF50"
                      name="Clients"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Hit Rate */}
              <div className="card">
                <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Cache Hit Rate (%)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatTimestamp}
                      stroke="var(--text-secondary)"
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="var(--text-secondary)"
                    />
                    <Tooltip
                      labelFormatter={formatTimestamp}
                      formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(2)}%` : ''}
                      contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid #e0e0e0' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="hit_rate"
                      stroke="#9C27B0"
                      fill="#9C27B0"
                      fillOpacity={0.3}
                      name="Hit Rate"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                Time series data is being collected... Check back in a few seconds.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hot Keys Tab */}
      {activeTab === 'hotkeys' && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Top Hot Keys by Memory Usage</h2>

          {hotKeys.length > 0 ? (
            <div className="card">
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.95rem'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#f5f5f5',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)'
                      }}>Key</th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)'
                      }}>Type</th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)'
                      }}>Size</th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)'
                      }}>Memory</th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)'
                      }}>TTL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotKeys.map((key, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: '1px solid #e0e0e0',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{
                          padding: '1rem',
                          fontFamily: 'monospace',
                          fontSize: '0.9rem',
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {key.key}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#E3F2FD',
                            color: '#1976D2',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}>
                            {key.type}
                          </span>
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '500'
                        }}>
                          {key.size.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '500',
                          color: key.memory > 1000000 ? '#f44336' : key.memory > 100000 ? '#FF9800' : 'inherit'
                        }}>
                          {key.memory > 0 ? formatBytes(key.memory) : 'N/A'}
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'right',
                          color: 'var(--text-secondary)'
                        }}>
                          {key.ttl === -1 ? 'No expiry' : key.ttl === -2 ? 'Expired' : `${key.ttl}s`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px'
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)'
                }}>
                  Showing top {hotKeys.length} keys by memory usage. Keys are analyzed on each refresh.
                </p>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                No keys found in the database.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
