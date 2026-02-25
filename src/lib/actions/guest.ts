"use server";

import { prisma } from "@/lib/db";

export async function submitGuestSelection(data: {
  eventId: string;
  name: string;
  allergens: string[];
  allergyNotes?: string;
  selections: { dishId: string }[];
}) {
  if (!data.name || data.name.trim().length === 0) {
    return { error: "El nombre es obligatorio" };
  }
  if (!data.selections || data.selections.length === 0) {
    return { error: "Debes seleccionar al menos un plato" };
  }

  // Check event is still open
  const event = await prisma.event.findUnique({
    where: { id: data.eventId },
    include: {
      menu: {
        include: {
          courses: true,
        },
      },
    },
  });

  if (!event) {
    return { error: "Evento no encontrado" };
  }
  if (event.status === "closed") {
    return { error: "Este evento ya no acepta respuestas" };
  }

  // Validate that selections cover all courses
  const courseCount = event.menu.courses.length;
  if (data.selections.length !== courseCount) {
    return { error: `Debes seleccionar un plato por cada tiempo (${courseCount} tiempos)` };
  }

  const guest = await prisma.guest.create({
    data: {
      name: data.name.trim(),
      allergens: JSON.stringify(data.allergens),
      allergyNotes: data.allergyNotes?.trim() || null,
      eventId: data.eventId,
      selections: {
        create: data.selections.map((s) => ({
          dishId: s.dishId,
        })),
      },
    },
    include: {
      selections: {
        include: { dish: true },
      },
    },
  });

  return { guest };
}
