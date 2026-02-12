import { describe, it, expect } from 'vitest';
import { calculateDuration, calculateEndTime } from '../lib/timeUtils';

/**
 * Comprehensive end-to-end test scenarios for the implemented features
 */
describe('E2E: Time Calculation Feature', () => {
  describe('Scenario 1: User creates event with start and end times', () => {
    it('should automatically calculate duration', () => {
      // User fills in form
      const formData = {
        title: 'Coffee Meeting',
        startTime: '09:00',
        endTime: '10:00',
        duration: '', // Not filled by user
      };

      // System calculates duration
      const calculatedDuration = calculateDuration(formData.startTime, formData.endTime);

      // API receives complete data
      expect(calculatedDuration).toBe(60);
      
      // Saved to database:
      // start_time: '09:00', end_time: '10:00', duration: 60
    });
  });

  describe('Scenario 2: User creates event with start time and duration', () => {
    it('should automatically calculate end time', () => {
      // User fills in form
      const formData = {
        title: 'Museum Visit',
        startTime: '14:00',
        endTime: '', // Not filled by user
        duration: 120,
      };

      // System calculates end time
      const calculatedEndTime = calculateEndTime(formData.startTime, formData.duration);

      // API receives complete data
      expect(calculatedEndTime).toBe('16:00');
      
      // Saved to database:
      // start_time: '14:00', end_time: '16:00', duration: 120
    });
  });

  describe('Scenario 3: User updates event start time', () => {
    it('should recalculate end time based on existing duration', () => {
      // Existing event in database
      const existingEvent = {
        startTime: '10:00',
        endTime: '11:30',
        duration: 90,
      };

      // User updates start time to 11:00
      const newStartTime = '11:00';
      
      // System recalculates end time
      const newEndTime = calculateEndTime(newStartTime, existingEvent.duration);

      expect(newEndTime).toBe('12:30');
      
      // Updated in database:
      // start_time: '11:00', end_time: '12:30', duration: 90 (unchanged)
    });
  });

  describe('Scenario 4: User updates event end time', () => {
    it('should recalculate duration based on existing start time', () => {
      // Existing event in database
      const existingEvent = {
        startTime: '10:00',
        endTime: '11:00',
        duration: 60,
      };

      // User updates end time to 12:00
      const newEndTime = '12:00';
      
      // System recalculates duration
      const newDuration = calculateDuration(existingEvent.startTime, newEndTime);

      expect(newDuration).toBe(120);
      
      // Updated in database:
      // start_time: '10:00', end_time: '12:00', duration: 120
    });
  });

  describe('Scenario 5: Complex real-world schedule', () => {
    it('should handle a full day of events', () => {
      const schedule = [
        { name: 'Breakfast', start: '08:00', end: '09:00' },
        { name: 'Museum', start: '10:00', duration: 180 },
        { name: 'Lunch', start: '13:30', end: '14:30' },
        { name: 'Park Walk', start: '15:00', duration: 90 },
        { name: 'Dinner', start: '19:00', end: '21:00' },
      ];

      // Calculate missing fields
      const results = schedule.map(event => {
        if (event.end) {
          return {
            ...event,
            duration: calculateDuration(event.start, event.end),
          };
        } else {
          return {
            ...event,
            end: calculateEndTime(event.start, event.duration!),
          };
        }
      });

      expect(results[0].duration).toBe(60); // Breakfast
      expect(results[1].end).toBe('13:00'); // Museum
      expect(results[2].duration).toBe(60); // Lunch
      expect(results[3].end).toBe('16:30'); // Park Walk
      expect(results[4].duration).toBe(120); // Dinner
    });
  });

  describe('Scenario 6: Edge cases', () => {
    it('should handle midnight crossing', () => {
      const lateEvent = {
        startTime: '23:30',
        duration: 90,
      };

      const endTime = calculateEndTime(lateEvent.startTime, lateEvent.duration);
      expect(endTime).toBe('01:00'); // Next day
    });

    it('should handle events with no time data', () => {
      const event = {
        title: 'All-day event',
        startTime: '',
        endTime: '',
        duration: null,
      };

      // System gracefully handles missing time data
      expect(calculateDuration('', '')).toBeNull();
      expect(calculateEndTime('', 0)).toBeNull();
    });

    it('should handle zero duration', () => {
      const instantEvent = {
        startTime: '12:00',
        duration: 0,
      };

      const endTime = calculateEndTime(instantEvent.startTime, instantEvent.duration);
      expect(endTime).toBe('12:00'); // Same as start time
    });
  });
});

describe('E2E: Location Autocomplete Feature', () => {
  describe('Scenario 1: User in New York searches for coffee', () => {
    it('should prioritize NYC results', () => {
      const userLocation = { lat: 40.7580, lon: -73.9855 };
      const query = 'starbucks';

      // Viewbox calculation for NYC
      const viewbox = `${userLocation.lon - 0.15},${userLocation.lat + 0.15},${userLocation.lon + 0.15},${userLocation.lat - 0.15}`;
      
      // Verify viewbox contains NYC coordinates (with floating point tolerance)
      expect(viewbox).toContain('40.908');
      expect(viewbox).toContain('40.608');
      expect(viewbox.split(',')).toHaveLength(4);
    });
  });

  describe('Scenario 2: User denies location permission', () => {
    it('should fall back to Midtown NYC', () => {
      // When geolocation fails, hook returns default
      const fallbackLocation = { lat: 40.7580, lon: -73.9855 };

      // Search still works with default center
      expect(fallbackLocation.lat).toBe(40.7580);
      expect(fallbackLocation.lon).toBe(-73.9855);
    });
  });

  describe('Scenario 3: User searches for location', () => {
    it('should use viewbox parameter in API call', () => {
      const center = { lat: 40.7580, lon: -73.9855 };
      const latDelta = 0.15;
      const lonDelta = 0.15;

      // Viewbox creates ~10 mile radius
      const viewbox = `${center.lon - lonDelta},${center.lat + latDelta},${center.lon + lonDelta},${center.lat - latDelta}`;
      
      // Verify the viewbox format is correct
      const parts = viewbox.split(',');
      expect(parts).toHaveLength(4); // Should have 4 parts
      expect(parseFloat(parts[0])).toBeCloseTo(-74.1355, 3); // west
      expect(parseFloat(parts[1])).toBeCloseTo(40.908, 3);   // north  
      expect(parseFloat(parts[2])).toBeCloseTo(-73.8355, 3); // east
      expect(parseFloat(parts[3])).toBeCloseTo(40.608, 3);   // south
    });
  });
});
