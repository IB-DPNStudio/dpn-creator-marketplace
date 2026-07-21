const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * A simple in-memory rate limiter for single-server Next.js deployments.
 * 
 * @param ip The IP address or identifier to rate limit.
 * @param limit The maximum number of requests allowed in the window.
 * @param windowMs The time window in milliseconds.
 * @returns An object containing success status and optional retryAfter in seconds.
 */
export function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { success: boolean; retryAfter?: number } {
  const now = Date.now();
  let record = rateLimitMap.get(ip);

  // If no record exists or the window has expired, reset it.
  if (!record || record.resetAt < now) {
    record = { count: 1, resetAt: now + windowMs };
    rateLimitMap.set(ip, record);
    return { success: true };
  }

  // If the limit has been reached, deny the request.
  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { success: false, retryAfter };
  }

  // Otherwise, increment the count and allow.
  record.count += 1;
  return { success: true };
}
