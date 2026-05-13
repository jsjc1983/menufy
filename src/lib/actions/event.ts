"use server";

import { prisma } from "@/lib/db";
import { generateShareCode } from "@/lib/utils";

export async function createEvent(data: {
  restaurantId: string;
  name: string;
  date: string;
  guestCount: number;
  organizerName: string;
  organizerEmail?: string;
  menuId: string;
  daysBeforeClose?: number;
}) {
  if (!data.name || data.name.trim().length === 0) {
    return { error: "El nombre del evento es obligatorio" };
  }
  if (!data.date) {
    return { error: "La fecha del evento es obligatoria" };
  }
  if (!data.guestCount || data.guestCount < 1) {
    return { error: "El número de comensales debe ser al menos 1" };
  }
  if (!data.organizerName || data.organizerName.trim().length === 0) {
    return { error: "El nombre del organizador es obligatorio" };
  }
  if (!data.menuId) {
    return { error: "Debes seleccionar un menú" };
  }

  // Compute voting deadline
  let votingDeadline: Date | null = null;
  if (data.daysBeforeClose && data.daysBeforeClose > 0) {
    const eventDate = new Date(data.date);
    votingDeadline = new Date(eventDate);
    votingDeadline.setDate(eventDate.getDate() - data.daysBeforeClose);
    // End of that day (23:59:59)
    votingDeadline.setHours(23, 59, 59, 999);
  }

  // Generate unique shareCode
  let shareCode = generateShareCode();
  let existing = await prisma.event.findUnique({ where: { shareCode } });
  while (existing) {
    shareCode = generateShareCode();
    existing = await prisma.event.findUnique({ where: { shareCode } });
  }

  const event = await prisma.event.create({
    data: {
      name: data.name.trim(),
      date: new Date(data.date),
      guestCount: data.guestCount,
      shareCode,
      organizerName: data.organizerName.trim(),
      organizerEmail: data.organizerEmail?.trim() || null,
      restaurantId: data.restaurantId,
      menuId: data.menuId,
      votingDeadline,
    },
  });

  return { event };
}

export async function getEventByShareCode(shareCode: string) {
  return prisma.event.findUnique({
    where: { shareCode },
    include: {
      restaurant: true,
      menu: {
        include: {
          courses: {
            include: { dishes: true },
            orderBy: { order: "asc" },
          },
        },
      },
      guests: {
        include: { selections: { include: { dish: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
}

export async function getEventById(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      restaurant: true,
      menu: {
        include: {
          courses: {
            include: { dishes: true },
            orderBy: { order: "asc" },
          },
        },
      },
      guests: {
        include: {
          selections: {
            include: {
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

export async function closeEvent(eventId: string) {
  await prisma.event.update({
    where: { id: eventId },
    data: { status: "closed" },
  });
  return { success: true };
}
