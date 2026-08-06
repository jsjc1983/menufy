import { describe, expect, it } from "vitest";
import {
  kitchenEventSelect,
  organizerEventSelect,
  publicEventSelect,
} from "./event-selects";

describe("event privacy projections", () => {
  it("never exposes guests through the public voting query", () => {
    expect(publicEventSelect).not.toHaveProperty("guests");
    expect(publicEventSelect).not.toHaveProperty("organizerEmail");
    expect(publicEventSelect).not.toHaveProperty("organizerToken");
  });

  it("keeps guest details in the token-protected organizer projection", () => {
    expect(organizerEventSelect).toHaveProperty("guests");
  });

  it("does not request guest identities for the kitchen", () => {
    const guestSelect = kitchenEventSelect.guests.select;
    expect(guestSelect).not.toHaveProperty("name");
    expect(guestSelect).not.toHaveProperty("submittedAt");
    expect(kitchenEventSelect).not.toHaveProperty("organizerName");
    expect(kitchenEventSelect).not.toHaveProperty("organizerEmail");
    expect(kitchenEventSelect).not.toHaveProperty("organizerToken");
  });
});
