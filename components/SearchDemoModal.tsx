'use client';

import { useState } from 'react';

interface SearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  distance?: number;
}

interface GeoLocation {
  name: string;
  distance: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface SearchDemoModalProps {
  onClose: () => void;
}

export default function SearchDemoModal({ onClose }: SearchDemoModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'fulltext' | 'semantic' | 'hybrid' | 'geo'>('fulltext');
  const [initialized, setInitialized] = useState(false);
  const [redisCommand, setRedisCommand] = useState('');

  // Search states
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [geoResults, setGeoResults] = useState<GeoLocation[]>([]);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Geo search params
  const [latitude, setLatitude] = useState('37.7749');
  const [longitude, setLongitude] = useState('-122.4194');
  const [radius, setRadius] = useState('100');

  const initializeData = async () => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand('FT.CREATE idx:products ON JSON PREFIX 1 product:\n  SCHEMA\n  $.name AS name TEXT\n  $.description AS description TEXT\n  $.category AS category TAG\n  ...\nGEOADD locations ...');

    try {
      const response = await fetch('/api/search/generate', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setInitialized(true);
        setStatusMessage({
          type: 'success',
          text: `Generated ${data.productsCount} products, ${data.locationsCount} locations. Indexed ${data.indexedDocs} documents.`,
        });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Error initializing data' });
    } finally {
      setLoading(false);
    }
  };

  const performFullTextSearch = async () => {
    if (!query.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a search query' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    const cleanQuery = query.trim().toLowerCase();
    setRedisCommand(`FT.SEARCH idx:products "${cleanQuery}" LIMIT 0 10 RETURN 4 name description category price`);

    try {
      const response = await fetch('/api/search/fulltext', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 10 }),
      });
      const data = await response.json();

      if (data.success) {
        setResults(data.documents);
        setExecutionTime(data.executionTime);
        setGeoResults([]);
        setStatusMessage({ type: 'success', text: `Found ${data.total} results` });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Error performing search' });
    } finally {
      setLoading(false);
    }
  };

