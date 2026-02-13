import { describe, it, expect } from 'vitest';
import { simplifyAddress } from '@/lib/addressUtils';

describe('simplifyAddress', () => {
  it('returns empty string for empty input', () => {
    expect(simplifyAddress('')).toBe('');
  });

  it('returns short addresses unchanged', () => {
    expect(simplifyAddress('Corner Cafe')).toBe('Corner Cafe');
    expect(simplifyAddress('Central Park')).toBe('Central Park');
  });

  it('returns two-part addresses unchanged', () => {
    expect(simplifyAddress('Corner Cafe, Main St')).toBe('Corner Cafe, Main St');
  });

  it('simplifies street number address with unit', () => {
    expect(
      simplifyAddress(
        '203, Rivington Street, Apt 1L, Lower East Side, Manhattan Community Board 3, Manhattan, New York County, New York, 10002, United States'
      )
    ).toBe('203 Rivington Street, Apt 1L');
  });

  it('simplifies venue address with street number', () => {
    expect(
      simplifyAddress(
        'Eataly, 200, 5th Avenue, Flatiron District, Manhattan Community Board 5, Manhattan, New York County, New York, 10010, United States'
      )
    ).toBe('Eataly - 200 5th Avenue');
  });

  it('simplifies street number address without unit', () => {
    expect(
      simplifyAddress(
        '100, Broadway, Financial District, Manhattan, New York County, New York, 10005, United States'
      )
    ).toBe('100 Broadway');
  });

  it('handles venue names that start with letters', () => {
    expect(
      simplifyAddress(
        'The Met, 1000, 5th Avenue, Upper East Side, Manhattan, New York, 10028, United States'
      )
    ).toBe('The Met - 1000 5th Avenue');
  });

  it('handles Suite unit indicator', () => {
    expect(
      simplifyAddress(
        '500, Madison Avenue, Suite 200, Midtown, Manhattan, New York, 10022, United States'
      )
    ).toBe('500 Madison Avenue, Suite 200');
  });

  it('handles addresses with only three parts and no known pattern', () => {
    expect(simplifyAddress('Place A, Place B, Place C')).toBe('Place A, Place B');
  });
});
