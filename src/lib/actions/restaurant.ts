"use server";

import { prisma } from "@/lib/db";
import { verifyRestaurantPinValue } from "@/lib/server-auth";

export async function createRestaurant(data: {
  name: string;
  adminPin: string;
}) {
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
      adminPin: data.adminPin,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  return { restaurant };
}

export async function verifyPin(restaurantId: string, pin: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      name: true,
      adminPin: true,
      createdAt: true,
    },
  });

  if (!restaurant) {
    return { error: "Restaurante no encontrado" };
  }

  if (restaurant.adminPin !== pin) {
    return { error: "PIN incorrecto" };
  }

  return {
    success: true,
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      createdAt: restaurant.createdAt,
    },
  };
}

export async function getRestaurant(id: string, adminPin?: string) {
  const isAuthorized = await verifyRestaurantPinValue(id, adminPin);
  if (!isAuthorized) {
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
