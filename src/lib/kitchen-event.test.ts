import { describe, expect, it } from "vitest";
import { buildKitchenEvent } from "./kitchen-event";

describe("buildKitchenEvent", () => {
  it("returns operational data without exposing guest identities", () => {
    const result = buildKitchenEvent({
      id: "event-1",
      name: "Cena de prueba",
      date: new Date("2026-08-20T12:00:00Z"),
      guestCount: 2,
      status: "open",
      menu: {
        name: "Menú verano",
        courses: [{
          id: "course-1",
          name: "Principal",
          order: 1,
          dishes: [{
            id: "dish-1",
            name: "Pasta",
            allergens: JSON.stringify(["gluten"]),
            isShared: false,
            sharesFor: null,
          }],
        }],
      },
      guests: [{
        id: "guest-secret-id",
        allergens: JSON.stringify(["gluten"]),
        allergyNotes: "Evitar contaminación cruzada",
        selections: [{
          id: "selection-1",
          dish: {
            id: "dish-1",
            name: "Pasta",
            allergens: JSON.stringify(["gluten"]),
            course: { id: "course-1", name: "Principal", order: 1 },
          },
        }],
      }],
    });

    expect(JSON.stringify(result)).not.toContain("guest-secret-id");
    expect(JSON.stringify(result)).not.toContain("name\":\"Ana");
    expect(result.dietaryInstructions[0].serviceCode).toMatch(/^C-[A-F0-9]{8}$/);
    expect(result.dietaryInstructions[0].selections[0].conflicts).toEqual(["gluten"]);
    expect(result.courses[0].dishes[0].portions).toBe(1);
  });
});
