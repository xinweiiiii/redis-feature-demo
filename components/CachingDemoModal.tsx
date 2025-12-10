'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useSwipeToClose } from '@/hooks/useSwipeToClose';
import RedisCommand from './RedisCommand';
import CodeExamplesPanel from './CodeExamplesPanel';
import UseCaseExplanation from './UseCaseExplanation';
import { cachingExamples } from '@/lib/codeExamples';
import { cachingUseCases } from '@/lib/useCases';

interface PerformanceData {
  executionTime: number;
  fromCache: boolean;
  data: any;
}

interface CachingDemoModalProps {
  onClose: () => void;
}

export default function CachingDemoModal({ onClose }: CachingDemoModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [performanceData, setPerformanceData] = useState<Record<string, PerformanceData>>({});

  // Track all cache operations (not just latest per type)
  const [cacheOperations, setCacheOperations] = useState<{ fromCache: boolean }[]>([]);

  // Calculate cache statistics from all operations
  const cacheStats = useMemo(() => {
    const hits = cacheOperations.filter(op => op.fromCache).length;
    const misses = cacheOperations.filter(op => !op.fromCache).length;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;

    return { hits, misses, total, hitRate };
  }, [cacheOperations]);

  // Redis commands state
  const [lastCommand, setLastCommand] = useState<Record<string, string>>({});

  // String state
  const [stringKey, setStringKey] = useState('mystring');
  const [stringValue, setStringValue] = useState('Hello Redis!');
  const [stringResult, setStringResult] = useState<any>(null);

  // Hash state
  const [hashKey, setHashKey] = useState('user:1001');
  const [hashData, setHashData] = useState('{"name":"John Doe","email":"john@example.com","age":"30"}');
  const [hashResult, setHashResult] = useState<any>(null);

  // List state
  const [listKey, setListKey] = useState('mylist');
  const [listValues, setListValues] = useState('["item1","item2","item3"]');
  const [listResult, setListResult] = useState<any>(null);

  // Set state
  const [setKey, setSetKey] = useState('myset');
  const [setMembers, setSetMembers] = useState('["member1","member2","member3"]');
  const [setResult, setSetResult] = useState<any>(null);

  // Sorted Set state
  const [zsetKey, setZsetKey] = useState('leaderboard');
  const [zsetScore, setZsetScore] = useState('100');
  const [zsetValue, setZsetValue] = useState('player1');
  const [zsetResult, setZsetResult] = useState<any>(null);

  const handleApiCall = async (url: string, method: string, body?: any) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const options: RequestInit = {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
      };
      if (body) {
        options.body = JSON.stringify(body);
      }
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // String operations
  const writeString = async () => {
    setLastCommand(prev => ({ ...prev, string: `SET ${stringKey} "${stringValue}"` }));
    const result = await handleApiCall('/api/cache/string', 'POST', {
      key: stringKey,
      value: stringValue,
    });
    setStatusMessage({ type: 'success', text: result.message });
  };

  const readString = async () => {
    setLastCommand(prev => ({ ...prev, string: `GET ${stringKey}` }));
    const result = await handleApiCall(`/api/cache/string?key=${stringKey}`, 'GET');
    setStringResult(result.data);
    setPerformanceData(prev => ({ ...prev, string: result }));
    setCacheOperations(prev => [...prev, { fromCache: result.fromCache }]);
  };

  // Hash operations
  const writeHash = async () => {
    try {
      const data = JSON.parse(hashData);
      const fields = Object.entries(data).map(([k, v]) => `${k} "${v}"`).join(' ');
      setLastCommand(prev => ({ ...prev, hash: `HSET ${hashKey} ${fields}` }));
      const result = await handleApiCall('/api/cache/hash', 'POST', {
        key: hashKey,
        data,
      });
      setStatusMessage({ type: 'success', text: result.message });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Invalid JSON format' });
    }
  };

  const readHash = async () => {
    setLastCommand(prev => ({ ...prev, hash: `HGETALL ${hashKey}` }));
    const result = await handleApiCall(`/api/cache/hash?key=${hashKey}`, 'GET');
    setHashResult(result.data);
    setPerformanceData(prev => ({ ...prev, hash: result }));
    setCacheOperations(prev => [...prev, { fromCache: result.fromCache }]);
  };

  // List operations
  const writeList = async () => {
    try {
      const values = JSON.parse(listValues);
      const valueStr = values.map((v: string) => `"${v}"`).join(' ');
      setLastCommand(prev => ({ ...prev, list: `RPUSH ${listKey} ${valueStr}` }));
      const result = await handleApiCall('/api/cache/list', 'POST', {
        key: listKey,
        values,
      });
      setStatusMessage({ type: 'success', text: result.message });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Invalid JSON array format' });
    }
  };

  const readList = async () => {
    setLastCommand(prev => ({ ...prev, list: `LRANGE ${listKey} 0 -1` }));
    const result = await handleApiCall(`/api/cache/list?key=${listKey}`, 'GET');
    setListResult(result.data);
    setPerformanceData(prev => ({ ...prev, list: result }));
    setCacheOperations(prev => [...prev, { fromCache: result.fromCache }]);
  };

  // Set operations
  const writeSet = async () => {
    try {
      const members = JSON.parse(setMembers);
      const memberStr = members.map((m: string) => `"${m}"`).join(' ');
      setLastCommand(prev => ({ ...prev, set: `SADD ${setKey} ${memberStr}` }));
      const result = await handleApiCall('/api/cache/set', 'POST', {
        key: setKey,
        members,
      });
      setStatusMessage({ type: 'success', text: result.message });
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Invalid JSON array format' });
    }
  };

  const readSet = async () => {
    setLastCommand(prev => ({ ...prev, set: `SMEMBERS ${setKey}` }));
    const result = await handleApiCall(`/api/cache/set?key=${setKey}`, 'GET');
    setSetResult(result.data);
    setPerformanceData(prev => ({ ...prev, set: result }));
    setCacheOperations(prev => [...prev, { fromCache: result.fromCache }]);
  };

  // Sorted Set operations
  const writeZSet = async () => {
    setLastCommand(prev => ({ ...prev, sortedset: `ZADD ${zsetKey} ${zsetScore} "${zsetValue}"` }));
    const result = await handleApiCall('/api/cache/sortedset', 'POST', {
      key: zsetKey,
      score: parseFloat(zsetScore),
      value: zsetValue,
    });
    setStatusMessage({ type: 'success', text: result.message });
  };

  const readZSet = async () => {
    setLastCommand(prev => ({ ...prev, sortedset: `ZRANGE ${zsetKey} 0 -1 WITHSCORES` }));
    const result = await handleApiCall(`/api/cache/sortedset?key=${zsetKey}`, 'GET');
    setZsetResult(result.data);
    setPerformanceData(prev => ({ ...prev, sortedset: result }));
    setCacheOperations(prev => [...prev, { fromCache: result.fromCache }]);
  };

  const { modalProps } = useSwipeToClose({ onClose });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div {...modalProps} className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="swipe-indicator" />
        <div className="modal-header">
          <h2>Basic Caching Demo</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          {/* Cache Statistics */}
          {cacheStats.total > 0 && (
            <div className="data-type-section" style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>📊 Cache Performance Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Cache Hits', value: cacheStats.hits },
                          { name: 'Cache Misses', value: cacheStats.misses }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="metric" style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                    <span style={{ fontWeight: 'bold' }}>Hit Rate:</span>
                    <span style={{
                      color: cacheStats.hitRate >= 70 ? '#10b981' : cacheStats.hitRate >= 40 ? '#f59e0b' : '#ef4444',
                      fontWeight: 'bold',
                      fontSize: '1.3rem'
                    }}>
                      {cacheStats.hitRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="metric" style={{ marginBottom: '0.5rem' }}>
                    <span>Total Requests:</span>
                    <span style={{ fontWeight: 'bold' }}>{cacheStats.total}</span>
                  </div>
                  <div className="metric" style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#10b981' }}>✓ Cache Hits:</span>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{cacheStats.hits}</span>
                  </div>
                  <div className="metric">
                    <span style={{ color: '#ef4444' }}>✗ Cache Misses:</span>
                    <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{cacheStats.misses}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* String */}
          <div className="data-type-section">
            <h3>String</h3>
            <div className="input-group">
              <label>Key</label>
              <input
                type="text"
                value={stringKey}
                onChange={(e) => setStringKey(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label>Value</label>
              <input
                type="text"
                value={stringValue}
                onChange={(e) => setStringValue(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="button-group">
              <button className="primary" onClick={writeString} disabled={loading}>
                Write String
              </button>
              <button className="secondary" onClick={readString} disabled={loading}>
                Read String
              </button>
            </div>
            {lastCommand.string && <RedisCommand command={lastCommand.string} />}
            {stringResult !== null && (
              <div className="result-box success">
                <strong>Result:</strong> {stringResult}
              </div>
            )}
            {performanceData.string && (
              <div className="performance-metrics">
                <h4>Performance Metrics</h4>
                <div className="metric">
                  <span>Execution Time:</span>
                  <span>{performanceData.string.executionTime.toFixed(3)} ms</span>
                </div>
                <div className="metric">
                  <span>From Cache:</span>
                  <span>{performanceData.string.fromCache ? 'Yes' : 'No'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Hash */}
          <div className="data-type-section">
            <h3>Hash</h3>
            <div className="input-group">
              <label>Key</label>
              <input
                type="text"
                value={hashKey}
                onChange={(e) => setHashKey(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label>Data (JSON Object)</label>
              <textarea
                value={hashData}
                onChange={(e) => setHashData(e.target.value)}
                disabled={loading}
                placeholder='{"field1":"value1","field2":"value2"}'
              />
            </div>
            <div className="button-group">
              <button className="primary" onClick={writeHash} disabled={loading}>
                Write Hash
              </button>
              <button className="secondary" onClick={readHash} disabled={loading}>
                Read Hash
              </button>
            </div>
            {lastCommand.hash && <RedisCommand command={lastCommand.hash} />}
            {hashResult && (
              <div className="result-box success">
                <strong>Result:</strong>
                <pre>{JSON.stringify(hashResult, null, 2)}</pre>
              </div>
            )}
            {performanceData.hash && (
              <div className="performance-metrics">
                <h4>Performance Metrics</h4>
                <div className="metric">
                  <span>Execution Time:</span>
                  <span>{performanceData.hash.executionTime.toFixed(3)} ms</span>
                </div>
                <div className="metric">
                  <span>From Cache:</span>
                  <span>{performanceData.hash.fromCache ? 'Yes' : 'No'}</span>
                </div>
              </div>
            )}
          </div>

          {/* List */}
          <div className="data-type-section">
            <h3>List</h3>
            <div className="input-group">
              <label>Key</label>
              <input
                type="text"
                value={listKey}
                onChange={(e) => setListKey(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label>Values (JSON Array)</label>
              <textarea
                value={listValues}
                onChange={(e) => setListValues(e.target.value)}
                disabled={loading}
                placeholder='["value1","value2","value3"]'
              />
            </div>
            <div className="button-group">
              <button className="primary" onClick={writeList} disabled={loading}>
                Write List
              </button>
              <button className="secondary" onClick={readList} disabled={loading}>
                Read List
              </button>
            </div>
            {lastCommand.list && <RedisCommand command={lastCommand.list} />}
            {listResult && (
              <div className="result-box success">
                <strong>Result:</strong>
                <pre>{JSON.stringify(listResult, null, 2)}</pre>
              </div>
            )}
            {performanceData.list && (
              <div className="performance-metrics">
                <h4>Performance Metrics</h4>
                <div className="metric">
                  <span>Execution Time:</span>
                  <span>{performanceData.list.executionTime.toFixed(3)} ms</span>
                </div>
                <div className="metric">
                  <span>From Cache:</span>
                  <span>{performanceData.list.fromCache ? 'Yes' : 'No'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Set */}
          <div className="data-type-section">
            <h3>Set</h3>
            <div className="input-group">
              <label>Key</label>
              <input
                type="text"
                value={setKey}
                onChange={(e) => setSetKey(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label>Members (JSON Array)</label>
              <textarea
                value={setMembers}
                onChange={(e) => setSetMembers(e.target.value)}
                disabled={loading}
                placeholder='["member1","member2","member3"]'
              />
            </div>
            <div className="button-group">
              <button className="primary" onClick={writeSet} disabled={loading}>
                Write Set
              </button>
              <button className="secondary" onClick={readSet} disabled={loading}>
                Read Set
              </button>
            </div>
            {lastCommand.set && <RedisCommand command={lastCommand.set} />}
            {setResult && (
              <div className="result-box success">
                <strong>Result:</strong>
                <pre>{JSON.stringify(setResult, null, 2)}</pre>
              </div>
            )}
            {performanceData.set && (
              <div className="performance-metrics">
                <h4>Performance Metrics</h4>
                <div className="metric">
                  <span>Execution Time:</span>
                  <span>{performanceData.set.executionTime.toFixed(3)} ms</span>
                </div>
                <div className="metric">
                  <span>From Cache:</span>
                  <span>{performanceData.set.fromCache ? 'Yes' : 'No'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sorted Set */}
          <div className="data-type-section">
            <h3>Sorted Set</h3>
            <div className="input-group">
              <label>Key</label>
              <input
                type="text"
                value={zsetKey}
                onChange={(e) => setZsetKey(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label>Score</label>
              <input
                type="number"
                value={zsetScore}
                onChange={(e) => setZsetScore(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label>Value</label>
              <input
                type="text"
                value={zsetValue}
                onChange={(e) => setZsetValue(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="button-group">
              <button className="primary" onClick={writeZSet} disabled={loading}>
                Write Sorted Set
              </button>
              <button className="secondary" onClick={readZSet} disabled={loading}>
                Read Sorted Set
              </button>
            </div>
            {lastCommand.sortedset && <RedisCommand command={lastCommand.sortedset} />}
            {zsetResult && (
              <div className="result-box success">
                <strong>Result:</strong>
                <pre>{JSON.stringify(zsetResult, null, 2)}</pre>
              </div>
            )}
            {performanceData.sortedset && (
              <div className="performance-metrics">
                <h4>Performance Metrics</h4>
                <div className="metric">
                  <span>Execution Time:</span>
                  <span>{performanceData.sortedset.executionTime.toFixed(3)} ms</span>
                </div>
                <div className="metric">
                  <span>From Cache:</span>
                  <span>{performanceData.sortedset.fromCache ? 'Yes' : 'No'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Use Case Guide */}
          <UseCaseExplanation data={cachingUseCases} defaultOpen={false} />

          {/* Code Examples */}
          <CodeExamplesPanel examples={cachingExamples} defaultOpen={false} />
        </div>
      </div>
    </div>
  );
}
