'use client';

import { useState, useEffect, useCallback } from 'react';

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
  rdiSyncTime?: number;
  totalTime?: number;
}

interface ApiResponse {
  timestamp?: number;
  cached?: boolean;
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
  const [lastFetch, setLastFetch] = useState<ApiResponse>({});

  // Fetch customers from Redis - wrapped in useCallback for stable reference
  const fetchCustomers = useCallback(async () => {
    try {
      console.log('=== FETCHING CUSTOMERS FROM REDIS ===');
      const response = await fetch('/api/rdi/get-customers', {
        cache: 'no-store', // Prevent caching
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetch customers response:', data);
      console.log('Response timestamp:', data.timestamp, '(', new Date(data.timestamp).toISOString(), ')');
      console.log('Response cached:', data.cached);
      console.log('Customers array:', data.customers);
      console.log('Customers array length:', data.customers?.length);
      console.log('Customers array type:', typeof data.customers);
      console.log('Is array?:', Array.isArray(data.customers));

      if (data.success && data.customers) {
        const customerArray = Array.isArray(data.customers) ? data.customers : [];
        console.log('Setting customers - count:', customerArray.length);
        console.log('Customer data:', JSON.stringify(customerArray, null, 2));

        // Force state update with new array reference
        console.log('About to call setCustomers with:', customerArray);
        setCustomers([...customerArray]);

        console.log('✓ setCustomers called successfully');

        // Store fetch metadata
        setLastFetch({
          timestamp: data.timestamp,
          cached: data.cached
        });

        if (data.metrics) {
          setMetrics(prev => ({ ...prev, redisReadTime: data.metrics.redisReadTime }));
        }
      } else {
        console.error('Failed to fetch customers:', data.error || 'Invalid response');
        setError(data.error || 'Failed to fetch customers');
        setCustomers([]); // Ensure we set empty array
      }
    } catch (err) {
      console.error('❌ Error fetching customers:', err);
      setError('Failed to fetch customers');
      setCustomers([]); // Ensure we set empty array on error
    }
    console.log('=== FETCH COMPLETE ===\n');
  }, []); // Empty deps - function is stable

  // Load customers on mount
  useEffect(() => {
    console.log('Component mounted, fetching customers...');
    fetchCustomers();
  }, []);

  // Log state changes
  useEffect(() => {
    console.log('Customers state changed:', customers);
    console.log('Customers count in state:', customers.length);
  }, [customers]);

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
        setSuccess(`Customer "${data.customer.name}" added to PostgreSQL - RDI automatically synced to Redis!`);
        if (data.metrics) {
          setMetrics(prev => ({
            ...prev,
            postgresInsertTime: data.metrics.postgresInsertTime,
            rdiSyncTime: data.metrics.rdiSyncTime,
            totalTime: data.metrics.totalTime
          }));
        }
        setName('');
        setEmail('');
        setCountry('');

        // Refresh the customer list - CRITICAL for UI update
        console.log('🔄 INSERT SUCCESSFUL - Refreshing customer list...');
        await fetchCustomers();
        console.log('✓ Customer list refreshed after insert');
      } else {
        setError(data.error || 'Failed to add customer');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Clear all customers (PostgreSQL + RDI sync to Redis)
  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all customers from PostgreSQL? (RDI will sync deletion to Redis)')) {
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
        setSuccess(`Cleared ${data.deletedCount} customers from PostgreSQL - RDI automatically synced deletion to Redis`);

        // Refetch to ensure state is in sync - CRITICAL for UI update
        console.log('🔄 DELETE SUCCESSFUL - Refreshing customer list...');
        await fetchCustomers();
        console.log('✓ Customer list refreshed after delete');

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

  // Manually clear Redis only (for debugging/cleanup)
  const handleClearRedis = async () => {
    if (!confirm('Manually clear Redis cache? (This does NOT touch PostgreSQL)')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Manually clearing Redis...');
      const response = await fetch('/api/rdi/clear-redis', {
        method: 'POST',
      });

      const data = await response.json();
      console.log('Clear Redis response:', data);

      if (response.ok) {
        setSuccess(`Manually cleared ${data.deletedCount} records from Redis cache`);

        // Refetch to ensure state is in sync - CRITICAL for UI update
        console.log('🔄 REDIS CLEAR SUCCESSFUL - Refreshing customer list...');
        await fetchCustomers();
        console.log('✓ Customer list refreshed after Redis clear');

        // Reset metrics
        setMetrics({});
      } else {
        setError(data.error || 'Failed to clear Redis');
        console.error('Clear Redis failed:', data);
      }
    } catch (err: any) {
      console.error('Error clearing Redis:', err);
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
                  disabled={loading}
                >
                  Clear All (PG + RDI)
                </button>
                <button
                  type="button"
                  className="rdi-demo-button secondary"
                  onClick={handleClearRedis}
                  disabled={loading}
                  style={{ fontSize: '0.85rem' }}
                >
                  Clear Redis Only
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
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    console.log('Manual refresh clicked');
                    fetchCustomers();
                  }}
                  style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.85rem',
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={async () => {
                    console.log('Testing API directly...');
                    const res = await fetch('/api/rdi/get-customers');
                    const json = await res.json();
                    console.log('RAW API Response:', json);
                    alert(`API returned ${json.customers?.length || 0} customers. Check console for details.`);
                  }}
                  style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.85rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🧪 Test API
                </button>
                <span className="rdi-demo-badge redis">Cache/Target</span>
              </div>
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
              <div className="stat">
                <span className="stat-value" style={{ fontSize: '0.85rem' }}>
                  {lastFetch.timestamp ? new Date(lastFetch.timestamp).toLocaleTimeString() : '-'}
                </span>
                <span className="stat-label">Last Fetch</span>
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
                    <span className="metric-label">RDI Sync to Redis:</span>
                    <span className="metric-value">{metrics.rdiSyncTime}ms</span>
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
                  <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>
                    Check browser console for debug logs
                  </p>
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
