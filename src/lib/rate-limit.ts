const rateLimitStore = new Map<string, number[]>();

export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const requests = rateLimitStore.get(key) ?? [];
  const recent = requests.filter((ts) => now - ts < windowMs);

  if (recent.length >= maxRequests) {
    rateLimitStore.set(key, recent);
    return true;
  }

  recent.push(now);
  rateLimitStore.set(key, recent);
  return false;
}
