'use client';

import { useState } from 'react';
import CodeExamplesPanel from './CodeExamplesPanel';
import UseCaseExplanation from './UseCaseExplanation';
import { probabilisticExamples } from '@/lib/codeExamples';
import { probabilisticUseCases } from '@/lib/useCases';

interface ProbabilisticDemoModalProps {
  onClose: () => void;
}

export default function ProbabilisticDemoModal({ onClose }: ProbabilisticDemoModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'bloom' | 'hyperloglog' | 'cms' | 'topk' | 'cuckoo'>('bloom');
  const [redisCommand, setRedisCommand] = useState('');

  // Bloom Filter state
  const [bloomItem, setBloomItem] = useState('');
  const [bloomResult, setBloomResult] = useState<any>(null);

  // HyperLogLog state
  const [hllUserId, setHllUserId] = useState('');
  const [hllStats, setHllStats] = useState<any>(null);

  // Count-Min Sketch state
  const [cmsItem, setCmsItem] = useState('');
  const [cmsStats, setCmsStats] = useState<any>(null);

  // Top-K state
  const [topkItem, setTopkItem] = useState('');
  const [topkList, setTopkList] = useState<any>(null);

  // Cuckoo Filter state
  const [cuckooItem, setCuckooItem] = useState('');
  const [cuckooResult, setCuckooResult] = useState<any>(null);

  // Bloom Filter: Add item
  const handleBloomAdd = async () => {
    if (!bloomItem) {
      setStatusMessage({ type: 'error', text: 'Please enter an item' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`BF.ADD passwordlist:bloom "${bloomItem}"`);

    try {
      const response = await fetch('/api/probabilistic/bloom/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: bloomItem })
      });

      const data = await response.json();

      if (data.success) {
        setBloomResult(data);
        setStatusMessage({ type: 'success', text: data.message });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to add item to Bloom Filter' });
    } finally {
      setLoading(false);
    }
  };

  // Bloom Filter: Check item
  const handleBloomCheck = async () => {
    if (!bloomItem) {
      setStatusMessage({ type: 'error', text: 'Please enter an item' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`BF.EXISTS passwordlist:bloom "${bloomItem}"`);

    try {
      const response = await fetch('/api/probabilistic/bloom/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: bloomItem })
      });

      const data = await response.json();

      if (data.success) {
        setBloomResult(data);
        setStatusMessage({
          type: data.exists ? 'warning' : 'success',
          text: data.exists
            ? '⚠️ Item might exist (or false positive)'
            : '✅ Item definitely does NOT exist'
        });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to check item in Bloom Filter' });
    } finally {
      setLoading(false);
    }
  };

  // HyperLogLog: Add visitor
  const handleHllAdd = async () => {
    if (!hllUserId) {
      setStatusMessage({ type: 'error', text: 'Please enter a user ID' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`PFADD visitors:today "${hllUserId}"`);

    try {
      const response = await fetch('/api/probabilistic/hyperloglog/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: hllUserId })
      });

      const data = await response.json();

      if (data.success) {
        setHllStats(data);
        setStatusMessage({ type: 'success', text: data.message });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to add visitor' });
    } finally {
      setLoading(false);
    }
  };

  // HyperLogLog: Get count
  const handleHllCount = async () => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand('PFCOUNT visitors:today visitors:week visitors:month');

    try {
      const response = await fetch('/api/probabilistic/hyperloglog/count');
      const data = await response.json();

      if (data.success) {
        setHllStats(data);
        setStatusMessage({ type: 'success', text: 'Unique visitor counts retrieved' });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to get visitor count' });
    } finally {
      setLoading(false);
    }
  };

  // Count-Min Sketch: Increment item
  const handleCmsIncrement = async () => {
    if (!cmsItem) {
      setStatusMessage({ type: 'error', text: 'Please enter an item' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`CMS.INCRBY pageviews:cms "${cmsItem}" 1`);

    try {
      const response = await fetch('/api/probabilistic/cms/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: cmsItem })
      });

      const data = await response.json();

      if (data.success) {
        setCmsStats(data);
        setStatusMessage({ type: 'success', text: `Incremented ${cmsItem}` });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to increment item' });
    } finally {
      setLoading(false);
    }
  };

  // Count-Min Sketch: Query item
  const handleCmsQuery = async () => {
    if (!cmsItem) {
      setStatusMessage({ type: 'error', text: 'Please enter an item' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`CMS.QUERY pageviews:cms "${cmsItem}"`);

    try {
      const response = await fetch('/api/probabilistic/cms/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: cmsItem })
      });

      const data = await response.json();

      if (data.success) {
        setCmsStats(data);
        setStatusMessage({ type: 'success', text: `Frequency: ${data.frequency}` });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to query item' });
    } finally {
      setLoading(false);
    }
  };

  // Top-K: Add item
  const handleTopkAdd = async () => {
    if (!topkItem) {
      setStatusMessage({ type: 'error', text: 'Please enter an item' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`TOPK.ADD trending:topk "${topkItem}"`);

    try {
      const response = await fetch('/api/probabilistic/topk/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: topkItem })
      });

      const data = await response.json();

      if (data.success) {
        setTopkList(data);
        setStatusMessage({ type: 'success', text: 'Item added to trending' });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to add item' });
    } finally {
      setLoading(false);
    }
  };

  // Top-K: Get list
  const handleTopkList = async () => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand('TOPK.LIST trending:topk');

    try {
      const response = await fetch('/api/probabilistic/topk/list');
      const data = await response.json();

      if (data.success) {
        setTopkList(data);
        setStatusMessage({ type: 'success', text: `Retrieved top ${data.items.length} trending items` });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to get trending list' });
    } finally {
      setLoading(false);
    }
  };

  // Cuckoo Filter: Add item
  const handleCuckooAdd = async () => {
    if (!cuckooItem) {
      setStatusMessage({ type: 'error', text: 'Please enter an item' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`CF.ADD blocklist:cuckoo "${cuckooItem}"`);

    try {
      const response = await fetch('/api/probabilistic/cuckoo/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: cuckooItem })
      });

      const data = await response.json();

      if (data.success) {
        setCuckooResult(data);
        setStatusMessage({ type: 'success', text: data.message });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to add item to Cuckoo Filter' });
    } finally {
      setLoading(false);
    }
  };

  // Cuckoo Filter: Check item
  const handleCuckooCheck = async () => {
    if (!cuckooItem) {
      setStatusMessage({ type: 'error', text: 'Please enter an item' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`CF.EXISTS blocklist:cuckoo "${cuckooItem}"`);

    try {
      const response = await fetch('/api/probabilistic/cuckoo/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: cuckooItem })
      });

      const data = await response.json();

      if (data.success) {
        setCuckooResult(data);
        setStatusMessage({
          type: data.exists ? 'warning' : 'success',
          text: data.exists ? '⚠️ Item exists' : '✅ Item not found'
        });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to check item' });
    } finally {
      setLoading(false);
    }
  };

  // Cuckoo Filter: Delete item
  const handleCuckooDelete = async () => {
    if (!cuckooItem) {
      setStatusMessage({ type: 'error', text: 'Please enter an item' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`CF.DEL blocklist:cuckoo "${cuckooItem}"`);

    try {
      const response = await fetch('/api/probabilistic/cuckoo/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: cuckooItem })
      });

      const data = await response.json();

      if (data.success) {
        setCuckooResult(data);
        setStatusMessage({ type: 'success', text: data.message });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to delete item' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'bloom', label: 'Bloom Filter', icon: '🔍' },
    { id: 'hyperloglog', label: 'HyperLogLog', icon: '👥' },
    { id: 'cms', label: 'Count-Min Sketch', icon: '📊' },
    { id: 'topk', label: 'Top-K', icon: '🔥' },
    { id: 'cuckoo', label: 'Cuckoo Filter', icon: '🦆' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎲 Probabilistic Data Structures</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="section-description">
            Memory-efficient structures for approximate queries with guaranteed error bounds
          </p>

          {/* Tabs */}
          <div className="tab-buttons">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          {/* Redis Command Display */}
          {redisCommand && (
            <div className="redis-command">
              <strong>Redis Command:</strong>
              <code>{redisCommand}</code>
            </div>
          )}

          {/* Bloom Filter Tab */}
          {activeTab === 'bloom' && (
            <div className="search-section">
              <h3>🔍 Bloom Filter - Password Breach Checker</h3>
              <p className="section-description">
                Space-efficient probabilistic data structure to test if a password has been compromised.
                False positives possible (might say yes when no), but false negatives impossible.
              </p>

              <div className="input-group">
                <label>Password to Check</label>
                <input
                  type="text"
                  value={bloomItem}
                  onChange={(e) => setBloomItem(e.target.value)}
                  placeholder="password123"
                />
              </div>

              <div className="button-group">
                <button onClick={handleBloomAdd} disabled={loading} className="primary">
                  {loading ? 'Adding...' : '➕ Add to Breach List'}
                </button>
                <button onClick={handleBloomCheck} disabled={loading} className="secondary">
                  {loading ? 'Checking...' : '🔍 Check Password'}
                </button>
              </div>

              {bloomResult && (
                <div className="result-box" style={{ marginTop: '1rem' }}>
                  <h4>Result</h4>
                  {bloomResult.exists !== undefined && (
                    <div style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
                      {bloomResult.exists ? (
                        <span style={{ color: '#dc2626' }}>
                          ⚠️ Password <strong>might be</strong> compromised (or false positive)
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a' }}>
                          ✅ Password is <strong>definitely NOT</strong> compromised
                        </span>
                      )}
                    </div>
                  )}
                  {bloomResult.added && (
                    <p style={{ marginTop: '0.5rem', color: '#666' }}>
                      Password added to breach database
                    </p>
                  )}
                  <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                    <strong>How it works:</strong> Bloom Filters use ~1% of space compared to storing actual passwords.
                    Error rate: ~0.1% false positive rate.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HyperLogLog Tab */}
          {activeTab === 'hyperloglog' && (
            <div className="search-section">
              <h3>👥 HyperLogLog - Unique Visitor Counter</h3>
              <p className="section-description">
                Count unique visitors with 99% accuracy using only 12KB of memory (vs GBs for exact counts)
              </p>

              <div className="input-group">
                <label>User/Visitor ID</label>
                <input
                  type="text"
                  value={hllUserId}
                  onChange={(e) => setHllUserId(e.target.value)}
                  placeholder="user_12345"
                />
              </div>

              <div className="button-group">
                <button onClick={handleHllAdd} disabled={loading} className="primary">
                  {loading ? 'Adding...' : '➕ Add Visitor'}
                </button>
                <button onClick={handleHllCount} disabled={loading} className="secondary">
                  {loading ? 'Counting...' : '📊 Get Unique Counts'}
                </button>
              </div>

              {hllStats && (
                <div className="result-box" style={{ marginTop: '1rem' }}>
                  <h4>Unique Visitor Statistics</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginTop: '1rem'
                  }}>
                    <div style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {hllStats.uniqueToday || 0}
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Today</div>
                    </div>
                    <div style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {hllStats.uniqueWeek || 0}
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>This Week</div>
                    </div>
                    <div style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {hllStats.uniqueMonth || 0}
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>This Month</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                    <strong>Space efficiency:</strong> Each HyperLogLog uses only 12KB regardless of unique count (millions or billions)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Count-Min Sketch Tab */}
          {activeTab === 'cms' && (
            <div className="search-section">
              <h3>📊 Count-Min Sketch - Page View Counter</h3>
              <p className="section-description">
                Track frequency of events with minimal memory. Never underestimates, may overestimate by small margin.
              </p>

              <div className="input-group">
                <label>Page URL / Event Name</label>
                <input
                  type="text"
                  value={cmsItem}
                  onChange={(e) => setCmsItem(e.target.value)}
                  placeholder="/products/laptop-x"
                />
              </div>

              <div className="button-group">
                <button onClick={handleCmsIncrement} disabled={loading} className="primary">
                  {loading ? 'Incrementing...' : '➕ Track Page View'}
                </button>
                <button onClick={handleCmsQuery} disabled={loading} className="secondary">
                  {loading ? 'Querying...' : '📊 Get View Count'}
                </button>
              </div>

              {cmsStats && (
                <div className="result-box" style={{ marginTop: '1rem' }}>
                  <h4>Frequency Statistics</h4>
                  {cmsStats.frequency !== undefined && (
                    <div style={{
                      padding: '2rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      borderRadius: '12px',
                      textAlign: 'center',
                      marginTop: '1rem'
                    }}>
                      <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                        {cmsStats.frequency}
                      </div>
                      <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                        Page Views (approximate)
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                    <strong>Accuracy:</strong> Count-Min Sketch guarantees the count is within ±0.01% of true value with 99% probability
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top-K Tab */}
          {activeTab === 'topk' && (
            <div className="search-section">
              <h3>🔥 Top-K - Trending Items Tracker</h3>
              <p className="section-description">
                Track most frequent items (trending hashtags, popular products) without storing all data
              </p>

              <div className="input-group">
                <label>Item / Hashtag</label>
                <input
                  type="text"
                  value={topkItem}
                  onChange={(e) => setTopkItem(e.target.value)}
                  placeholder="#redis"
                />
              </div>

              <div className="button-group">
                <button onClick={handleTopkAdd} disabled={loading} className="primary">
                  {loading ? 'Adding...' : '➕ Track Item'}
                </button>
                <button onClick={handleTopkList} disabled={loading} className="secondary">
                  {loading ? 'Loading...' : '🔥 Get Trending'}
                </button>
              </div>

              {topkList && topkList.items && (
                <div className="result-box" style={{ marginTop: '1rem' }}>
                  <h4>🔥 Top Trending Items</h4>
                  <div style={{ marginTop: '1rem' }}>
                    {topkList.items.map((item: string, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          background: idx < 3 ? '#fef3c7' : '#f3f4f6',
                          border: idx < 3 ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontWeight: idx < 3 ? 'bold' : 'normal' }}>
                          #{idx + 1} {item}
                        </span>
                        {idx < 3 && <span style={{ fontSize: '1.5rem' }}>🔥</span>}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                    <strong>Memory efficient:</strong> Tracks top items without storing frequency of all items
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cuckoo Filter Tab */}
          {activeTab === 'cuckoo' && (
            <div className="search-section">
              <h3>🦆 Cuckoo Filter - IP Blocklist Manager</h3>
              <p className="section-description">
                Like Bloom Filter but supports deletion. Perfect for temporary blocklists and spam filters.
              </p>

              <div className="input-group">
                <label>IP Address / User ID</label>
                <input
                  type="text"
                  value={cuckooItem}
                  onChange={(e) => setCuckooItem(e.target.value)}
                  placeholder="192.168.1.100"
                />
              </div>

              <div className="button-group">
                <button onClick={handleCuckooAdd} disabled={loading} className="primary">
                  {loading ? 'Adding...' : '➕ Block IP'}
                </button>
                <button onClick={handleCuckooCheck} disabled={loading} className="secondary">
                  {loading ? 'Checking...' : '🔍 Check IP'}
                </button>
                <button onClick={handleCuckooDelete} disabled={loading} className="primary" style={{ background: '#dc3545' }}>
                  {loading ? 'Deleting...' : '❌ Unblock IP'}
                </button>
              </div>

              {cuckooResult && (
                <div className="result-box" style={{ marginTop: '1rem' }}>
                  <h4>Blocklist Status</h4>
                  {cuckooResult.exists !== undefined && (
                    <div style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
                      {cuckooResult.exists ? (
                        <span style={{ color: '#dc2626' }}>
                          🚫 IP is <strong>BLOCKED</strong>
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a' }}>
                          ✅ IP is <strong>ALLOWED</strong>
                        </span>
                      )}
                    </div>
                  )}
                  {cuckooResult.deleted && (
                    <p style={{ marginTop: '0.5rem', color: '#16a34a' }}>
                      ✅ IP removed from blocklist
                    </p>
                  )}
                  {cuckooResult.added && (
                    <p style={{ marginTop: '0.5rem', color: '#dc2626' }}>
                      🚫 IP added to blocklist
                    </p>
                  )}
                  <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                    <strong>Advantage over Bloom Filter:</strong> Supports deletion while maintaining same space efficiency
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Use Case Guide */}
          <UseCaseExplanation data={probabilisticUseCases} defaultOpen={false} />

          {/* Code Examples */}
          <CodeExamplesPanel examples={probabilisticExamples} defaultOpen={false} />
        </div>
      </div>
    </div>
  );
}
