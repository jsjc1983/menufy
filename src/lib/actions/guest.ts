"use server";

import { prisma } from "@/lib/db";
import { normalizeAllergenIds } from "@/lib/allergens";

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
  if (data.name.trim().length > 100) {
    return { error: "El nombre no puede superar 100 caracteres" };
  }
  if (data.allergyNotes && data.allergyNotes.trim().length > 500) {
    return { error: "Las notas de alergias no pueden superar 500 caracteres" };
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
          courses: {
            include: {
              dishes: true,
            },
          },
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
  if (event.votingDeadline && new Date() > new Date(event.votingDeadline)) {
    return { error: "El plazo para votar en este evento ya ha finalizado" };
  }

  // Validate that selections cover all courses
  const courseCount = event.menu.courses.length;
  if (data.selections.length !== courseCount) {
    return { error: `Debes seleccionar un plato por cada tiempo (${courseCount} tiempos)` };
  }

  const dishCourseMap = new Map<string, string>();
  for (const course of event.menu.courses) {
    for (const dish of course.dishes) {
      dishCourseMap.set(dish.id, course.id);
    }
  }

  const selectionsByCourse = new Map<string, string>();
  for (const selection of data.selections) {
    const courseId = dishCourseMap.get(selection.dishId);
    if (!courseId) {
      return { error: "Uno de los platos seleccionados no pertenece a este evento" };
    }
    if (selectionsByCourse.has(courseId)) {
      return { error: "Debes seleccionar solo un plato por cada tiempo" };
    }
    selectionsByCourse.set(courseId, selection.dishId);
  }

  if (selectionsByCourse.size !== courseCount) {
    return { error: `Debes seleccionar un plato por cada tiempo (${courseCount} tiempos)` };
  }

  const orderedSelections = event.menu.courses.map((course) => ({
    dishId: selectionsByCourse.get(course.id)!,
  }));

  const guest = await prisma.guest.create({
    data: {
      name: data.name.trim(),
      allergens: JSON.stringify(normalizeAllergenIds(data.allergens)),
      allergyNotes: data.allergyNotes?.trim() || null,
      eventId: data.eventId,
      selections: {
        create: orderedSelections,
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
