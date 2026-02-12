# TypeScript Build Error Fix

## Problem
The build was failing with the following TypeScript error:

```
Type error: Argument of type '{ startTime: string; endTime: string; duration: string; }' 
is not assignable to parameter of type 'SetStateAction<{ title: string; description: string; 
location: string; startTime: string; endTime: string; duration: string; notes: string; }>'.
```

This error occurred at line 177 in `app/app/plans/[id]/page.tsx`:
```typescript
setNewEvent(calculateTimeFields(newEvent, field, value));
```

## Root Cause
The `calculateTimeFields` function had a restrictive type signature that only accepted and returned objects with `{ startTime, endTime, duration }` properties:

```typescript
const calculateTimeFields = (
  eventData: { startTime: string; endTime: string; duration: string },
  field: 'startTime' | 'endTime' | 'duration',
  value: string
) => {
  // ...
}
```

However, it was being called with `newEvent` and `editForm` objects that contain additional properties:
- `title`
- `description`
- `location`
- `notes`

When the function returned only the time-related properties, TypeScript correctly flagged that the return type was incompatible with the full event object structure expected by `setNewEvent`.

## Solution
Changed the function to use TypeScript generics with a constraint:

```typescript
const calculateTimeFields = <T extends { startTime: string; endTime: string; duration: string }>(
  eventData: T,
  field: 'startTime' | 'endTime' | 'duration',
  value: string
): T => {
  const updated = { ...eventData, [field]: value };
  // ... rest of the logic
  return updated;
}
```

### How It Works
- `<T extends { ... }>` - Defines a generic type `T` that must have at least the time-related properties
- `eventData: T` - Accepts any object of type `T`
- `: T` - Returns the same type `T`
- `{ ...eventData, [field]: value }` - Spreads all properties from the input object, preserving them in the output

This allows the function to:
1. Accept objects with additional properties beyond just time fields
2. Preserve all those properties in the returned object
3. Still maintain type safety by ensuring the required time properties exist

## Verification

### Build Test
```bash
npm run build
```
Result: ✅ Build successful with no TypeScript errors

### Test Suite
```bash
npm test -- --run
```
Result: ✅ All 98 tests passing (14 test files)

## Impact
- **No breaking changes**: The function behavior remains the same
- **Type safety improved**: TypeScript now correctly infers the full type
- **Code clarity**: The generic type makes the function's intent clearer
- **Reusability**: The function can now be used with any object that has time properties

## Files Changed
- `app/app/plans/[id]/page.tsx` - Updated `calculateTimeFields` function signature (1 file, 3 lines changed)
