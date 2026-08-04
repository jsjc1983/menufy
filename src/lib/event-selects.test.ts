import { describe, expect, it } from "vitest";
import { organizerEventSelect, publicEventSelect } from "./event-selects";

describe("event privacy projections", () => {
  it("never exposes guests through the public voting query", () => {
    expect(publicEventSelect).not.toHaveProperty("guests");
    expect(publicEventSelect).not.toHaveProperty("organizerEmail");
    expect(publicEventSelect).not.toHaveProperty("organizerToken");
  });

  it("keeps guest details in the token-protected organizer projection", () => {
    expect(organizerEventSelect).toHaveProperty("guests");
  });
});
