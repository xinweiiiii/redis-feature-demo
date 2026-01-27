'use client';

import { useState, useEffect } from 'react';
import { useSwipeToClose } from '@/hooks/useSwipeToClose';
import RedisCommand from './RedisCommand';
import CodeExamplesPanel from './CodeExamplesPanel';
import UseCaseExplanation from './UseCaseExplanation';
import { cachingExamples } from '@/lib/codeExamples';
import { cachingUseCases } from '@/lib/useCases';

interface CachingDemoModalProps {
  onClose: () => void;
}

export default function CachingDemoModal({ onClose }: CachingDemoModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [performanceData, setPerformanceData] = useState<Record<string, any>>({});

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

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

          {/* Performance Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            boxSizing: 'border-box',
            maxWidth: '100%'
          }}>
            <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
              ⚡ Redis Cache vs PostgreSQL Performance
            </h3>
            <p style={{ margin: 0, opacity: 0.95, fontSize: '0.875rem', lineHeight: '1.5' }}>
              Each read operation queries both Redis and PostgreSQL to show real-time performance comparison
            </p>
          </div>

          {/* Performance Comparison */}
          {Object.keys(performanceData).length > 0 && (
            <div style={{
              background: 'linear-gradient(to bottom, #f0fdf4, #ffffff)',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #10b981',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              boxSizing: 'border-box',
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              <h3 style={{
                margin: 0,
                marginBottom: '1.25rem',
                color: '#065f46',
                fontSize: '1.125rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📈 Performance Comparison
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
                gap: '1.25rem'
              }}>
                {Object.entries(performanceData).map(([type, data]: [string, any]) => (
                  <div key={type} style={{
                    background: 'white',
                    padding: '1.25rem',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    boxSizing: 'border-box',
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      marginBottom: '1rem',
                      textTransform: 'capitalize',
                      color: '#111827',
                      fontSize: '1rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '2px solid #f3f4f6'
                    }}>
                      {type}
                    </div>

                    {/* Side by Side Comparison */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      {/* Redis Cache */}
                      <div style={{
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                        borderRadius: '8px',
                        border: '2px solid #10b981',
                        textAlign: 'center',
                        transition: 'transform 0.2s'
                      }}>
                        <div style={{ fontSize: '0.65rem', color: '#065f46', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                          ⚡ REDIS
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#047857', marginBottom: '0.25rem' }}>
                          {data?.cacheResult?.time != null ? `${data.cacheResult.time.toFixed(2)}ms` : 'N/A'}
                        </div>
                        <div style={{
                          fontSize: '0.7rem',
                          color: '#065f46',
                          fontWeight: '600',
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(255, 255, 255, 0.5)',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {data?.cacheResult?.found ? '✓ Hit' : '✗ Miss'}
                        </div>
                      </div>

                      {/* PostgreSQL */}
                      <div style={{
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        borderRadius: '8px',
                        border: '2px solid #3b82f6',
                        textAlign: 'center',
                        transition: 'transform 0.2s'
                      }}>
                        <div style={{ fontSize: '0.65rem', color: '#1e40af', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                          💾 POSTGRES
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e3a8a', marginBottom: '0.25rem' }}>
                          {data?.dbResult?.time != null ? `${data.dbResult.time.toFixed(2)}ms` : 'N/A'}
                        </div>
                        <div style={{
                          fontSize: '0.7rem',
                          color: '#1e40af',
                          fontWeight: '600',
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(255, 255, 255, 0.5)',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {data?.dbResult?.found ? '✓ Found' : '✗ Not Found'}
                        </div>
                      </div>
                    </div>

                    {/* Speedup */}
                    {data?.speedup > 0 && (
                      <div style={{
                        padding: '0.625rem',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        borderRadius: '6px',
                        textAlign: 'center',
                        border: '2px solid #f59e0b',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}>
                        <span style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: '700' }}>
                          🚀 Redis is {data.speedup.toFixed(1)}x faster
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: '1.25rem',
                padding: '1rem 1.25rem',
                background: 'linear-gradient(to right, #fef3c7, #fde68a)',
                borderRadius: '8px',
                borderLeft: '4px solid #f59e0b',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                boxSizing: 'border-box',
                maxWidth: '100%'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.25rem' }}>💡</span>
                  <div>
                    <strong style={{ color: '#92400e', fontSize: '0.875rem' }}>How it works:</strong>
                    <p style={{ color: '#78350f', margin: '0.25rem 0 0 0', fontSize: '0.875rem', lineHeight: '1.5' }}>
                      Every read operation queries both Redis (cache) and PostgreSQL (database) simultaneously. You can see the performance difference when reading from Postgre vs Redis.
                    </p>
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
