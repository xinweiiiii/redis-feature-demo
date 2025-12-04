'use client';

import { useState, useEffect } from 'react';

interface QueryResult {
  query: string;
  response: string;
  cacheHit: boolean;
  similarity: number | null;
  cachedQuery: string | null;
  tokens: number;
  cost: number;
  model: string;
  timing: {
    embedding: number;
    total: number;
  };
}

interface CacheStats {
  totalEntries: number;
  totalTokensSaved: number;
  recentEntries: Array<{
    query: string;
    response: string;
    tokens: number;
    model: string;
    timestamp: string;
  }>;
}

interface SemanticCacheDemoModalProps {
  onClose: () => void;
}

export default function SemanticCacheDemoModal({ onClose }: SemanticCacheDemoModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [query, setQuery] = useState('');
  const [useCache, setUseCache] = useState(true);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [totalSavings, setTotalSavings] = useState({ tokens: 0, cost: 0 });

  // Sample queries
  const sampleQueries = [
    "What is Redis?",
    "Explain Redis in simple terms",
    "How does Redis work?",
    "What are the benefits of using Redis?",
    "Why should I use Redis for caching?",
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/semantic-cache/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const submitQuery = async (queryText?: string) => {
    const finalQuery = queryText || query;

    if (!finalQuery.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a query' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/semantic-cache/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: finalQuery,
          useCache,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result: QueryResult = {
          query: data.query,
          response: data.response,
          cacheHit: data.cacheHit,
          similarity: data.similarity,
          cachedQuery: data.cachedQuery,
          tokens: data.tokens,
          cost: data.cost,
          model: data.model,
          timing: data.timing,
        };

        setResults(prev => [result, ...prev]);

        if (data.cacheHit) {
          setStatusMessage({
            type: 'success',
            text: `Cache HIT! Similarity: ${(data.similarity * 100).toFixed(1)}% - Instant response, $0 cost`
          });

          // Update savings
          setTotalSavings(prev => ({
            tokens: prev.tokens + (stats?.recentEntries[0]?.tokens || 500),
            cost: prev.cost + 0.01, // Estimate
          }));
        } else {
          setStatusMessage({
            type: 'warning',
            text: `Cache MISS - Called OpenAI API. Tokens: ${data.tokens}, Cost: $${data.cost.toFixed(4)}`
          });
        }

        setQuery('');
        await loadStats();
      } else {
        if (data.isApiKeyError) {
          setStatusMessage({
            type: 'error',
            text: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
          });
        } else {
          setStatusMessage({ type: 'error', text: data.error });
        }
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to process query' });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    if (!confirm('Are you sure you want to clear the entire semantic cache?')) {
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/semantic-cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message });
        setResults([]);
        setTotalSavings({ tokens: 0, cost: 0 });
        await loadStats();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to clear cache' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content stream-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Semantic Cache for LLMs</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          {/* Info Section */}
          <div className="search-section" style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem', color: '#2e7d32' }}>
              💡 How Semantic Caching Works with GPT-5
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
              When you ask a question, we create a vector embedding and check if a similar query exists in the cache (≥85% similarity).
              If found, we return the cached response instantly. Otherwise, we call the <strong>GPT-5</strong> reasoning model, cache the result, and return it.
              This saves both <strong>time</strong> and <strong>money</strong> for similar queries!
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
              <strong>LLM Model:</strong> GPT-5 (Reasoning Model) | <strong>Embedding Model:</strong> text-embedding-3-small
            </p>
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fff3e0', borderRadius: '4px', borderLeft: '3px solid #ff9800' }}>
              <strong style={{ color: '#e65100' }}>Note:</strong> GPT-5 is a reasoning model that thinks before responding.
              It uses internal reasoning tokens, which means responses are higher quality but may use more tokens.
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="search-section">
              <h3>Cache Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Cached Queries</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#dc382d' }}>
                    {stats.totalEntries}
                  </div>
                </div>
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Tokens Saved</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#4caf50' }}>
                    {totalSavings.tokens.toLocaleString()}
                  </div>
                </div>
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Cost Saved</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ff9800' }}>
                    ${totalSavings.cost.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Query Input */}
          <div className="search-section">
            <h3>Ask a Question</h3>
            <p className="section-description">
              Try asking similar questions to see the semantic cache in action
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={useCache}
                  onChange={(e) => setUseCache(e.target.checked)}
                  disabled={loading}
                />
                <span>Enable Semantic Cache</span>
              </label>
            </div>

            <div className="search-form">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question..."
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && submitQuery()}
              />
              <button
                className="primary"
                onClick={() => submitQuery()}
                disabled={loading || !query.trim()}
              >
                {loading ? 'Processing...' : 'Ask'}
              </button>
            </div>

            {/* Sample Queries */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Try these sample queries:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {sampleQueries.map((sample, index) => (
                  <button
                    key={index}
                    className="secondary"
                    onClick={() => submitQuery(sample)}
                    disabled={loading}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="search-section">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="primary"
                onClick={loadStats}
                disabled={loading}
              >
                Refresh Stats
              </button>
              <button
                className="secondary"
                onClick={clearCache}
                disabled={loading}
                style={{ background: '#ff5252', color: 'white' }}
              >
                Clear Cache
              </button>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="search-section">
              <h3>Query Results</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {results.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      background: result.cacheHit ? '#e8f5e9' : '#fff3e0',
                      border: `2px solid ${result.cacheHit ? '#4caf50' : '#ff9800'}`,
                      borderRadius: '8px',
                      padding: '1rem',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{
                            background: result.cacheHit ? '#4caf50' : '#ff9800',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                          }}>
                            {result.cacheHit ? '⚡ CACHE HIT' : '🔄 CACHE MISS'}
                          </span>
                          {result.cacheHit && result.similarity && (
                            <span style={{ fontSize: '0.875rem', color: '#666' }}>
                              {(result.similarity * 100).toFixed(1)}% similar
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#333' }}>
                          Q: {result.query}
                        </div>
                        {result.cacheHit && result.cachedQuery && result.cachedQuery !== result.query && (
                          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                            Matched: "{result.cachedQuery}"
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '100px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          {result.timing.total.toFixed(0)}ms
                        </div>
                        {!result.cacheHit && (
                          <>
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                              {result.tokens} tokens
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ff9800' }}>
                              ${result.cost.toFixed(4)}
                            </div>
                          </>
                        )}
                        {result.cacheHit && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4caf50' }}>
                            $0.0000
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Response */}
                    <div style={{
                      background: 'white',
                      padding: '0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {result.response}
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666' }}>
                      Model: {result.model}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="search-section" style={{ background: '#e3f2fd', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem', color: '#1976d2' }}>
              💡 Try This:
            </h3>
            <ol style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>Ask "What is Redis?" (This will call OpenAI API - cache miss)</li>
              <li>Then ask "Explain Redis in simple terms" (This should hit the cache! ≥85% similarity)</li>
              <li>Try "How does Redis work?" (Another similar query that should hit cache)</li>
              <li>Compare the response time and cost difference (cache hits = $0.0000, instant response)</li>
              <li>Try disabling cache to see all queries call the API</li>
            </ol>
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fff3e0', borderRadius: '4px', borderLeft: '3px solid #ff9800' }}>
              <strong style={{ color: '#e65100' }}>Note:</strong> Similarity threshold is set to 85%. Even semantically similar questions
              with different wording will trigger cache hits if they're asking the same thing!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
