"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  checkRestaurantSession,
  clearRestaurantSession,
  assertSessionConfigured,
  setRestaurantSession,
} from "@/lib/server-auth";

const MAX_PIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function createRestaurant(data: {
  name: string;
  adminPin: string;
}) {
  assertSessionConfigured();
  if (!data.name || data.name.trim().length === 0) {
    return { error: "El nombre del restaurante es obligatorio" };
  }
  if (!data.adminPin || data.adminPin.length < 4 || data.adminPin.length > 6) {
    return { error: "El PIN debe tener entre 4 y 6 dígitos" };
  }
  if (!/^\d+$/.test(data.adminPin)) {
    return { error: "El PIN debe contener solo números" };
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      name: data.name.trim(),
      adminPin: await bcrypt.hash(data.adminPin, 12),
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  await setRestaurantSession(restaurant.id);

  return { restaurant };
}

export async function verifyPin(restaurantId: string, pin: string) {
  assertSessionConfigured();
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      name: true,
      adminPin: true,
      createdAt: true,
      failedPinAttempts: true,
      lockedUntil: true,
    },
  });

  if (!restaurant) {
    return { error: "Restaurante no encontrado" };
  }

  const now = new Date();
  if (restaurant.lockedUntil && restaurant.lockedUntil > now) {
    return { error: "Acceso bloqueado temporalmente. Inténtalo de nuevo en 15 minutos." };
  }

  const isHashed = restaurant.adminPin.startsWith("$2");
  const isValid = isHashed
    ? await bcrypt.compare(pin, restaurant.adminPin)
    : restaurant.adminPin === pin;

  if (!isValid) {
    const attempts = restaurant.failedPinAttempts + 1;
    const shouldLock = attempts >= MAX_PIN_ATTEMPTS;
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        failedPinAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock
          ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000)
          : null,
      },
    });
    return {
      error: shouldLock
        ? "Demasiados intentos. Acceso bloqueado durante 15 minutos."
        : `PIN incorrecto. Quedan ${MAX_PIN_ATTEMPTS - attempts} intentos.`,
    };
  }

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      adminPin: isHashed ? undefined : await bcrypt.hash(pin, 12),
      failedPinAttempts: 0,
      lockedUntil: null,
    },
  });
  await setRestaurantSession(restaurantId);

  return {
    success: true,
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      createdAt: restaurant.createdAt,
    },
  };
}

export async function getRestaurant(id: string) {
  if (!(await checkRestaurantSession(id))) {
    return null;
  }

  return prisma.restaurant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      menus: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
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
        orderBy: { createdAt: "desc" },
      },
      events: {
        select: {
          id: true,
          name: true,
          date: true,
          guestCount: true,
          status: true,
          createdAt: true,
          menu: {
            select: {
              id: true,
              name: true,
            },
          },
          guests: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function logoutRestaurant() {
  await clearRestaurantSession();
  return { success: true };
}

export async function deleteRestaurant(restaurantId: string, confirmationName: string) {
  if (!(await checkRestaurantSession(restaurantId))) {
    return { error: "No autorizado" };
  }
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true },
  });
  if (!restaurant) return { error: "Restaurante no encontrado" };
  if (confirmationName.trim() !== restaurant.name) {
    return { error: "El nombre de confirmación no coincide" };
  }

  await prisma.$transaction(async (tx) => {
    const events = await tx.event.findMany({
      where: { restaurantId },
      select: { id: true },
    });
    const eventIds = events.map((event) => event.id);
    const guests = await tx.guest.findMany({
      where: { eventId: { in: eventIds } },
      select: { id: true },
    });
    const guestIds = guests.map((guest) => guest.id);
    await tx.selection.deleteMany({ where: { guestId: { in: guestIds } } });
    await tx.guest.deleteMany({ where: { eventId: { in: eventIds } } });
    await tx.event.deleteMany({ where: { restaurantId } });
    await tx.dish.deleteMany({ where: { course: { menu: { restaurantId } } } });
    await tx.course.deleteMany({ where: { menu: { restaurantId } } });
    await tx.menu.deleteMany({ where: { restaurantId } });
    await tx.restaurant.delete({ where: { id: restaurantId } });
  });
  await clearRestaurantSession();
  return { success: true };
}
