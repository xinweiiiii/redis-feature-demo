'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import CollapsibleSection from './CollapsibleSection';
import { useSwipeToClose } from '@/hooks/useSwipeToClose';
import RedisCommand from './RedisCommand';
import CodeExamplesPanel from './CodeExamplesPanel';
import UseCaseExplanation from './UseCaseExplanation';
import { geospatialExamples } from '@/lib/codeExamples';
import { geospatialUseCases } from '@/lib/useCases';

const GeoMap = dynamic(() => import('./GeoMap'), { ssr: false });

interface SearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  distance?: number;
}

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface SearchResult_Geo {
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface SearchDemoModalProps {
  onClose: () => void;
}

// Sample locations in Singapore
const SAMPLE_LOCATIONS: Location[] = [
  { name: 'Marina Bay Sands', latitude: 1.2834, longitude: 103.8607 },
  { name: 'Changi Airport', latitude: 1.3644, longitude: 103.9915 },
  { name: 'Sentosa Island', latitude: 1.2494, longitude: 103.8303 },
  { name: 'Gardens by the Bay', latitude: 1.2816, longitude: 103.8636 },
  { name: 'Singapore Zoo', latitude: 1.4043, longitude: 103.7930 },
  { name: 'Orchard Road', latitude: 1.3048, longitude: 103.8318 },
  { name: 'Merlion Park', latitude: 1.2868, longitude: 103.8545 },
  { name: 'Universal Studios', latitude: 1.2540, longitude: 103.8238 },
  { name: 'Clarke Quay', latitude: 1.2906, longitude: 103.8467 },
  { name: 'Little India', latitude: 1.3066, longitude: 103.8518 },
];

export default function SearchDemoModal({ onClose }: SearchDemoModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'fulltext' | 'semantic' | 'hybrid' | 'geo'>('fulltext');
  const [initialized, setInitialized] = useState(false);
  const [redisCommand, setRedisCommand] = useState('');

  // Search states
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Full geospatial demo state
  const [geoLocations, setGeoLocations] = useState<Location[]>([]);
  const [newLocation, setNewLocation] = useState({ name: '', latitude: '', longitude: '' });
  const [searchCenter, setSearchCenter] = useState({ latitude: '1.2905', longitude: '103.8520' });
  const [searchRadius, setSearchRadius] = useState('5');
  const [searchResults_Geo, setSearchResults_Geo] = useState<SearchResult_Geo[]>([]);
  const [distanceCalc, setDistanceCalc] = useState({ from: '', to: '', result: '' });

  // Load geospatial locations
  useEffect(() => {
    loadGeoLocations();
  }, []);

  const loadGeoLocations = async () => {
    try {
      const response = await fetch('/api/geospatial/list');
      const data = await response.json();
      if (data.locations) {
        setGeoLocations(data.locations);
      }
    } catch (error) {
      console.error('Error loading geo locations:', error);
    }
  };

  const addGeoLocation = async () => {
    const lat = parseFloat(newLocation.latitude);
    const lng = parseFloat(newLocation.longitude);

    if (!newLocation.name || isNaN(lat) || isNaN(lng)) {
      setStatusMessage({ type: 'error', text: 'Please provide valid name, latitude, and longitude' });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setStatusMessage({ type: 'error', text: 'Invalid coordinates: lat must be -90 to 90, lng must be -180 to 180' });
      return;
    }

    setLoading(true);
    setRedisCommand(`GEOADD locations ${lng} ${lat} "${newLocation.name}"`);

    try {
      const response = await fetch('/api/geospatial/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLocation.name,
          latitude: lat,
          longitude: lng,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add location');
      }

      setStatusMessage({
        type: 'success',
        text: `Added location "${newLocation.name}" in ${data.executionTime.toFixed(2)}ms`,
      });
      setNewLocation({ name: '', latitude: '', longitude: '' });
      await loadGeoLocations();
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const searchNearbyLocations = async () => {
    const lat = parseFloat(searchCenter.latitude);
    const lng = parseFloat(searchCenter.longitude);
    const rad = parseFloat(searchRadius);

    if (isNaN(lat) || isNaN(lng) || isNaN(rad) || rad <= 0) {
      setStatusMessage({ type: 'error', text: 'Please provide valid search coordinates and radius' });
      return;
    }

    setLoading(true);
    setRedisCommand(`GEOSEARCH locations FROMLONLAT ${lng} ${lat} BYRADIUS ${rad} km WITHDIST`);

    try {
      const response = await fetch('/api/geospatial/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radius: rad,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search locations');
      }

      setSearchResults_Geo(data.results);
      setStatusMessage({
        type: 'success',
        text: `Found ${data.results.length} location(s) within ${rad}km in ${data.executionTime.toFixed(2)}ms`,
      });
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = async () => {
    if (!distanceCalc.from || !distanceCalc.to) {
      setStatusMessage({ type: 'error', text: 'Please select two locations' });
      return;
    }

    setLoading(true);
    setRedisCommand(`GEODIST locations "${distanceCalc.from}" "${distanceCalc.to}" km`);

    try {
      const response = await fetch('/api/geospatial/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: distanceCalc.from,
          to: distanceCalc.to,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate distance');
      }

      setDistanceCalc(prev => ({ ...prev, result: data.distance.toFixed(2) }));
      setStatusMessage({
        type: 'success',
        text: `Distance calculated in ${data.executionTime.toFixed(2)}ms`,
      });
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const loadSampleGeoData = async () => {
    setLoading(true);
    setRedisCommand('GEOADD locations (bulk loading sample data)');

    try {
      const response = await fetch('/api/geospatial/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: SAMPLE_LOCATIONS }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load sample data');
      }

      setStatusMessage({
        type: 'success',
        text: `Loaded ${data.count} sample locations in ${data.executionTime.toFixed(2)}ms`,
      });
      await loadGeoLocations();
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const clearGeoData = async () => {
    setLoading(true);
    try {
      await fetch('/api/geospatial/clear', { method: 'POST' });
      setGeoLocations([]);
      setSearchResults_Geo([]);
      setStatusMessage({ type: 'success', text: 'All geospatial data cleared' });
      setRedisCommand('DEL locations');
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

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
      // Geo search is handled by searchNearbyLocations function
    }
  };

  const { modalProps } = useSwipeToClose({
    onClose,
    threshold: 100,
    velocityThreshold: 0.3,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        {...modalProps}
        className="modal-content search-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="swipe-indicator" />
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
          {activeTab === 'geo' ? (
            <div className="geo-layout">
              {/* Map Section */}
              <div className="geo-map-section">
                <h3>Interactive Map & Heatmap</h3>
                <GeoMap
                  locations={geoLocations}
                  searchCenter={searchCenter.latitude && searchCenter.longitude ? {
                    latitude: parseFloat(searchCenter.latitude),
                    longitude: parseFloat(searchCenter.longitude),
                  } : null}
                  searchRadius={parseFloat(searchRadius)}
                  searchResults={searchResults_Geo}
                />
              </div>

              {/* Controls Section */}
              <div className="geo-controls-section">
                <CollapsibleSection title="Add Location" icon="📍" defaultOpen={false}>
                  <div className="input-group">
                    <label>Location Name</label>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Marina Bay Sands"
                      disabled={loading}
                    />
                  </div>
                  <div className="input-group">
                    <label>Latitude (-90 to 90)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={newLocation.latitude}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder="1.2905"
                      disabled={loading}
                    />
                  </div>
                  <div className="input-group">
                    <label>Longitude (-180 to 180)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={newLocation.longitude}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, longitude: e.target.value }))}
                      placeholder="103.8520"
                      disabled={loading}
                    />
                  </div>
                  <button className="primary" onClick={addGeoLocation} disabled={loading}>
                    Add Location
                  </button>
                </CollapsibleSection>

                <CollapsibleSection title="Search Nearby" icon="🔍" defaultOpen={true}>
                  <div className="input-group">
                    <label>Center Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={searchCenter.latitude}
                      onChange={(e) => setSearchCenter(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder="1.2905"
                      disabled={loading}
                    />
                  </div>
                  <div className="input-group">
                    <label>Center Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={searchCenter.longitude}
                      onChange={(e) => setSearchCenter(prev => ({ ...prev, longitude: e.target.value }))}
                      placeholder="103.8520"
                      disabled={loading}
                    />
                  </div>
                  <div className="input-group">
                    <label>Radius (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(e.target.value)}
                      placeholder="5"
                      disabled={loading}
                    />
                  </div>
                  <button className="primary" onClick={searchNearbyLocations} disabled={loading}>
                    Search
                  </button>

                  {searchResults_Geo.length > 0 && (
                    <div className="search-results">
                      <strong>Results ({searchResults_Geo.length})</strong>
                      <div className="results-table-container">
                        <table className="results-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Location Name</th>
                              <th>Distance (km)</th>
                              <th>Coordinates</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchResults_Geo.map((result, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{result.name}</td>
                                <td>{result.distance?.toFixed(2)}</td>
                                <td>{result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CollapsibleSection>

                <CollapsibleSection title="Calculate Distance" icon="📏" defaultOpen={false}>
                  <div className="input-group">
                    <label>From Location</label>
                    <select
                      value={distanceCalc.from}
                      onChange={(e) => setDistanceCalc(prev => ({ ...prev, from: e.target.value }))}
                      disabled={loading}
                    >
                      <option value="">Select location...</option>
                      {geoLocations.map((loc, idx) => (
                        <option key={idx} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>To Location</label>
                    <select
                      value={distanceCalc.to}
                      onChange={(e) => setDistanceCalc(prev => ({ ...prev, to: e.target.value }))}
                      disabled={loading}
                    >
                      <option value="">Select location...</option>
                      {geoLocations.map((loc, idx) => (
                        <option key={idx} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <button className="primary" onClick={calculateDistance} disabled={loading}>
                    Calculate Distance
                  </button>
                  {distanceCalc.result && (
                    <div className="distance-result">
                      <strong>Distance:</strong> {distanceCalc.result} km
                    </div>
                  )}
                </CollapsibleSection>

                <div className="button-group">
                  <button className="secondary" onClick={loadSampleGeoData} disabled={loading}>
                    Load Sample Data
                  </button>
                  <button className="secondary" onClick={clearGeoData} disabled={loading}>
                    Clear All Data
                  </button>
                </div>

                <div className="locations-list">
                  <strong>All Locations ({geoLocations.length})</strong>
                  <div className="list-items">
                    {geoLocations.map((loc, idx) => (
                      <div key={idx} className="location-item">
                        <span className="location-name">{loc.name}</span>
                        <span className="location-coords">
                          {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="search-section">
              <>
                <h3>
                  {activeTab === 'fulltext' && 'Full-Text Search'}
                  {activeTab === 'semantic' && 'Semantic Search'}
                  {activeTab === 'hybrid' && 'Hybrid Search'}
                </h3>
                <p className="section-description">
                  {activeTab === 'fulltext' && 'Search products by exact name or description keywords. Try "laptop" to find exact matches.'}
                  {activeTab === 'semantic' && 'Find products by meaning - try "portable computer" to find laptops, ultrabooks, notebooks, etc. even without exact keywords.'}
                  {activeTab === 'hybrid' && 'Best of both worlds: semantic understanding + exact matching. Try "portable computer MacBook" to find all laptops but rank MacBook higher.'}
                </p>
                <div className="search-form">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      activeTab === 'fulltext'
                        ? 'e.g., laptop, headphones, coffee maker'
                        : activeTab === 'semantic'
                        ? 'e.g., portable computer, athletic footwear, brewing equipment'
                        : 'e.g., portable computer MacBook, professional running shoes'
                    }
                    disabled={loading || !initialized}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button className="primary" onClick={handleSearch} disabled={loading || !initialized}>
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </>
            </div>
          )}

          {/* Redis Command */}
          {redisCommand && <RedisCommand command={redisCommand} />}

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

          {/* No Results */}
          {initialized && !loading && results.length === 0 && executionTime !== null && activeTab !== 'geo' && (
            <div className="search-section">
              <div className="no-results">
                No results found. Try a different search query.
              </div>
            </div>
          )}

          {/* Use Case Guide & Code Examples - Show when on geo tab */}
          {activeTab === 'geo' && (
            <>
              <UseCaseExplanation data={geospatialUseCases} defaultOpen={false} />
              <CodeExamplesPanel examples={geospatialExamples} defaultOpen={false} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
