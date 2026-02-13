'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import type { Event } from '@/types';
import styles from './MapView.module.css';

interface MapViewProps {
  events: Event[];
}

interface GeocodedEvent {
  event: Event;
  index: number;
  lat?: number;
  lon?: number;
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'NextStop/1.0' } }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch (error) {
    console.error('Geocoding error for', address, error);
  }
  return null;
}

function buildLeafletHtml(geocodedEvents: GeocodedEvent[]): string {
  const eventsWithCoords = geocodedEvents.filter((e) => e.lat != null && e.lon != null);
  if (eventsWithCoords.length === 0) return '';

  const center = {
    lat: eventsWithCoords.reduce((sum, e) => sum + e.lat!, 0) / eventsWithCoords.length,
    lon: eventsWithCoords.reduce((sum, e) => sum + e.lon!, 0) / eventsWithCoords.length,
  };

  const markers = eventsWithCoords
    .map(
      (e) =>
        `L.marker([${e.lat}, ${e.lon}]).addTo(map).bindPopup(${JSON.stringify(
          `<b>${e.index + 1}. ${e.event.title}</b><br/>${e.event.location || ''}`
        )});`
    )
    .join('\n');

  // Calculate bounds for fitting all markers
  const bounds = eventsWithCoords.map((e) => `[${e.lat}, ${e.lon}]`).join(',');

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%}</style>
</head><body>
<div id="map"></div>
<script>
var map=L.map('map').setView([${center.lat},${center.lon}],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'&copy; OpenStreetMap contributors',maxZoom:19
}).addTo(map);
${markers}
${eventsWithCoords.length > 1 ? `map.fitBounds([${bounds}],{padding:[40,40]});` : ''}
<\/script>
</body></html>`;
}

export function MapView({ events }: MapViewProps) {
  const [geocodedEvents, setGeocodedEvents] = useState<GeocodedEvent[]>([]);
  const [geocodingDone, setGeocodingDone] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  const eventsWithLocations = useMemo(() => {
    return events
      .map((event, index) => ({ event, index }))
      .filter((e) => e.event.location && e.event.location.trim() !== '');
  }, [events]);

  const loading = eventsWithLocations.length > 0 && !geocodingDone;

  useEffect(() => {
    if (eventsWithLocations.length === 0) {
      return;
    }

    let cancelled = false;

    async function geocodeAll() {
      const results = await Promise.all(
        eventsWithLocations.map(async (item) => {
          const coords = await geocodeAddress(item.event.location);
          return {
            ...item,
            lat: coords?.lat,
            lon: coords?.lon,
          };
        })
      );
      if (!cancelled) {
        setGeocodedEvents(results);
        setGeocodingDone(true);
      }
    }

    geocodeAll();
    return () => { cancelled = true; };
  }, [eventsWithLocations]);

  useEffect(() => {
    // Clean up previous blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    const eventsWithCoords = geocodedEvents.filter((e) => e.lat != null && e.lon != null);
    if (eventsWithCoords.length === 0 || !iframeRef.current) return;

    const html = buildLeafletHtml(geocodedEvents);
    if (!html) return;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    iframeRef.current.src = url;

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [geocodedEvents]);

  if (eventsWithLocations.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>Add locations to your events to see them on the map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} aria-label="Map view of itinerary">
      <div className={styles.mapWrapper}>
        {loading && (
          <div className={styles.loadingState}>
            <p>Loading map pins…</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          className={styles.mapIframe}
          title="Itinerary map"
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
      <div className={styles.legend} role="list" aria-label="Map locations">
        {eventsWithLocations.map((item) => (
          <div key={item.event.id} className={styles.legendItem} role="listitem">
            <span
              className={
                item.event.isOptional
                  ? styles.legendMarkerOptional
                  : styles.legendMarker
              }
            >
              {item.index + 1}
            </span>
            <span>
              {item.event.title} — {item.event.location}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
