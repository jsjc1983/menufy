"use server";

import { prisma } from "@/lib/db";

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
  });

  return { restaurant };
}

export async function verifyPin(restaurantId: string, pin: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    return { error: "Restaurante no encontrado" };
  }

  if (restaurant.adminPin !== pin) {
    return { error: "PIN incorrecto" };
  }

  return { success: true, restaurant };
}

export async function getRestaurant(id: string) {
  return prisma.restaurant.findUnique({
    where: { id },
    include: {
      menus: {
        include: { courses: { include: { dishes: true }, orderBy: { order: "asc" } } },
        orderBy: { createdAt: "desc" },
      },
      events: {
        include: { menu: true, guests: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
