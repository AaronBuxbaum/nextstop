'use client';

import { useState, useEffect } from 'react';
import styles from './TravelTime.module.css';

interface TravelTimeProps {
  fromLocation: string;
  toLocation: string;
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
    if (data.length === 0) return null;
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

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
}

export function TravelTime({ fromLocation, toLocation }: TravelTimeProps) {
  const [driving, setDriving] = useState<string | null>(null);
  const [walking, setWalking] = useState<string | null>(null);
  const [transit, setTransit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
      const transitSec = walkingSec * 0.4;

      setDriving(formatDuration(drivingSec));
      setWalking(formatDuration(walkingSec));
      setTransit(formatDuration(transitSec));
      setLoading(false);
    }

    calculate();
    return () => { cancelled = true; };
  }, [fromLocation, toLocation]);

  if (error) return null;

  return (
    <div className={styles.bar}>
      {loading ? (
        <span className={styles.loadingText}>Calculating travel time...</span>
      ) : (
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
      )}
    </div>
  );
}
