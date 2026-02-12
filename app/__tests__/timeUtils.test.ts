import { describe, it, expect } from 'vitest';
import { calculateDuration, calculateEndTime, isValidTime } from '../lib/timeUtils';

describe('timeUtils', () => {
  describe('calculateDuration', () => {
    it('calculates duration correctly for same-day times', () => {
      expect(calculateDuration('09:00', '10:00')).toBe(60);
      expect(calculateDuration('09:30', '10:45')).toBe(75);
      expect(calculateDuration('14:15', '16:45')).toBe(150);
    });

    it('handles midnight crossing', () => {
      expect(calculateDuration('23:00', '01:00')).toBe(120);
      expect(calculateDuration('22:30', '00:15')).toBe(105);
    });

    it('returns null for invalid inputs', () => {
      expect(calculateDuration('', '10:00')).toBeNull();
      expect(calculateDuration('09:00', '')).toBeNull();
      expect(calculateDuration('invalid', '10:00')).toBeNull();
      expect(calculateDuration('09:00', 'invalid')).toBeNull();
    });

    it('handles zero duration', () => {
      expect(calculateDuration('10:00', '10:00')).toBe(0);
    });
  });

  describe('calculateEndTime', () => {
    it('calculates end time correctly', () => {
      expect(calculateEndTime('09:00', 60)).toBe('10:00');
      expect(calculateEndTime('09:30', 75)).toBe('10:45');
      expect(calculateEndTime('14:15', 150)).toBe('16:45');
    });

    it('handles midnight crossing', () => {
      expect(calculateEndTime('23:00', 120)).toBe('01:00');
      expect(calculateEndTime('22:30', 105)).toBe('00:15');
    });

    it('returns null for invalid inputs', () => {
      expect(calculateEndTime('', 60)).toBeNull();
      expect(calculateEndTime('09:00', -10)).toBeNull();
      expect(calculateEndTime('invalid', 60)).toBeNull();
    });

    it('handles zero duration', () => {
      expect(calculateEndTime('10:00', 0)).toBe('10:00');
    });
  });

  describe('isValidTime', () => {
    it('validates correct time formats', () => {
      expect(isValidTime('09:00')).toBe(true);
      expect(isValidTime('00:00')).toBe(true);
      expect(isValidTime('23:59')).toBe(true);
      expect(isValidTime('12:30')).toBe(true);
    });

    it('rejects invalid time formats', () => {
      expect(isValidTime('')).toBe(false);
      expect(isValidTime('invalid')).toBe(false);
      expect(isValidTime('25:00')).toBe(false);
      expect(isValidTime('12:60')).toBe(false);
      expect(isValidTime('12:-1')).toBe(false);
    });
  });
});
