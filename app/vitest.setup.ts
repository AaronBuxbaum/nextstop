import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

// Start MSW server before tests
// Allow external API requests (e.g., Nominatim, OSRM) to pass through in tests
beforeAll(() => server.listen({
  onUnhandledRequest(request, print) {
    const url = new URL(request.url);
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      return;
    }
    print.error();
  },
}));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
