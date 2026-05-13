"use server";

import { prisma } from "@/lib/db";

interface DishInput {
  name: string;
  description?: string;
  allergens: string[];
  isShared?: boolean;
  sharesFor?: number;
}

interface CourseInput {
  name: string;
  order: number;
  dishes: DishInput[];
}

export async function createMenu(data: {
  restaurantId: string;
  name: string;
  description?: string;
  courses: CourseInput[];
}) {
  if (!data.name || data.name.trim().length === 0) {
    return { error: "El nombre del menú es obligatorio" };
  }
  if (!data.courses || data.courses.length === 0) {
    return { error: "El menú debe tener al menos un tiempo" };
  }
  for (const course of data.courses) {
    if (!course.name || course.name.trim().length === 0) {
      return { error: "Todos los tiempos deben tener nombre" };
    }
    if (!course.dishes || course.dishes.length === 0) {
      return { error: `El tiempo "${course.name}" debe tener al menos un plato` };
    }
    for (const dish of course.dishes) {
      if (!dish.name || dish.name.trim().length === 0) {
        return { error: `Todos los platos del tiempo "${course.name}" deben tener nombre` };
      }
    }
  }

  const menu = await prisma.menu.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      restaurantId: data.restaurantId,
      courses: {
        create: data.courses.map((course) => ({
          name: course.name.trim(),
          order: course.order,
          dishes: {
            create: course.dishes.map((dish) => ({
              name: dish.name.trim(),
              description: dish.description?.trim() || null,
              allergens: JSON.stringify(dish.allergens),
              isShared: dish.isShared ?? false,
              sharesFor: dish.isShared && dish.sharesFor ? dish.sharesFor : null,
            })),
          },
        })),
      },
    },
    include: {
      courses: {
        include: { dishes: true },
        orderBy: { order: "asc" },
      },
    },
  });

  return { menu };
}

export async function getMenusForRestaurant(restaurantId: string) {
  return prisma.menu.findMany({
    where: { restaurantId },
    include: {
      courses: {
        include: { dishes: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