  const performSemanticSearch = async () => {
    if (!query.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a search query' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`FT.SEARCH idx:products "*=>[KNN 10 @embedding $BLOB AS distance]"\n  PARAMS 2 BLOB <embedding_vector>\n  SORTBY distance\n  DIALECT 2`);

    try {
      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 10 }),
      });
      const data = await response.json();

      if (data.success) {
        setResults(data.documents);
        setExecutionTime(data.executionTime);
        setGeoResults([]);
        setStatusMessage({ type: 'success', text: `Found ${data.total} semantically similar results` });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Error performing search' });
    } finally {
      setLoading(false);
    }
  };

  const performHybridSearch = async () => {
    if (!query.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a search query' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`FT.SEARCH idx:products "(${query}) =>[KNN 10 @embedding $BLOB AS vector_distance]"\n  PARAMS 2 BLOB <embedding_vector>\n  DIALECT 2`);

    try {
      const response = await fetch('/api/search/hybrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          limit: 10,
          useFullText: true,
          useVector: true,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setResults(data.documents);
        setExecutionTime(data.executionTime);
        setGeoResults([]);
        setStatusMessage({ type: 'success', text: `Found ${data.total} results using hybrid search` });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Error performing search' });
    } finally {
      setLoading(false);
    }
  };

  const performGeoSearch = async () => {
    setLoading(true);
    setStatusMessage(null);
    setRedisCommand(`GEOSEARCH locations FROMLONLAT ${longitude} ${latitude} BYRADIUS ${radius} km WITHDIST WITHCOORD`);

    try {
      const response = await fetch('/api/search/geo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radius: parseFloat(radius),
          unit: 'km',
        }),
      });
      const data = await response.json();

      if (data.success) {
        console.log('Geo API response:', data);
        console.log('Locations received:', data.locations);
        setGeoResults(data.locations);
        setExecutionTime(data.executionTime);
        setResults([]);
        setStatusMessage({ type: 'success', text: `Found ${data.count} locations` });
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Error performing geo search' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    switch (activeTab) {
      case 'fulltext':
        performFullTextSearch();
        break;
      case 'semantic':
        performSemanticSearch();
        break;
      case 'hybrid':
        performHybridSearch();
        break;
      case 'geo':
        performGeoSearch();
        break;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Redis Query Engine Demo</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          {/* Initialize Data */}
          {!initialized && (
            <div className="search-section">
              <div className="init-warning">
                <p>⚠️ Initialize sample data first to test search features</p>
                <button className="primary" onClick={initializeData} disabled={loading}>
                  {loading ? 'Initializing...' : 'Initialize Sample Data'}
                </button>
              </div>
            </div>
          )}

          {/* Search Type Tabs */}
          <div className="search-section">
            <h3>Search Type</h3>
            <div className="tab-buttons">
              <button
                className={`tab-button ${activeTab === 'fulltext' ? 'active' : ''}`}
                onClick={() => setActiveTab('fulltext')}
              >
                📝 Full-Text Search
              </button>
              <button
                className={`tab-button ${activeTab === 'semantic' ? 'active' : ''}`}
                onClick={() => setActiveTab('semantic')}
              >
                🧠 Semantic Search
              </button>
              <button
                className={`tab-button ${activeTab === 'hybrid' ? 'active' : ''}`}
                onClick={() => setActiveTab('hybrid')}
              >
                ✨ Hybrid Search
              </button>
              <button
                className={`tab-button ${activeTab === 'geo' ? 'active' : ''}`}
                onClick={() => setActiveTab('geo')}
              >
                📍 Geospatial Search
              </button>
            </div>
          </div>

          {/* Search Form */}
          <div className="search-section">
            {activeTab === 'geo' ? (
              <>
                <h3>Geospatial Search</h3>
                <p className="section-description">Find stores within specified radius</p>
                <div className="geo-search-form">
                  <div className="input-row">
                    <div className="input-group">
                      <label>Latitude</label>
                      <input
                        type="number"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="37.7749"
                        disabled={loading || !initialized}
                        step="0.0001"
                      />
                    </div>
                    <div className="input-group">
                      <label>Longitude</label>
                      <input
                        type="number"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="-122.4194"
                        disabled={loading || !initialized}
                        step="0.0001"
                      />
                    </div>
                    <div className="input-group">
                      <label>Radius (km)</label>
                      <input
                        type="number"
                        value={radius}
                        onChange={(e) => setRadius(e.target.value)}
                        placeholder="100"
                        disabled={loading || !initialized}
                      />
                    </div>
                  </div>
                  <button className="primary" onClick={handleSearch} disabled={loading || !initialized}>
                    {loading ? 'Searching...' : 'Search Locations'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>
                  {activeTab === 'fulltext' && 'Full-Text Search'}
                  {activeTab === 'semantic' && 'Semantic Search'}
                  {activeTab === 'hybrid' && 'Hybrid Search'}
                </h3>
                <p className="section-description">
                  {activeTab === 'fulltext' && 'Search products by name or description using keyword matching'}
                  {activeTab === 'semantic' && 'Find products by semantic similarity using vector embeddings'}
                  {activeTab === 'hybrid' && 'Combine full-text and vector search for best results'}
                </p>
                <div className="search-form">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      activeTab === 'fulltext'
                        ? 'e.g., laptop, headphones, coffee'
                        : activeTab === 'semantic'
                        ? 'e.g., something for exercise, work from home'
                        : 'e.g., wireless headphones, smart home'
                    }
                    disabled={loading || !initialized}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button className="primary" onClick={handleSearch} disabled={loading || !initialized}>
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </>
            )}

            {/* Redis Command */}
            {redisCommand && (
              <div className="redis-command" style={{ marginTop: '1rem' }}>
                <strong>Redis Command:</strong>
                <code>{redisCommand}</code>
              </div>
            )}
          </div>

          {/* Execution Time */}
          {executionTime !== null && (
            <div className="search-section">
              <div className="execution-time">
                ⚡ Execution time: <strong>{executionTime.toFixed(2)}ms</strong>
              </div>
            </div>
          )}

          {/* Product Results */}
          {results.length > 0 && (
            <div className="search-section">
              <h3>Results ({results.length})</h3>
              <div className="results-list">
                {results.map((result, index) => (
                  <div key={index} className="result-item">
                    <div className="result-header">
                      <h4>{result.name}</h4>
                      <div className="result-badges">
                        <span className="badge category">{result.category}</span>
                        {result.price && <span className="badge price">${result.price}</span>}
                      </div>
                    </div>
                    <p className="result-description">{result.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Geo Results */}
          {geoResults.length > 0 && (
            <div className="search-section">
              <h3>Nearby Locations ({geoResults.length})</h3>
              <div className="results-list">
                {geoResults.map((location, index) => (
                  <div key={index} className="result-item">
                    <div className="result-header">
                      <h4>📍 {location.name}</h4>
                      <span className="badge distance">{location.distance.toFixed(2)} km</span>
                    </div>
                    <p className="result-description">
                      Coordinates: {Number(location.coordinates.latitude).toFixed(4)}, {Number(location.coordinates.longitude).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {initialized && !loading && results.length === 0 && geoResults.length === 0 && executionTime !== null && (
            <div className="search-section">
              <div className="no-results">
                No results found. Try a different search query.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
