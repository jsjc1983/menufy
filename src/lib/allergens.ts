export interface Allergen {
  id: string;
  name: string;
  emoji: string;
}

export const EU_ALLERGENS: Allergen[] = [
  { id: "gluten", name: "Gluten", emoji: "🌾" },
  { id: "crustaceos", name: "Crustáceos", emoji: "🦐" },
  { id: "huevos", name: "Huevos", emoji: "🥚" },
  { id: "pescado", name: "Pescado", emoji: "🐟" },
  { id: "cacahuetes", name: "Cacahuetes", emoji: "🥜" },
  { id: "soja", name: "Soja", emoji: "🫘" },
  { id: "lacteos", name: "Lácteos", emoji: "🥛" },
  { id: "frutos_cascara", name: "Frutos de cáscara", emoji: "🌰" },
  { id: "apio", name: "Apio", emoji: "🥬" },
  { id: "mostaza", name: "Mostaza", emoji: "🟡" },
  { id: "sesamo", name: "Sésamo", emoji: "🔶" },
  { id: "sulfitos", name: "Sulfitos", emoji: "🍷" },
  { id: "altramuces", name: "Altramuces", emoji: "🌿" },
  { id: "moluscos", name: "Moluscos", emoji: "🦪" },
];

export function getAllergenById(id: string): Allergen | undefined {
  return EU_ALLERGENS.find((a) => a.id === id);
}

export function getAllergenNames(ids: string[]): string[] {
  return ids
    .map((id) => getAllergenById(id)?.name)
    .filter((name): name is string => !!name);
}
