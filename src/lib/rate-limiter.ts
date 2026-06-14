interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// Global in-memory storage for token buckets (persisted during dev/prod server lifetime)
const buckets = new Map<string, TokenBucket>();

interface RateLimitConfig {
  limit: number;       // Maximum number of requests (tokens) allowed
  intervalSeconds: number; // Time window in seconds for a full bucket refill
}

/**
 * Checks if a key (e.g. user ID + action name) has exceeded its rate limit.
 * Implements the Token Bucket algorithm.
 * 
 * Returns whether the request is rate-limited and the retry duration.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const intervalMs = config.intervalSeconds * 1000;
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: config.limit, lastRefill: now };
    buckets.set(key, bucket);
  }

  // 1. Refill tokens based on time elapsed since last check
  const elapsedMs = now - bucket.lastRefill;
  if (elapsedMs > 0) {
    const tokensToAdd = (elapsedMs / intervalMs) * config.limit;
    bucket.tokens = Math.min(config.limit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // 2. Consume 1 token if available
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return { limited: false, retryAfterSeconds: 0 };
  }

  // 3. Rate limited: calculate time remaining until at least 1 token is refilled
  const missingTokens = 1 - bucket.tokens;
  const timeToWaitMs = (missingTokens / config.limit) * intervalMs;
  const retryAfterSeconds = Math.max(1, Math.ceil(timeToWaitMs / 1000));

  return { limited: true, retryAfterSeconds };
}
