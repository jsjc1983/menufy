import { prisma } from "@/lib/db";

export async function verifyRestaurantPinValue(
  restaurantId: string,
  pin: string | undefined
) {
  if (!restaurantId || !pin || !/^\d{4,6}$/.test(pin)) {
    return false;
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { adminPin: true },
  });

  return restaurant?.adminPin === pin;
}
