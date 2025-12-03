'use client';

import { useState, useEffect } from 'react';
import TimeSeriesChart from './TimeSeriesChart';

interface DataPoint {
  timestamp: number;
  value: number;
}

interface TimeSeriesDemoModalProps {
  onClose: () => void;
}

export default function TimeSeriesDemoModal({ onClose }: TimeSeriesDemoModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [writeCommand, setWriteCommand] = useState('');
  const [readCommand, setReadCommand] = useState('');
  const [selectedSensor, setSelectedSensor] = useState('temperature');
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [aggregationResult, setAggregationResult] = useState<any>(null);

  // Form states
  const [sensorValue, setSensorValue] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [aggregationType, setAggregationType] = useState('avg');

  const sensors = [
    { id: 'temperature', name: 'Temperature', unit: '°C', icon: '🌡️', color: '#ff5722' },
    { id: 'humidity', name: 'Humidity', unit: '%', icon: '💧', color: '#2196f3' },
    { id: 'pressure', name: 'Pressure', unit: 'hPa', icon: '📊', color: '#9c27b0' },
    { id: 'cpu_usage', name: 'CPU Usage', unit: '%', icon: '💻', color: '#4caf50' },
  ];

  const selectedSensorInfo = sensors.find(s => s.id === selectedSensor) || sensors[0];

  useEffect(() => {
    // Set default time range (last hour)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    setEndTime(now.toISOString().slice(0, 16));
    setStartTime(oneHourAgo.toISOString().slice(0, 16));
  }, []);

  const handleAddDataPoint = async () => {
    if (!sensorValue) {
      setStatusMessage({ type: 'error', text: 'Please enter a value' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    const timestamp = Date.now();
    setWriteCommand(`TS.ADD ${selectedSensor}:sensor ${timestamp} ${sensorValue}\nEXPIRE ${selectedSensor}:sensor 259200`);

    try {
      const response = await fetch('/api/timeseries/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: `${selectedSensor}:sensor`,
          value: parseFloat(sensorValue),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add data point');
      }

      setStatusMessage({
        type: 'success',
        text: `Added ${sensorValue}${selectedSensorInfo.unit} to ${selectedSensorInfo.name} sensor`,
      });
      setSensorValue('');
      loadDataPoints();
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const loadDataPoints = async () => {
    if (!startTime || !endTime) return;

    setLoading(true);
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    setReadCommand(`TS.RANGE ${selectedSensor}:sensor ${start} ${end}`);

    try {
      const response = await fetch(
        `/api/timeseries/range?key=${selectedSensor}:sensor&start=${start}&end=${end}`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setDataPoints(data.dataPoints);
        setStatusMessage({ type: 'success', text: `Loaded ${data.dataPoints.length} data points` });
      }
    } catch (error) {
      console.error('Failed to load data points:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAggregation = async () => {
    if (!startTime || !endTime) {
      setStatusMessage({ type: 'error', text: 'Please select a time range' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    setReadCommand(`TS.RANGE ${selectedSensor}:sensor ${start} ${end} AGGREGATION ${aggregationType} 60000`);

    try {
      const response = await fetch(
        `/api/timeseries/aggregate?key=${selectedSensor}:sensor&start=${start}&end=${end}&aggregation=${aggregationType}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to aggregate data');
      }

      setAggregationResult(data);
      setStatusMessage({ type: 'success', text: `Calculated ${aggregationType.toUpperCase()} for time range` });
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomData = async () => {
    setLoading(true);
    setStatusMessage(null);
    setWriteCommand(`# Generating 20 data points\nTS.ADD ${selectedSensor}:sensor [timestamp1] [value1]\n...\nEXPIRE ${selectedSensor}:sensor 259200`);

    try {
      const response = await fetch('/api/timeseries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: `${selectedSensor}:sensor`,
          count: 20,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate data');
      }

      setStatusMessage({ type: 'success', text: `Generated ${data.count} random data points` });
      loadDataPoints();
    } catch (error) {
      setStatusMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-SG', {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content timeseries-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Time Series Demo</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          {/* Sensor Selection */}
          <div className="timeseries-section">
            <h3>Select Sensor</h3>
            <p className="section-description">Choose a sensor to track metrics</p>
            <div className="sensor-selection">
              {sensors.map((sensor) => (
                <button
                  key={sensor.id}
                  className={`sensor-button ${selectedSensor === sensor.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSensor(sensor.id)}
                  style={{ borderColor: sensor.color }}
                >
                  <span className="sensor-icon">{sensor.icon}</span>
                  <span className="sensor-name">{sensor.name}</span>
                  <span className="sensor-unit">{sensor.unit}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Data Point */}
          <div className="timeseries-section">
            <h3>Add Data Point</h3>
            <p className="section-description">Add a new measurement to the time series</p>
            <div className="add-datapoint-form">
              <div className="input-group-horizontal">
                <input
                  type="number"
                  value={sensorValue}
                  onChange={(e) => setSensorValue(e.target.value)}
                  placeholder={`Enter value (${selectedSensorInfo.unit})`}
                  disabled={loading}
                  step="0.1"
                />
                <button className="primary" onClick={handleAddDataPoint} disabled={loading}>
                  Add Data Point
                </button>
                <button className="secondary" onClick={generateRandomData} disabled={loading}>
                  Generate Random Data
                </button>
              </div>
            </div>

            {/* Write Command */}
            {writeCommand && (
              <div className="redis-command" style={{ marginTop: '1rem' }}>
                <strong>Redis Command (Write):</strong>
                <code>{writeCommand}</code>
              </div>
            )}
          </div>

          {/* Query Range */}
          <div className="timeseries-section">
            <h3>Query Time Range</h3>
            <p className="section-description">Retrieve data points within a time range</p>
            <div className="time-range-form">
              <div className="input-group">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="input-group">
                <label>End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button className="primary" onClick={loadDataPoints} disabled={loading}>
                Query Range
              </button>
            </div>

            {/* Read Command */}
            {readCommand && (
              <div className="redis-command" style={{ marginTop: '1rem' }}>
                <strong>Redis Command (Read):</strong>
                <code>{readCommand}</code>
              </div>
            )}

            {/* Data Points Display */}
            {dataPoints.length > 0 && (
              <div className="datapoints-display">
                <h4>Data Visualization</h4>
                <TimeSeriesChart
                  dataPoints={dataPoints}
                  color={selectedSensorInfo.color}
                  unit={selectedSensorInfo.unit}
                />

                <h4 style={{ marginTop: '2rem' }}>Recent Data Points</h4>
                <div className="datapoints-list">
                  {dataPoints.slice(0, 10).map((point, idx) => (
                    <div key={idx} className="datapoint-item">
                      <span className="datapoint-time">{formatTimestamp(point.timestamp)}</span>
                      <span className="datapoint-value" style={{ color: selectedSensorInfo.color }}>
                        {point.value.toFixed(2)} {selectedSensorInfo.unit}
                      </span>
                    </div>
                  ))}
                  {dataPoints.length > 10 && (
                    <div className="datapoint-item more">
                      ... and {dataPoints.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Aggregation */}
          <div className="timeseries-section">
            <h3>Data Aggregation</h3>
            <p className="section-description">Calculate statistics over the time range</p>
            <div className="aggregation-form">
              <div className="input-group">
                <label>Aggregation Type</label>
                <select
                  value={aggregationType}
                  onChange={(e) => setAggregationType(e.target.value)}
                  disabled={loading}
                >
                  <option value="avg">Average (AVG)</option>
                  <option value="sum">Sum (SUM)</option>
                  <option value="min">Minimum (MIN)</option>
                  <option value="max">Maximum (MAX)</option>
                  <option value="count">Count (COUNT)</option>
                </select>
              </div>
              <button className="primary" onClick={handleAggregation} disabled={loading}>
                Calculate
              </button>
            </div>

            {aggregationResult && (
              <div className="aggregation-result">
                <div className="result-card">
                  <div className="result-label">{aggregationType.toUpperCase()}</div>
                  <div className="result-value" style={{ color: selectedSensorInfo.color }}>
                    {aggregationResult.value.toFixed(2)} {selectedSensorInfo.unit}
                  </div>
                  <div className="result-meta">
                    Based on {aggregationResult.count} data points
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
