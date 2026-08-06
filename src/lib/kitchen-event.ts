import { createHash } from "node:crypto";
import { parseAllergenIds } from "./allergens";
import { kitchenEventSelect } from "./event-selects";
import type { Prisma } from "@prisma/client";

type KitchenEventSource = Prisma.EventGetPayload<{
  select: typeof kitchenEventSelect;
}>;

function serviceCode(eventId: string, guestId: string): string {
  const digest = createHash("sha256")
    .update(`${eventId}:${guestId}`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `C-${digest}`;
}

export function buildKitchenEvent(event: KitchenEventSource) {
  const courses = event.menu.courses.map((course) => ({
    id: course.id,
    name: course.name,
    order: course.order,
    dishes: course.dishes.map((dish) => {
      const selections = event.guests.reduce(
        (total, guest) =>
          total + guest.selections.filter((item) => item.dish.id === dish.id).length,
        0
      );
      return {
        id: dish.id,
        name: dish.name,
        selections,
        isShared: dish.isShared,
        sharesFor: dish.sharesFor,
        portions:
          dish.isShared && dish.sharesFor
            ? Math.ceil(selections / dish.sharesFor)
            : selections,
      };
    }),
  }));

  const dietaryInstructions = event.guests
    .map((guest) => {
      const allergens = parseAllergenIds(guest.allergens);
      const selections = guest.selections.map((selection) => {
        const dishAllergens = parseAllergenIds(selection.dish.allergens);
        return {
          id: selection.id,
          dishName: selection.dish.name,
          courseName: selection.dish.course.name,
          conflicts: allergens.filter((allergen) =>
            dishAllergens.includes(allergen)
          ),
        };
      });

      return {
        serviceCode: serviceCode(event.id, guest.id),
        allergens,
        allergyNotes: guest.allergyNotes,
        selections,
      };
    })
    .filter(
      (guest) =>
        guest.allergens.length > 0 ||
        Boolean(guest.allergyNotes) ||
        guest.selections.some((selection) => selection.conflicts.length > 0)
    );

  return {
    id: event.id,
    name: event.name,
    date: event.date,
    guestCount: event.guestCount,
    respondedCount: event.guests.length,
    status: event.status,
    menuName: event.menu.name,
    courses,
    dietaryInstructions,
  };
}
