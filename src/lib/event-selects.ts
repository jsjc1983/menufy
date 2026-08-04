import { Prisma } from "@prisma/client";

export const publicEventSelect = Prisma.validator<Prisma.EventSelect>()({
  id: true,
  name: true,
  date: true,
  guestCount: true,
  shareCode: true,
  status: true,
  votingDeadline: true,
  restaurant: { select: { id: true, name: true } },
  menu: {
    select: {
      id: true,
      name: true,
      courses: {
        select: { id: true, name: true, order: true, dishes: true },
        orderBy: { order: "asc" },
      },
    },
  },
});

export const organizerEventSelect = Prisma.validator<Prisma.EventSelect>()({
  id: true,
  name: true,
  date: true,
  guestCount: true,
  shareCode: true,
  status: true,
  votingDeadline: true,
  restaurant: { select: { name: true } },
  menu: {
    select: {
      name: true,
      courses: {
        select: { id: true, name: true, order: true, dishes: true },
        orderBy: { order: "asc" },
      },
    },
  },
  guests: {
    select: {
      id: true,
      name: true,
      allergens: true,
      submittedAt: true,
      selections: { select: { id: true, dish: true } },
    },
    orderBy: { submittedAt: "desc" },
  },
});
