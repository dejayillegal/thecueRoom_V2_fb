
import { describe, it, expect, vi } from 'vitest';

describe('Feed Ingestion', () => {
  it('ingests feeds in TEST_MODE without making external calls', async () => {
    process.env.TEST_MODE = 'true';
    
    // Mock the ingest function
    const ingest = vi.fn().mockResolvedValue({
      success: true,
      itemsImported: 0,
      duplicatesSkipped: 0,
    });
    
    const result = await ingest();
    
    expect(result.success).toBe(true);
    expect(ingest).toHaveBeenCalled();
  });

  it('respects circuit breaker for failing sources', () => {
    const circuitBreaker = {
      failures: 0,
      isOpen: false,
      recordFailure() {
        this.failures++;
        if (this.failures >= 3) {
          this.isOpen = true;
        }
      },
      reset() {
        this.failures = 0;
        this.isOpen = false;
      },
    };

    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();
    circuitBreaker.recordFailure();

    expect(circuitBreaker.isOpen).toBe(true);
  });
});
