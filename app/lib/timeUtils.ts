/**
 * Time calculation utilities for event management
 */

/**
 * Calculates the duration in minutes between two time strings
 * @param startTime - Time in HH:MM format
 * @param endTime - Time in HH:MM format
 * @returns Duration in minutes, or null if invalid
 */
export function calculateDuration(startTime: string, endTime: string): number | null {
  if (!startTime || !endTime) return null;
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
    return null;
  }
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle case where end time is on the next day
  if (endMinutes < startMinutes) {
    return (24 * 60 - startMinutes) + endMinutes;
  }
  
  return endMinutes - startMinutes;
}

/**
 * Calculates the end time given a start time and duration
 * @param startTime - Time in HH:MM format
 * @param duration - Duration in minutes
 * @returns End time in HH:MM format, or null if invalid
 */
export function calculateEndTime(startTime: string, duration: number): string | null {
  if (!startTime || duration == null || duration < 0) return null;
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  
  if (isNaN(startHour) || isNaN(startMin)) {
    return null;
  }
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = (startMinutes + duration) % (24 * 60);
  
  const endHour = Math.floor(endMinutes / 60);
  const endMin = endMinutes % 60;
  
  return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
}

/**
 * Validates a time string in HH:MM format
 * @param time - Time string to validate
 * @returns True if valid, false otherwise
 */
export function isValidTime(time: string): boolean {
  if (!time) return false;
  
  const [hour, min] = time.split(':').map(Number);
  
  if (isNaN(hour) || isNaN(min)) return false;
  if (hour < 0 || hour > 23) return false;
  if (min < 0 || min > 59) return false;
  
  return true;
}
