'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface SearchResult {
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface GeoMapProps {
  locations: Location[];
  searchCenter: { latitude: number; longitude: number } | null;
  searchRadius: number;
  searchResults: SearchResult[];
}

export default function GeoMap({ locations, searchCenter, searchRadius, searchResults }: GeoMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const searchLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return; // Already initialized

    const map = L.map('geo-map').setView([1.2905, 103.8520], 11); // Singapore center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    searchLayerRef.current = L.layerGroup().addTo(map);

    // Fix for default marker icons in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update heatmap and markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    if (locations.length === 0) {
      // Remove heatmap if no locations
      if (heatLayerRef.current) {
        mapRef.current.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    // Add markers for each location
    locations.forEach(loc => {
      const marker = L.marker([loc.latitude, loc.longitude])
        .bindPopup(`<strong>${loc.name}</strong><br>${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
      markersLayerRef.current?.addLayer(marker);
    });

    // Create/update heatmap
    const heatPoints: [number, number, number][] = locations.map(loc => [
      loc.latitude,
      loc.longitude,
      0.5, // intensity
    ]);

    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }

    heatLayerRef.current = (L as any).heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: 'blue',
        0.5: 'lime',
        0.7: 'yellow',
        1.0: 'red',
      },
    }).addTo(mapRef.current);

    // Fit bounds to show all locations
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.latitude, loc.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations]);

  // Update search circle and results
  useEffect(() => {
    if (!mapRef.current || !searchLayerRef.current) return;

    // Clear existing search visualization
    searchLayerRef.current.clearLayers();

    if (searchCenter && searchRadius > 0) {
      // Draw search circle
      const circle = L.circle([searchCenter.latitude, searchCenter.longitude], {
        radius: searchRadius * 1000, // Convert km to meters
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2,
      });
      searchLayerRef.current.addLayer(circle);

      // Add center marker
      const centerMarker = L.marker([searchCenter.latitude, searchCenter.longitude], {
        icon: L.divIcon({
          className: 'search-center-marker',
          html: '<div style="background: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
          iconSize: [12, 12],
        }),
      }).bindPopup('Search Center');
      searchLayerRef.current.addLayer(centerMarker);

      // Highlight search results
      searchResults.forEach(result => {
        const resultMarker = L.circleMarker([result.latitude, result.longitude], {
          radius: 8,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.6,
          weight: 2,
        }).bindPopup(
          `<strong>${result.name}</strong><br>Distance: ${result.distance?.toFixed(2)} km`
        );
        searchLayerRef.current?.addLayer(resultMarker);
      });
    }
  }, [searchCenter, searchRadius, searchResults]);

  return <div id="geo-map" style={{ width: '100%', height: '600px', borderRadius: '8px' }} />;
}
