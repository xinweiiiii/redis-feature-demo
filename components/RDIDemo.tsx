'use client';

import { useState, useEffect } from 'react';

interface Customer {
  id: number;
  name: string;
  email: string;
  country: string | null;
  created_at: string;
}

interface Metrics {
  redisReadTime?: number;
  postgresInsertTime?: number;
  redisSyncTime?: number;
  totalTime?: number;
}

export default function RDIDemo() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [metrics, setMetrics] = useState<Metrics>({});

  // Fetch customers from Redis
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/rdi/get-customers');
      const data = await response.json();
      console.log('Fetch customers response:', data);

      if (data.success) {
        console.log('Setting customers:', data.customers);
        setCustomers(data.customers || []);
        if (data.metrics) {
          setMetrics(prev => ({ ...prev, redisReadTime: data.metrics.redisReadTime }));
        }
      } else {
        console.error('Failed to fetch customers:', data.error);
        setError(data.error || 'Failed to fetch customers');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to fetch customers');
    }
  };

  // Load customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Insert customer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/rdi/insert-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, country }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Customer "${data.customer.name}" added successfully and synced to Redis!`);
        if (data.metrics) {
          setMetrics(prev => ({
            ...prev,
            postgresInsertTime: data.metrics.postgresInsertTime,
            redisSyncTime: data.metrics.redisSyncTime,
            totalTime: data.metrics.totalTime
          }));
        }
        setName('');
        setEmail('');
        setCountry('');
        // Refresh the customer list
        await fetchCustomers();
      } else {
        setError(data.error || 'Failed to add customer');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Clear all customers
  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all customers?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Clearing all customers...');
      const response = await fetch('/api/rdi/clear-customers', {
        method: 'POST',
      });

      const data = await response.json();
      console.log('Clear customers response:', data);

      if (response.ok) {
        setSuccess(`Cleared ${data.deletedCount} customers from PostgreSQL and Redis`);
        // Refetch to ensure state is in sync
        await fetchCustomers();
        // Reset metrics
        setMetrics({});
      } else {
        setError(data.error || 'Failed to clear customers');
        console.error('Clear failed:', data);
      }
    } catch (err: any) {
      console.error('Error clearing customers:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rdi-demo-container">
      <div className="rdi-demo-header">
        <h2>Redis Data Integration (RDI) Demo</h2>
        <p className="rdi-demo-subtitle">
          Insert records into PostgreSQL and watch them automatically sync to Redis
        </p>
      </div>

      <div className="rdi-demo-content">
        {/* Left side - Form */}
        <div className="rdi-demo-form-section">
          <div className="rdi-demo-card">
            <div className="rdi-demo-card-header">
              <h3>PostgreSQL Insert</h3>
              <span className="rdi-demo-badge postgres">Source DB</span>
            </div>

            <form onSubmit={handleSubmit} className="rdi-demo-form">
              <div className="rdi-demo-form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div className="rdi-demo-form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="rdi-demo-form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="USA"
                  disabled={loading}
                />
              </div>

              {error && <div className="rdi-demo-alert error">{error}</div>}
              {success && <div className="rdi-demo-alert success">{success}</div>}

              <div className="rdi-demo-form-actions">
                <button
                  type="submit"
                  className="rdi-demo-button primary"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Customer to PostgreSQL'}
                </button>
                <button
                  type="button"
                  className="rdi-demo-button secondary"
                  onClick={handleClear}
                  disabled={loading || customers.length === 0}
                >
                  Clear All
                </button>
              </div>
            </form>

            <div className="rdi-demo-sync-indicator">
              <div className="sync-arrow">→</div>
              <span className="sync-text">RDI Auto-Sync</span>
            </div>
          </div>
        </div>

        {/* Right side - Redis Table */}
        <div className="rdi-demo-table-section">
          <div className="rdi-demo-card">
            <div className="rdi-demo-card-header">
              <h3>Redis Data</h3>
              <span className="rdi-demo-badge redis">Cache/Target</span>
            </div>

            <div className="rdi-demo-stats">
              <div className="stat">
                <span className="stat-value">{customers.length}</span>
                <span className="stat-label">Total Records</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {metrics.redisReadTime !== undefined ? `${metrics.redisReadTime}ms` : '-'}
                </span>
                <span className="stat-label">Redis Read Time</span>
              </div>
            </div>

            {metrics.postgresInsertTime !== undefined && (
              <div className="rdi-demo-metrics">
                <h4>Last Insert Performance</h4>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">PostgreSQL Insert:</span>
                    <span className="metric-value">{metrics.postgresInsertTime}ms</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Redis Sync:</span>
                    <span className="metric-value">{metrics.redisSyncTime}ms</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Total Time:</span>
                    <span className="metric-value">{metrics.totalTime}ms</span>
                  </div>
                </div>
              </div>
            )}

            <div className="rdi-demo-table-wrapper">
              {customers.length === 0 ? (
                <div className="rdi-demo-empty">
                  <p>No customers yet. Add one using the form!</p>
                </div>
              ) : (
                <table className="rdi-demo-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Country</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="fade-in">
                        <td>{customer.id}</td>
                        <td>{customer.name}</td>
                        <td>{customer.email}</td>
                        <td>{customer.country || '-'}</td>
                        <td>{new Date(customer.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
