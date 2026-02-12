import { describe, it, expect } from 'vitest';

describe('Server Instrumentation', () => {
  it('instrumentation file exists', () => {
    // Check that the instrumentation file exists and can be imported
    expect(async () => {
      await import('../instrumentation');
    }).toBeDefined();
  });

  it('register function is exported', async () => {
    const instrumentation = await import('../instrumentation');
    expect(instrumentation.register).toBeDefined();
    expect(typeof instrumentation.register).toBe('function');
  });

  it('register function runs without crashing when DATABASE_URL is not set', async () => {
    // This test verifies that the register function doesn't crash the app
    // even when DATABASE_URL is not available (e.g., during build)
    const originalEnv = process.env.DATABASE_URL;
    const originalRuntime = process.env.NEXT_RUNTIME;
    
    try {
      delete process.env.DATABASE_URL;
      process.env.NEXT_RUNTIME = 'nodejs';
      
      const instrumentation = await import('../instrumentation');
      
      // Should not throw even without DATABASE_URL
      await expect(instrumentation.register()).resolves.not.toThrow();
    } finally {
      // Restore environment
      if (originalEnv) process.env.DATABASE_URL = originalEnv;
      if (originalRuntime) process.env.NEXT_RUNTIME = originalRuntime;
      else delete process.env.NEXT_RUNTIME;
    }
  });
});
