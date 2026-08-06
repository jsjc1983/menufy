import { cookies } from "next/headers";
import {
  createSessionValue,
  sessionTtlSeconds,
  verifySessionValue,
} from "@/lib/session";

export const SESSION_COOKIE = "gruppy_restaurant_session";

function sessionSecret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres");
  }
  return "gruppy-local-development-session-secret";
}

export function assertSessionConfigured() {
  sessionSecret();
}

export async function setRestaurantSession(restaurantId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionValue(restaurantId, sessionSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds,
  });
}

export async function clearRestaurantSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function checkRestaurantSession(
  restaurantId: string
): Promise<boolean> {
  try {
    const store = await cookies();
    return verifySessionValue(
      store.get(SESSION_COOKIE)?.value,
      restaurantId,
      sessionSecret()
    );
  } catch {
    return false;
  }
}
