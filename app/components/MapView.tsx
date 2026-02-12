'use client';

import { useMemo } from 'react';
import type { Event } from '@/types';
import styles from './MapView.module.css';

interface MapViewProps {
  events: Event[];
}

interface GeocodedEvent {
  event: Event;
  index: number;
}

function buildMapUrl(events: GeocodedEvent[]): string {
  if (events.length === 0) return '';

  // For a simple embedded map, use an OpenStreetMap-based approach
  // We'll search for the first location to center the map
  const firstLocation = encodeURIComponent(events[0].event.location);
  return `https://www.openstreetmap.org/export/embed.html?bbox=&layer=mapnik&marker=&query=${firstLocation}`;
}

export function MapView({ events }: MapViewProps) {
  const eventsWithLocations = useMemo(() => {
    return events
      .map((event, index) => ({ event, index }))
      .filter((e) => e.event.location && e.event.location.trim() !== '');
  }, [events]);

  const mapSrc = useMemo(() => {
    if (eventsWithLocations.length === 0) return '';
    return buildMapUrl(eventsWithLocations);
  }, [eventsWithLocations]);

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
        <iframe
          className={styles.mapIframe}
          src={mapSrc}
          title="Itinerary map"
          loading="lazy"
          referrerPolicy="no-referrer"
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
