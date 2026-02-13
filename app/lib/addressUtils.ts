/**
 * Simplifies a verbose address for display purposes.
 *
 * Examples:
 *  - "203, Rivington Street, Apt 1L, Lower East Side, Manhattan Community Board 3, Manhattan, New York County, New York, 10002, United States"
 *    → "203 Rivington Street, Apt 1L"
 *  - "Eataly, 200, 5th Avenue, Flatiron District, Manhattan Community Board 5, Manhattan, New York County, New York, 10010, United States"
 *    → "Eataly - 200 5th Avenue"
 */
export function simplifyAddress(address: string): string {
  if (!address) return address;

  const parts = address.split(',').map((p) => p.trim());
  if (parts.length <= 2) return address;

  // Detect if the first part looks like a venue name (not starting with a digit)
  const firstIsVenue = parts[0] && !/^\d/.test(parts[0]);
  // Detect if the second part looks like a street number
  const secondIsNumber = parts[1] && /^\d+$/.test(parts[1]);

  if (firstIsVenue && secondIsNumber && parts.length > 2) {
    // Pattern: "Venue, 200, 5th Avenue, ..." → "Venue - 200 5th Avenue"
    const streetName = parts[2];
    return `${parts[0]} - ${parts[1]} ${streetName}`;
  }

  if (/^\d+$/.test(parts[0]) && parts.length > 1) {
    // Pattern: "203, Rivington Street, Apt 1L, ..." → "203 Rivington Street, Apt 1L"
    const streetName = parts[1];
    // Check if the third part looks like a unit/apt (not a neighborhood or borough)
    const thirdPart = parts[2];
    const isUnit =
      thirdPart &&
      /^(apt|suite|unit|ste|#|fl|floor|room|rm|bldg|building)\b/i.test(thirdPart);
    if (isUnit) {
      return `${parts[0]} ${streetName}, ${thirdPart}`;
    }
    return `${parts[0]} ${streetName}`;
  }

  // Fallback: return first two parts
  return parts.slice(0, 2).join(', ');
}
