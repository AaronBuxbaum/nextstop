'use client';

import { useState, useEffect } from 'react';
import styles from './WeatherInfo.module.css';

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
}

interface WeatherInfoProps {
  location: string;
  className?: string;
}

const weatherCodeMap: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Foggy', icon: '🌫️' },
  48: { description: 'Rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️' },
  53: { description: 'Moderate drizzle', icon: '🌦️' },
  55: { description: 'Dense drizzle', icon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌧️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️' },
  71: { description: 'Slight snow', icon: '🌨️' },
  73: { description: 'Moderate snow', icon: '🌨️' },
  75: { description: 'Heavy snow', icon: '❄️' },
  80: { description: 'Rain showers', icon: '🌦️' },
  81: { description: 'Moderate showers', icon: '🌧️' },
  82: { description: 'Violent showers', icon: '⛈️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

function getWeatherFromCode(code: number): { description: string; icon: string } {
  return weatherCodeMap[code] || { description: 'Unknown', icon: '❓' };
}

export function WeatherInfo({ location, className }: WeatherInfoProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;

    const controller = new AbortController();

    async function fetchWeather() {
      setLoading(true);
      setError(null);

      try {
        // Geocode the location using Nominatim
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
          {
            signal: controller.signal,
            headers: { 'User-Agent': 'NextStop-Outing-Planner/1.0' },
          }
        );
        const geoData = await geoRes.json();

        if (!geoData || geoData.length === 0) {
          setError('Location not found');
          setLoading(false);
          return;
        }

        const { lat, lon } = geoData[0];

        // Get weather using Open-Meteo (free, no API key)
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
          { signal: controller.signal }
        );
        const weatherData = await weatherRes.json();

        if (weatherData.current_weather) {
          const { temperature, weathercode } = weatherData.current_weather;
          const info = getWeatherFromCode(weathercode);
          const temperatureF = Math.round(temperature * 9 / 5 + 32);
          setWeather({
            temperature: temperatureF,
            description: info.description,
            icon: info.icon,
          });
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Weather unavailable');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();

    return () => controller.abort();
  }, [location]);

  if (!location) return null;
  if (loading) return <span className={`${styles.container} ${className || ''}`} aria-label="Loading weather">🌡️ Loading...</span>;
  if (error) return null;
  if (!weather) return null;

  return (
    <span
      className={`${styles.container} ${className || ''}`}
      aria-label={`Weather at ${location}: ${weather.temperature}°F, ${weather.description}`}
    >
      <span className={styles.icon}>{weather.icon}</span>
      <span className={styles.temp}>{weather.temperature}°F</span>
      <span className={styles.desc}>{weather.description}</span>
    </span>
  );
}
