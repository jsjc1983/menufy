import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_TTL_SECONDS = 60 * 60 * 8;

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionValue(
  restaurantId: string,
  secret: string,
  now = Date.now()
): string {
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const payload = `${restaurantId}.${expiresAt}`;
  return `${payload}.${signature(payload, secret)}`;
}

export function verifySessionValue(
  value: string | undefined,
  restaurantId: string,
  secret: string,
  now = Date.now()
): boolean {
  if (!value || !restaurantId || !secret) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [sessionRestaurantId, rawExpiry, suppliedSignature] = parts;
  const expiry = Number(rawExpiry);
  if (
    sessionRestaurantId !== restaurantId ||
    !Number.isSafeInteger(expiry) ||
    expiry <= Math.floor(now / 1000)
  ) {
    return false;
  }

  const payload = `${sessionRestaurantId}.${rawExpiry}`;
  const expectedSignature = signature(payload, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export const sessionTtlSeconds = SESSION_TTL_SECONDS;
