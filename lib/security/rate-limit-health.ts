import { getRateLimitStoreHealth } from "@/lib/security/rate-limit";

export async function getRateLimitHealthSummary() {
  const health = await getRateLimitStoreHealth();

  return {
    provider: health.mode,
    connected: health.connected,
    detail: health.detail,
  };
}
