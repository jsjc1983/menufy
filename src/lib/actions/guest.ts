"use server";

import { prisma } from "@/lib/db";
import { normalizeAllergenIds } from "@/lib/allergens";
import { checkRestaurantSession } from "@/lib/server-auth";

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

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

  const normalizedName = normalizeName(data.name);
  const duplicate = await prisma.guest.findFirst({
    where: { eventId: data.eventId, normalizedName },
    select: { id: true },
  });
  if (duplicate) {
    return {
      error:
        "Ya existe una respuesta con ese nombre. Si necesitas cambiarla, habla con el restaurante.",
    };
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
      normalizedName,
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

export async function deleteGuest(
  guestId: string,
  eventId: string,
  restaurantId: string
) {
  if (!checkRestaurantSession(restaurantId)) {
    return { error: "No autorizado" };
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, restaurantId },
    select: { id: true },
  });
  if (!event) return { error: "Evento no encontrado" };

  const guest = await prisma.guest.findFirst({
    where: { id: guestId, eventId },
    select: { id: true },
  });
  if (!guest) return { error: "Invitado no encontrado" };

  await prisma.selection.deleteMany({ where: { guestId } });
  await prisma.guest.delete({ where: { id: guestId } });
  return { success: true };
}

export async function updateGuestSelection(data: {
  guestId: string;
  eventId: string;
  restaurantId: string;
  name: string;
  allergens: string[];
  allergyNotes?: string;
  selections: { dishId: string }[];
}) {
  if (!checkRestaurantSession(data.restaurantId)) {
    return { error: "No autorizado" };
  }

  if (!data.name || data.name.trim().length === 0) {
    return { error: "El nombre es obligatorio" };
  }
  if (data.name.trim().length > 100) {
    return { error: "El nombre no puede superar 100 caracteres" };
  }

  const guest = await prisma.guest.findFirst({
    where: { id: data.guestId, eventId: data.eventId },
    include: {
      event: {
        select: {
          restaurantId: true,
          menu: {
            include: {
              courses: {
                include: { dishes: { select: { id: true } } },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!guest || guest.event.restaurantId !== data.restaurantId) {
    return { error: "Invitado no encontrado" };
  }

  const courses = guest.event.menu.courses;

  if (data.selections.length !== courses.length) {
    return { error: `Debes seleccionar un plato por cada tiempo (${courses.length} tiempos)` };
  }

  const dishCourseMap = new Map<string, string>();
  for (const course of courses) {
    for (const dish of course.dishes) {
      dishCourseMap.set(dish.id, course.id);
    }
  }

  const selectionsByCourse = new Map<string, string>();
  for (const sel of data.selections) {
    const courseId = dishCourseMap.get(sel.dishId);
    if (!courseId) return { error: "Plato no válido para este menú" };
    if (selectionsByCourse.has(courseId)) return { error: "Solo un plato por tiempo" };
    selectionsByCourse.set(courseId, sel.dishId);
  }

  if (selectionsByCourse.size !== courses.length) {
    return { error: `Debes seleccionar un plato por cada tiempo (${courses.length} tiempos)` };
  }

  await prisma.selection.deleteMany({ where: { guestId: data.guestId } });
  await prisma.guest.update({
    where: { id: data.guestId },
    data: {
      name: data.name.trim(),
      normalizedName: normalizeName(data.name),
      allergens: JSON.stringify(normalizeAllergenIds(data.allergens)),
      allergyNotes: data.allergyNotes?.trim() || null,
      selections: { create: data.selections },
    },
  });

  return { success: true };
}

export async function createGuestManually(data: {
  eventId: string;
  restaurantId: string;
  name: string;
  allergens: string[];
  allergyNotes?: string;
  selections: { dishId: string }[];
}) {
  if (!checkRestaurantSession(data.restaurantId)) {
    return { error: "No autorizado" };
  }

  if (!data.name || data.name.trim().length === 0) {
    return { error: "El nombre es obligatorio" };
  }
  if (data.name.trim().length > 100) {
    return { error: "El nombre no puede superar 100 caracteres" };
  }

  const event = await prisma.event.findFirst({
    where: { id: data.eventId, restaurantId: data.restaurantId },
    include: {
      menu: {
        include: {
          courses: {
            include: { dishes: { select: { id: true } } },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!event) return { error: "Evento no encontrado" };

  const courses = event.menu.courses;

  if (data.selections.length !== courses.length) {
    return { error: `Debes seleccionar un plato por cada tiempo (${courses.length} tiempos)` };
  }

  const dishCourseMap = new Map<string, string>();
  for (const course of courses) {
    for (const dish of course.dishes) {
      dishCourseMap.set(dish.id, course.id);
    }
  }

  const selectionsByCourse = new Map<string, string>();
  for (const sel of data.selections) {
    const courseId = dishCourseMap.get(sel.dishId);
    if (!courseId) return { error: "Plato no válido para este menú" };
    if (selectionsByCourse.has(courseId)) return { error: "Solo un plato por tiempo" };
    selectionsByCourse.set(courseId, sel.dishId);
  }

  if (selectionsByCourse.size !== courses.length) {
    return { error: `Debes seleccionar un plato por cada tiempo (${courses.length} tiempos)` };
  }

  const orderedSelections = courses.map((course) => ({
    dishId: selectionsByCourse.get(course.id)!,
  }));

  const guest = await prisma.guest.create({
    data: {
      name: data.name.trim(),
      normalizedName: normalizeName(data.name),
      allergens: JSON.stringify(normalizeAllergenIds(data.allergens)),
      allergyNotes: data.allergyNotes?.trim() || null,
      eventId: data.eventId,
      selections: { create: orderedSelections },
    },
  });

  return { guest };
}
