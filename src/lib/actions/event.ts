"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateShareCode } from "@/lib/utils";
import { verifyRestaurantPinValue } from "@/lib/server-auth";

export async function createEvent(data: {
  restaurantId: string;
  adminPin?: string;
  name: string;
  date: string;
  guestCount: number;
  organizerName: string;
  organizerEmail?: string;
  menuId: string;
  daysBeforeClose?: number;
}) {
  const isAuthorized = await verifyRestaurantPinValue(
    data.restaurantId,
    data.adminPin
  );
  if (!isAuthorized) {
    return { error: "No tienes permisos para modificar este restaurante" };
  }

  if (!data.name || data.name.trim().length === 0) {
    return { error: "El nombre del evento es obligatorio" };
  }
  if (!data.date) {
    return { error: "La fecha del evento es obligatoria" };
  }
  const eventDate = new Date(data.date);
  if (Number.isNaN(eventDate.getTime())) {
    return { error: "La fecha del evento no es válida" };
  }
  if (
    !Number.isInteger(data.guestCount) ||
    data.guestCount < 1 ||
    data.guestCount > 10000
  ) {
    return { error: "El número de comensales debe ser al menos 1" };
  }
  if (!data.organizerName || data.organizerName.trim().length === 0) {
    return { error: "El nombre del organizador es obligatorio" };
  }
  if (!data.menuId) {
    return { error: "Debes seleccionar un menú" };
  }
  if (
    data.organizerEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.organizerEmail.trim())
  ) {
    return { error: "El email del organizador no es válido" };
  }

  const menu = await prisma.menu.findFirst({
    where: {
      id: data.menuId,
      restaurantId: data.restaurantId,
    },
    select: { id: true },
  });

  if (!menu) {
    return { error: "El menú seleccionado no pertenece a este restaurante" };
  }

  // Compute voting deadline
  let votingDeadline: Date | null = null;
  if (data.daysBeforeClose && data.daysBeforeClose > 0) {
    if (
      !Number.isInteger(data.daysBeforeClose) ||
      data.daysBeforeClose < 1 ||
      data.daysBeforeClose > 365
    ) {
      return { error: "El plazo de cierre debe estar entre 1 y 365 días" };
    }
    votingDeadline = new Date(eventDate);
    votingDeadline.setDate(eventDate.getDate() - data.daysBeforeClose);
    // End of that day (23:59:59)
    votingDeadline.setHours(23, 59, 59, 999);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const event = await prisma.event.create({
        data: {
          name: data.name.trim(),
          date: eventDate,
          guestCount: data.guestCount,
          shareCode: generateShareCode(),
          organizerName: data.organizerName.trim(),
          organizerEmail: data.organizerEmail?.trim() || null,
          restaurantId: data.restaurantId,
          menuId: data.menuId,
          votingDeadline,
        },
      });

      return { event };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }

      throw error;
    }
  }

  return {
    error: "No se pudo generar un código de invitación único. Inténtalo de nuevo.",
  };
}

export async function getEventByShareCode(shareCode: string) {
  const normalizedShareCode = shareCode.trim().toLowerCase();
  if (!/^[a-z0-9]{6}$/.test(normalizedShareCode)) {
    return null;
  }

  return prisma.event.findUnique({
    where: { shareCode: normalizedShareCode },
    select: {
      id: true,
      name: true,
      date: true,
      guestCount: true,
      shareCode: true,
      organizerName: true,
      status: true,
      votingDeadline: true,
      restaurant: {
        select: {
          id: true,
          name: true,
        },
      },
      menu: {
        select: {
          id: true,
          name: true,
          courses: {
            select: {
              id: true,
              name: true,
              order: true,
              dishes: true,
            },
            orderBy: { order: "asc" },
          },
        },
      },
      guests: {
        select: {
          id: true,
          name: true,
          allergens: true,
          allergyNotes: true,
          submittedAt: true,
          selections: {
            select: {
              id: true,
              dish: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
}

export async function getEventById(
  eventId: string,
  restaurantId: string,
  adminPin?: string
) {
  const isAuthorized = await verifyRestaurantPinValue(restaurantId, adminPin);
  if (!isAuthorized) {
    return null;
  }

  return prisma.event.findFirst({
    where: { id: eventId, restaurantId },
    select: {
      id: true,
      name: true,
      date: true,
      guestCount: true,
      shareCode: true,
      organizerName: true,
      organizerEmail: true,
      status: true,
      votingDeadline: true,
      restaurant: {
        select: {
          id: true,
          name: true,
        },
      },
      menu: {
        select: {
          id: true,
          name: true,
          courses: {
            select: {
              id: true,
              name: true,
              order: true,
              dishes: true,
            },
            orderBy: { order: "asc" },
          },
        },
      },
      guests: {
        select: {
          id: true,
          name: true,
          allergens: true,
          allergyNotes: true,
          submittedAt: true,
          selections: {
            select: {
              id: true,
              dish: {
                include: { course: true },
              },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
}

export async function closeEvent(
  eventId: string,
  restaurantId: string,
  adminPin?: string
) {
  const isAuthorized = await verifyRestaurantPinValue(restaurantId, adminPin);
  if (!isAuthorized) {
    return { error: "No tienes permisos para cerrar este evento" };
  }

  const result = await prisma.event.updateMany({
    where: { id: eventId, restaurantId },
    data: { status: "closed" },
  });

  if (result.count === 0) {
    return { error: "Evento no encontrado" };
  }

  return { success: true };
}
