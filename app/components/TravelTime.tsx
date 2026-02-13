'use client';

import { useState, useEffect } from 'react';
import { formatDuration } from '@/lib/timeUtils';
import styles from './TravelTime.module.css';

interface TravelTimeProps {
  fromLocation: string;
  toLocation: string;
  timeBetween?: number; // Time between events in minutes (if events have end/start times)
}

interface Coordinates {
  lat: number;
  lon: number;
}

async function geocode(location: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
      { headers: { 'User-Agent': 'NextStop/1.0' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.length === 0 || !data[0] || !data[0].lat || !data[0].lon) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

async function getDrivingTime(from: Coordinates, to: Coordinates): Promise<number | null> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/car/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;
    return data.routes[0].duration; // seconds
  } catch {
    return null;
  }
}

export function TravelTime({ fromLocation, toLocation, timeBetween }: TravelTimeProps) {
  const [driving, setDriving] = useState<string | null>(null);
  const [walking, setWalking] = useState<string | null>(null);
  const [transit, setTransit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasEnoughTime, setHasEnoughTime] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function calculate() {
      setLoading(true);
      setError(false);

      const [fromCoords, toCoords] = await Promise.all([
        geocode(fromLocation),
        geocode(toLocation),
      ]);

      if (cancelled) return;

      if (!fromCoords || !toCoords) {
        setError(true);
        setLoading(false);
        return;
      }

      const drivingSec = await getDrivingTime(fromCoords, toCoords);

      if (cancelled) return;

      if (drivingSec === null) {
        setError(true);
        setLoading(false);
        return;
      }

      // Estimate walking: distance-based at ~5km/h
      // Use straight-line distance as approximation, then apply 1.4x factor for roads
      const earthRadiusKm = 6371;
      const dLat = ((toCoords.lat - fromCoords.lat) * Math.PI) / 180;
      const dLon = ((toCoords.lon - fromCoords.lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((fromCoords.lat * Math.PI) / 180) *
          Math.cos((toCoords.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = earthRadiusKm * c * 1.4; // road factor
      const walkingSec = (distanceKm / 5) * 3600;
      // Transit is estimated at ~40% of walking time (avg transit speed ~12.5 km/h vs ~5 km/h walking)
      const TRANSIT_TO_WALKING_RATIO = 0.4;
      const transitSec = walkingSec * TRANSIT_TO_WALKING_RATIO;

      setDriving(formatDuration(drivingSec));
      setWalking(formatDuration(walkingSec));
      setTransit(formatDuration(transitSec));
      
      // Check if there's enough time between events
      if (timeBetween !== undefined && transitSec !== null) {
        const timeBetweenSec = timeBetween * 60;
        // Use transit time as the typical mode for comparison
        setHasEnoughTime(timeBetweenSec >= transitSec);
      }
      
      setLoading(false);
    }

    calculate();
    return () => { cancelled = true; };
  }, [fromLocation, toLocation, timeBetween]);

  if (error) return null;

  return (
    <div className={styles.bar}>
      {loading ? (
        <span className={styles.loadingText}>Calculating travel time...</span>
      ) : (
        <>
          <div className={styles.modes}>
            {walking && (
              <span className={styles.mode} title="Walking">
                🚶 {walking}
              </span>
            )}
            {transit && (
              <span className={styles.mode} title="Transit">
                🚌 {transit}
              </span>
            )}
            {driving && (
              <span className={styles.mode} title="Driving">
                🚗 {driving}
              </span>
            )}
          </div>
          {timeBetween !== undefined && hasEnoughTime !== null && (
            <span 
              className={`${styles.timeBetween} ${!hasEnoughTime ? styles.tooTight : ''}`}
              title={hasEnoughTime ? 'Enough time between events' : 'Tight schedule - may need more time'}
            >
              {hasEnoughTime ? '✓' : '⚠️'} {formatDuration(timeBetween * 60)} between events
            </span>
          )}
        </>
      )}
    </div>
  );
}
