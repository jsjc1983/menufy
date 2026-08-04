import { describe, expect, it } from "vitest";
import { createSessionValue, verifySessionValue } from "./session";

const secret = "a-secure-test-secret-with-more-than-32-characters";
const now = Date.UTC(2026, 7, 4, 12, 0, 0);

describe("signed restaurant sessions", () => {
  it("accepts a valid unexpired session for the correct restaurant", () => {
    const value = createSessionValue("restaurant-a", secret, now);
    expect(verifySessionValue(value, "restaurant-a", secret, now + 1000)).toBe(true);
  });

  it("rejects tampering and cross-restaurant access", () => {
    const value = createSessionValue("restaurant-a", secret, now);
    expect(verifySessionValue(value, "restaurant-b", secret, now)).toBe(false);
    expect(verifySessionValue(`${value}x`, "restaurant-a", secret, now)).toBe(false);
  });

  it("rejects expired sessions", () => {
    const value = createSessionValue("restaurant-a", secret, now);
    expect(verifySessionValue(value, "restaurant-a", secret, now + 9 * 60 * 60 * 1000)).toBe(false);
  });
});
