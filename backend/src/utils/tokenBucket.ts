interface TokenBucketRecord {
  tokens: number;
  lastRefill: number;
}

export class SlidingTokenBucket {
  private buckets = new Map<string, TokenBucketRecord>();
  private readonly capacity: number;
  private readonly refillRatePerSecond: number;
  private readonly windowMs: number;

  constructor(options: { maxTokens: number; windowMs: number }) {
    this.capacity = options.maxTokens;
    this.windowMs = options.windowMs;
    this.refillRatePerSecond = this.capacity / (options.windowMs / 1000);

    // Periodic cleanup of stale entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  public consume(key: string, tokens = 1): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
      this.buckets.set(key, bucket);
    } else {
      // Calculate refilled tokens based on elapsed time
      const elapsedSeconds = (now - bucket.lastRefill) / 1000;
      const addedTokens = elapsedSeconds * this.refillRatePerSecond;
      bucket.tokens = Math.min(this.capacity, bucket.tokens + addedTokens);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        retryAfterMs: 0,
      };
    }

    const neededTokens = tokens - bucket.tokens;
    const retryAfterMs = Math.ceil((neededTokens / this.refillRatePerSecond) * 1000);

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.buckets.entries()) {
      if (now - record.lastRefill > this.windowMs * 2) {
        this.buckets.delete(key);
      }
    }
  }
}
