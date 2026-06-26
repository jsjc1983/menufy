import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "gruppy_restaurant_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const PIN_HASH_PREFIX = "scrypt$v1";

function getSessionSecret(): string {
  const secret =
    process.env.GRUPPY_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Define GRUPPY_SESSION_SECRET, SESSION_SECRET o NEXTAUTH_SECRET para firmar sesiones."
    );
  }

  return "dev-only-gruppy-session-secret";
}

function base64UrlEncode(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(pin, salt, 32).toString("base64url");
  return `${PIN_HASH_PREFIX}$${salt}$${hash}`;
}

export function needsPinRehash(storedPin: string): boolean {
  return !storedPin.startsWith(`${PIN_HASH_PREFIX}$`);
}

export function verifyPinHash(pin: string, storedPin: string): boolean {
  if (!/^\d{4,6}$/.test(pin)) {
    return false;
  }

  if (!storedPin.startsWith(`${PIN_HASH_PREFIX}$`)) {
    return safeEqual(pin, storedPin);
  }

  const [, , salt, expectedHash] = storedPin.split("$");
  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(pin, salt, 32).toString("base64url");
  return safeEqual(actualHash, expectedHash);
}

export async function verifyRestaurantPinValue(
  restaurantId: string,
  pin: string | undefined
) {
  if (!restaurantId || !pin || !/^\d{4,6}$/.test(pin)) {
    return false;
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { adminPin: true },
  });

  return restaurant ? verifyPinHash(pin, restaurant.adminPin) : false;
}

export function setRestaurantSession(restaurantId: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({ restaurantId, iat: now, exp: now + SESSION_MAX_AGE_SECONDS, v: 1 })
  );
  const signature = signPayload(payload);

  cookies().set(SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearRestaurantSession() {
  cookies().delete(SESSION_COOKIE);
}

export function checkRestaurantSession(restaurantId: string): boolean {
  if (!restaurantId) {
    return false;
  }

  const session = cookies().get(SESSION_COOKIE)?.value;
  if (!session) {
    return false;
  }

  const [payload, signature] = session.split(".");
  if (!payload || !signature || !safeEqual(signature, signPayload(payload))) {
    return false;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload).toString("utf8")) as {
      restaurantId?: string;
      exp?: number;
    };

    return (
      parsed.restaurantId === restaurantId &&
      typeof parsed.exp === "number" &&
      parsed.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}
