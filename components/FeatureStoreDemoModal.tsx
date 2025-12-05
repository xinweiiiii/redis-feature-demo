'use client';

import { useState, useEffect } from 'react';

interface UserFeatures {
  userId: string;
  transactionCount24h: number;
  transactionCount1h: number;
  avgTransactionAmount: number;
  maxTransactionAmount: number;
  accountAgeDays: number;
  failedLoginAttempts: number;
  distinctDevicesCount: number;
  distinctIpCount: number;
  lastTransactionTimestamp: number;
  fraudScore?: number;
}

interface Transaction {
  userId: string;
  amount: number;
  deviceId: string;
  ipAddress: string;
  location: string;
  timestamp: number;
}

interface FeatureStoreDemoModalProps {
  onClose: () => void;
}

export default function FeatureStoreDemoModal({ onClose }: FeatureStoreDemoModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'compute' | 'retrieve' | 'models' | 'performance' | 'batch' | 'stats'>('compute');
  const [redisCommand, setRedisCommand] = useState('');

  // Compute features state
  const [userId, setUserId] = useState('user_12345');
  const [amount, setAmount] = useState('150.00');
  const [deviceId, setDeviceId] = useState('device_abc123');
  const [ipAddress, setIpAddress] = useState('192.168.1.1');
  const [location, setLocation] = useState('New York, US');
  const [computedFeatures, setComputedFeatures] = useState<UserFeatures | null>(null);

  // Retrieve features state
  const [retrieveUserId, setRetrieveUserId] = useState('user_12345');
  const [retrievedFeatures, setRetrievedFeatures] = useState<UserFeatures | null>(null);

  // Batch retrieve state
  const [batchUserIds, setBatchUserIds] = useState('user_12345,user_67890,user_111');
  const [batchFeatures, setBatchFeatures] = useState<UserFeatures[]>([]);

  // Stats state
  const [stats, setStats] = useState<any>(null);

  // ML Models state
  const [modelUserId, setModelUserId] = useState('user_12345');
  const [modelPredictions, setModelPredictions] = useState<any>(null);

  // Performance state
  const [perfUserId, setPerfUserId] = useState('user_12345');
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/feature-store/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleComputeFeatures = async () => {
    if (!userId || !amount) {
      setStatusMessage({ type: 'error', text: 'Please enter user ID and amount' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand('HSET features:user_12345 ...\nZINCRBY transactions:24h user_12345 1\nHINCRBY user:stats:user_12345 transaction_count 1');

    try {
      const transaction: Transaction = {
        userId,
        amount: parseFloat(amount),
        deviceId,
        ipAddress,
        location,
        timestamp: Date.now()
      };

      const response = await fetch('/api/feature-store/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction })
      });

      const data = await response.json();

      if (data.success) {
        setComputedFeatures(data.features);
        setStatusMessage({
          type: data.features.fraudScore && data.features.fraudScore > 0.7 ? 'warning' : 'success',
          text: `Features computed! Fraud Score: ${((data.features.fraudScore || 0) * 100).toFixed(1)}%`
        });
        loadStats();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to compute features' });
      }
    } catch (error) {
      console.error('Error computing features:', error);
      setStatusMessage({ type: 'error', text: 'An error occurred while computing features' });
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieveFeatures = async () => {
    if (!retrieveUserId) {
      setStatusMessage({ type: 'error', text: 'Please enter user ID' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`HGETALL features:${retrieveUserId}`);

    try {
      const response = await fetch('/api/feature-store/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: retrieveUserId })
      });

      const data = await response.json();

      if (data.success) {
        setRetrievedFeatures(data.features);
        setStatusMessage({ type: 'success', text: 'Features retrieved successfully' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to retrieve features' });
        setRetrievedFeatures(null);
      }
    } catch (error) {
      console.error('Error retrieving features:', error);
      setStatusMessage({ type: 'error', text: 'An error occurred while retrieving features' });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchRetrieve = async () => {
    if (!batchUserIds) {
      setStatusMessage({ type: 'error', text: 'Please enter user IDs' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    const userIds = batchUserIds.split(',').map(id => id.trim());
    setRedisCommand(`PIPELINE\n${userIds.map(id => `HGETALL features:${id}`).join('\n')}\nEXEC`);

    try {
      const response = await fetch('/api/feature-store/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });

      const data = await response.json();

      if (data.success) {
        setBatchFeatures(data.features);
        setStatusMessage({ type: 'success', text: `Retrieved features for ${data.features.length} users` });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to retrieve batch features' });
      }
    } catch (error) {
      console.error('Error retrieving batch features:', error);
      setStatusMessage({ type: 'error', text: 'An error occurred while retrieving batch features' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSampleData = async () => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand('Generating sample transactions for multiple users...');

    try {
      const response = await fetch('/api/feature-store/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 50 })
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: `Generated ${data.transactionsGenerated} sample transactions` });
        loadStats();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to generate sample data' });
      }
    } catch (error) {
      console.error('Error generating sample data:', error);
      setStatusMessage({ type: 'error', text: 'An error occurred while generating sample data' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all feature store data?')) {
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/feature-store/clear', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: 'All feature store data cleared' });
        setComputedFeatures(null);
        setRetrievedFeatures(null);
        setBatchFeatures([]);
        setStats(null);
        loadStats();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to clear data' });
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      setStatusMessage({ type: 'error', text: 'An error occurred while clearing data' });
    } finally {
      setLoading(false);
    }
  };

  const renderFeatureCard = (features: UserFeatures) => {
    const fraudScore = features.fraudScore || 0;
    const scoreColor = fraudScore > 0.7 ? '#ff5722' : fraudScore > 0.4 ? '#ff9800' : '#4caf50';

    return (
      <div className="result-box success" style={{ marginTop: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <h4 style={{ margin: 0 }}>User: {features.userId}</h4>
          {features.fraudScore !== undefined && (
            <div style={{
              padding: '0.5rem 1rem',
              background: scoreColor,
              color: 'white',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}>
              Fraud Score: {(fraudScore * 100).toFixed(1)}%
            </div>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.9rem'
        }}>
          <div>
            <strong>Transactions (24h):</strong> {features.transactionCount24h}
          </div>
          <div>
            <strong>Transactions (1h):</strong> {features.transactionCount1h}
          </div>
          <div>
            <strong>Avg Amount:</strong> ${features.avgTransactionAmount.toFixed(2)}
          </div>
          <div>
            <strong>Max Amount:</strong> ${features.maxTransactionAmount.toFixed(2)}
          </div>
          <div>
            <strong>Account Age:</strong> {features.accountAgeDays} days
          </div>
          <div>
            <strong>Failed Logins:</strong> {features.failedLoginAttempts}
          </div>
          <div>
            <strong>Devices Used:</strong> {features.distinctDevicesCount}
          </div>
          <div>
            <strong>IP Addresses:</strong> {features.distinctIpCount}
          </div>
        </div>
      </div>
    );
  };

  const handleRunModels = async () => {
    if (!modelUserId) {
      setStatusMessage({ type: 'error', text: 'Please enter user ID' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand('Running multiple ML models using same features from Redis...');

    try {
      const [fraudRes, creditRes, personalRes] = await Promise.all([
        fetch('/api/feature-store/models/fraud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: modelUserId })
        }),
        fetch('/api/feature-store/models/credit-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: modelUserId })
        }),
        fetch('/api/feature-store/models/personalization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: modelUserId })
        })
      ]);

      const [fraudData, creditData, personalData] = await Promise.all([
        fraudRes.json(),
        creditRes.json(),
        personalRes.json()
      ]);

      if (fraudData.success && creditData.success && personalData.success) {
        setModelPredictions({
          fraud: fraudData,
          credit: creditData,
          personalization: personalData
        });
        setStatusMessage({ type: 'success', text: 'Successfully ran 3 ML models using shared features!' });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to run one or more models. Ensure features are computed first.' });
      }
    } catch (error) {
      console.error('Error running models:', error);
      setStatusMessage({ type: 'error', text: 'An error occurred while running models' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunPerformance = async () => {
    if (!perfUserId) {
      setStatusMessage({ type: 'error', text: 'Please enter user ID' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand('Comparing Feature Store vs On-Demand computation...');

    try {
      const response = await fetch('/api/feature-store/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: perfUserId })
      });

      const data = await response.json();

      if (data.success) {
        setPerformanceData(data);
        setStatusMessage({ type: 'success', text: `Feature Store is ${data.comparison.summary.speedup} faster!` });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to run performance comparison' });
      }
    } catch (error) {
      console.error('Error running performance test:', error);
      setStatusMessage({ type: 'error', text: 'An error occurred during performance test' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'compute', label: 'Compute Features', icon: '⚡' },
    { id: 'retrieve', label: 'Retrieve Features', icon: '📊' },
    { id: 'models', label: 'ML Models', icon: '🤖' },
    { id: 'performance', label: 'Performance', icon: '🚀' },
    { id: 'batch', label: 'Batch Retrieve', icon: '📦' },
    { id: 'stats', label: 'Statistics', icon: '📈' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content feature-store-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔍 Feature Store - Fraud Analytics</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="section-description">
            Real-time ML feature management for fraud detection using Redis as a low-latency feature store
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

          {/* Compute Features Tab */}
          {activeTab === 'compute' && (
            <div className="search-section">
              <h3>Process Transaction & Compute Features</h3>
              <p className="section-description">
                Simulate a transaction to compute real-time fraud detection features
              </p>

              <div className="input-row" style={{ marginBottom: '1rem' }}>
                <div className="input-group">
                  <label>User ID</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="user_12345"
                  />
                </div>

                <div className="input-group">
                  <label>Transaction Amount ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="150.00"
                    step="0.01"
                  />
                </div>

                <div className="input-group">
                  <label>Device ID</label>
                  <input
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="device_abc123"
                  />
                </div>

                <div className="input-group">
                  <label>IP Address</label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="192.168.1.1"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="New York, US"
                />
              </div>

              <button
                onClick={handleComputeFeatures}
                disabled={loading}
                className="primary"
                style={{ marginTop: '1rem' }}
              >
                {loading ? 'Processing...' : '⚡ Process Transaction'}
              </button>

              {computedFeatures && renderFeatureCard(computedFeatures)}
            </div>
          )}

          {/* Retrieve Features Tab */}
          {activeTab === 'retrieve' && (
            <div className="search-section">
              <h3>Retrieve User Features</h3>
              <p className="section-description">
                Fetch real-time features for fraud scoring
              </p>

              <div className="input-group">
                <label>User ID</label>
                <input
                  type="text"
                  value={retrieveUserId}
                  onChange={(e) => setRetrieveUserId(e.target.value)}
                  placeholder="user_12345"
                />
              </div>

              <button
                onClick={handleRetrieveFeatures}
                disabled={loading}
                className="secondary"
                style={{ marginTop: '1rem' }}
              >
                {loading ? 'Retrieving...' : '📊 Retrieve Features'}
              </button>

              {retrievedFeatures && renderFeatureCard(retrievedFeatures)}
            </div>
          )}

          {/* ML Models Tab */}
          {activeTab === 'models' && (
            <div className="search-section">
              <h3>🤖 Multiple ML Models - Shared Features</h3>
              <p className="section-description">
                Demonstrate how multiple ML models consume the same features from the Feature Store for different predictions
              </p>

              <div className="input-group">
                <label>User ID</label>
                <input
                  type="text"
                  value={modelUserId}
                  onChange={(e) => setModelUserId(e.target.value)}
                  placeholder="user_12345"
                />
              </div>

              <button
                onClick={handleRunModels}
                disabled={loading}
                className="primary"
                style={{ marginTop: '1rem', background: '#7c3aed' }}
              >
                {loading ? 'Running Models...' : '🤖 Run All Models'}
              </button>

              {modelPredictions && (
                <div style={{ marginTop: '1.5rem' }}>
                  {/* Feature Reuse Banner */}
                  <div style={{
                    background: '#e0f2fe',
                    border: '2px solid #0ea5e9',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <strong style={{ color: '#0369a1' }}>✨ Feature Reusability</strong>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#0c4a6e' }}>
                      All 3 models retrieved the same features in parallel from Redis in &lt;{modelPredictions.fraud.performance.featureRetrievalMs}ms each!
                    </p>
                  </div>

                  {/* Fraud Detection Model */}
                  <div className="result-box" style={{ marginBottom: '1rem', borderLeft: '4px solid #ef4444' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', color: '#dc2626' }}>🚨 Fraud Detection Model</h4>
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Model:</strong> {modelPredictions.fraud.model} ({modelPredictions.fraud.modelType})
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Fraud Probability:</strong> <span style={{
                          color: modelPredictions.fraud.prediction.fraudProbability > 0.7 ? '#dc2626' :
                                 modelPredictions.fraud.prediction.fraudProbability > 0.4 ? '#f59e0b' : '#16a34a',
                          fontWeight: 'bold',
                          fontSize: '1.1rem'
                        }}>
                          {(modelPredictions.fraud.prediction.fraudProbability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Risk Level:</strong> <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          background: modelPredictions.fraud.prediction.riskLevel === 'HIGH' ? '#fee2e2' :
                                     modelPredictions.fraud.prediction.riskLevel === 'MEDIUM' ? '#fef3c7' : '#d1fae5',
                          color: modelPredictions.fraud.prediction.riskLevel === 'HIGH' ? '#dc2626' :
                                modelPredictions.fraud.prediction.riskLevel === 'MEDIUM' ? '#f59e0b' : '#16a34a'
                        }}>
                          {modelPredictions.fraud.prediction.riskLevel}
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Features used: {modelPredictions.fraud.featuresUsed.join(', ')}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        ⚡ Inference: {modelPredictions.fraud.performance.inferenceMs}ms
                      </div>
                    </div>
                  </div>

                  {/* Credit Risk Model */}
                  <div className="result-box" style={{ marginBottom: '1rem', borderLeft: '4px solid #3b82f6' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', color: '#2563eb' }}>💳 Credit Risk Model</h4>
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Model:</strong> {modelPredictions.credit.model} ({modelPredictions.credit.modelType})
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Credit Score:</strong> <span style={{
                          color: '#2563eb',
                          fontWeight: 'bold',
                          fontSize: '1.1rem'
                        }}>
                          {modelPredictions.credit.prediction.creditScore}
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Risk Tier:</strong> <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          background: '#dbeafe',
                          color: '#1e40af'
                        }}>
                          {modelPredictions.credit.prediction.riskTier}
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Credit Approved:</strong> {modelPredictions.credit.prediction.approvedForCredit ? '✅ Yes' : '❌ No'}
                      </div>
                      {modelPredictions.credit.prediction.approvedForCredit && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Max Credit Limit:</strong> ${modelPredictions.credit.prediction.maxCreditLimit.toLocaleString()}
                        </div>
                      )}
                      <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Features used: {modelPredictions.credit.featuresUsed.join(', ')}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        ⚡ Inference: {modelPredictions.credit.performance.inferenceMs}ms
                      </div>
                    </div>
                  </div>

                  {/* Personalization Model */}
                  <div className="result-box" style={{ marginBottom: '1rem', borderLeft: '4px solid #8b5cf6' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', color: '#7c3aed' }}>🎯 Personalization Model</h4>
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Model:</strong> {modelPredictions.personalization.model} ({modelPredictions.personalization.modelType})
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>User Segment:</strong> <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          background: '#f3e8ff',
                          color: '#6b21a8',
                          fontWeight: 'bold'
                        }}>
                          {modelPredictions.personalization.prediction.userSegment.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Predicted Lifetime Value:</strong> ${modelPredictions.personalization.prediction.predictedLifetimeValue.toLocaleString()}
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <strong>Top Recommendations:</strong>
                      </div>
                      {modelPredictions.personalization.prediction.topRecommendations.map((rec: any, idx: number) => (
                        <div key={idx} style={{
                          marginLeft: '1rem',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>• {rec.product}</span>
                          <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>{(rec.probability * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                      <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                        Features used: {modelPredictions.personalization.featuresUsed.join(', ')}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        ⚡ Inference: {modelPredictions.personalization.performance.inferenceMs}ms
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Performance Comparison Tab */}
          {activeTab === 'performance' && (
            <div className="search-section">
              <h3>🚀 Performance Comparison</h3>
              <p className="section-description">
                Compare Feature Store (pre-computed) vs On-Demand computation to see the speed benefits
              </p>

              <div className="input-group">
                <label>User ID</label>
                <input
                  type="text"
                  value={perfUserId}
                  onChange={(e) => setPerfUserId(e.target.value)}
                  placeholder="user_12345"
                />
              </div>

              <button
                onClick={handleRunPerformance}
                disabled={loading}
                className="primary"
                style={{ marginTop: '1rem', background: '#f59e0b' }}
              >
                {loading ? 'Testing...' : '🚀 Run Performance Test'}
              </button>

              {performanceData && (
                <div style={{ marginTop: '1.5rem' }}>
                  {/* Summary */}
                  <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {performanceData.comparison.summary.speedup}
                    </div>
                    <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                      Feature Store is faster than on-demand computation
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
                      Saved {performanceData.comparison.summary.timeSavedMs}ms per request
                    </div>
                  </div>

                  {/* Side by Side Comparison */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* Feature Store */}
                    <div style={{
                      background: '#d1fae5',
                      border: '2px solid #10b981',
                      borderRadius: '8px',
                      padding: '1.5rem'
                    }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#065f46' }}>✅ Feature Store</h4>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#065f46', marginBottom: '0.5rem' }}>
                        {performanceData.comparison.summary.featureStoreLatency}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#047857', marginBottom: '1rem' }}>
                        Single Redis HGETALL
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#065f46' }}>
                        <strong>Advantages:</strong>
                        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
                          {performanceData.comparison.featureStore.advantages.map((adv: string, idx: number) => (
                            <li key={idx}>{adv}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* On-Demand */}
                    <div style={{
                      background: '#fee2e2',
                      border: '2px solid #ef4444',
                      borderRadius: '8px',
                      padding: '1.5rem'
                    }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#991b1b' }}>❌ On-Demand</h4>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#991b1b', marginBottom: '0.5rem' }}>
                        {performanceData.comparison.summary.onDemandLatency}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginBottom: '1rem' }}>
                        {performanceData.comparison.onDemand.databaseQueries} database queries + computation
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#991b1b' }}>
                        <strong>Disadvantages:</strong>
                        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
                          {performanceData.comparison.onDemand.disadvantages.map((dis: string, idx: number) => (
                            <li key={idx}>{dis}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Scale Analysis */}
                  <div className="result-box" style={{ background: '#f0f9ff', borderLeft: '4px solid #0ea5e9' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#0c4a6e' }}>📊 Scale Analysis</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#0369a1' }}>
                      At <strong>{performanceData.comparison.scale.targetQPS.toLocaleString()} requests/second</strong>:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#0c4a6e', marginBottom: '0.5rem' }}>
                          <strong>Feature Store:</strong>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#0369a1' }}>
                          Max: {performanceData.comparison.scale.featureStore.maxQPS}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#0369a1' }}>
                          Can Handle Load: {performanceData.comparison.scale.featureStore.canHandleLoad ? '✅ Yes' : '❌ No'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#0c4a6e', marginBottom: '0.5rem' }}>
                          <strong>On-Demand:</strong>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#0369a1' }}>
                          Max: {performanceData.comparison.scale.onDemand.maxQPS}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#0369a1' }}>
                          Can Handle Load: {performanceData.comparison.scale.onDemand.canHandleLoad ? '✅ Yes' : '❌ No'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Batch Retrieve Tab */}
          {activeTab === 'batch' && (
            <div className="search-section">
              <h3>Batch Feature Retrieval</h3>
              <p className="section-description">
                Retrieve features for multiple users in a single request using Redis Pipeline
              </p>

              <div className="input-group">
                <label>User IDs (comma-separated)</label>
                <input
                  type="text"
                  value={batchUserIds}
                  onChange={(e) => setBatchUserIds(e.target.value)}
                  placeholder="user_12345,user_67890,user_111"
                />
              </div>

              <button
                onClick={handleBatchRetrieve}
                disabled={loading}
                className="primary"
                style={{ marginTop: '1rem', background: '#6f42c1' }}
              >
                {loading ? 'Retrieving...' : '📦 Batch Retrieve'}
              </button>

              {batchFeatures.length > 0 && (
                <div>
                  {batchFeatures.map((features, idx) => (
                    <div key={idx}>
                      {renderFeatureCard(features)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="search-section">
              <h3>Feature Store Statistics</h3>
              <p className="section-description">
                Overview of stored features and system metrics
              </p>

              <div className="button-group">
                <button
                  onClick={handleGenerateSampleData}
                  disabled={loading}
                  className="primary"
                  style={{ background: '#17a2b8' }}
                >
                  {loading ? 'Generating...' : '🎲 Generate Sample Data'}
                </button>

                <button
                  onClick={loadStats}
                  disabled={loading}
                  className="secondary"
                  style={{ background: '#6c757d' }}
                >
                  🔄 Refresh Stats
                </button>

                <button
                  onClick={handleClearAll}
                  disabled={loading}
                  className="primary"
                  style={{ background: '#dc3545' }}
                >
                  🗑️ Clear All
                </button>
              </div>

              {stats && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginTop: '1.5rem'
                }}>
                  <div style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalUsers || 0}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Users</div>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalTransactions || 0}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Transactions</div>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      {stats.avgFraudScore ? (stats.avgFraudScore * 100).toFixed(1) : '0.0'}%
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Avg Fraud Score</div>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    color: 'white',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.highRiskUsers || 0}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>High Risk Users</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
