"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { checkRestaurantSession } from "@/lib/server-auth";

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

  cookies().set("gruppy_restaurant_session", restaurantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });

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
  if (!checkRestaurantSession(id)) {
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
