// Utility functions for time parsing and validation

/**
 * Parses a time string in HH:MM format to minutes since midnight
 * @param time - Time string in HH:MM format (e.g., "09:30", "14:00")
 * @returns Number of minutes since midnight, or null if invalid
 */
export function parseTimeString(time: string | null | undefined): number | null {
  if (!time) return null;
  
  const parts = time.split(':');
  // Accept HH:MM or HH:MM:SS format, but only use hours and minutes
  if (parts.length < 2) return null;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return null;
  if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) return null;
  
  return hours * 60 + minutes;
}

/**
 * Extracts the hour component from a time string
 * @param time - Time string in HH:MM format
 * @returns Hour (0-23) or null if invalid
 */
export function extractHourFromTime(time: string | null | undefined): number | null {
  if (!time) return null;
  
  const parts = time.split(':');
  if (parts.length < 2) return null;
  
  const hours = parseInt(parts[0], 10);
  
  if (isNaN(hours) || hours < 0 || hours >= 24) return null;
  
  return hours;
}

/**
 * Formats a duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "30 min", "2h 15m")
 */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
}
