const rateMap = new Map<string, { count: number; resetAt: number }>();

// Periodic cleanup to prevent memory leaks (remove expired entries)
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  cleanupExpired();
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

export function getRateLimitKey(request: Request): string {
  // On Vercel, x-real-ip is set by the edge and cannot be spoofed by clients.
  // Fall back to x-forwarded-for first entry, then "unknown".
  const headers = request.headers;
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
