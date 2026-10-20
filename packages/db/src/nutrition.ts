import type { NutritionFacts } from "./schema.js";

export const NUTRITION_KEYS = [
  "calories",
  "totalFatG",
  "saturatedFatG",
  "polyunsaturatedFatG",
  "monounsaturatedFatG",
  "transFatG",
  "cholesterolMg",
  "sodiumMg",
  "potassiumMg",
  "totalCarbohydratesG",
  "dietaryFiberG",
  "sugarsG",
  "addedSugarsG",
  "sugarAlcoholsG",
  "netCarbsG",
  "proteinG",
  "vitaminAPct",
  "vitaminCPct",
  "calciumPct",
  "ironPct",
  "vitaminDPct"
] as const satisfies readonly (keyof NutritionFacts)[];

export const ZERO_NUTRITION: NutritionFacts = Object.fromEntries(
  NUTRITION_KEYS.map((key) => [key, 0]),
) as NutritionFacts;

export function normalizeNutrition(values: Partial<NutritionFacts>): NutritionFacts {
  return Object.fromEntries(
    NUTRITION_KEYS.map((key) => {
      const value = values[key];
      return [key, typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0];
    }),
  ) as NutritionFacts;
}

export function multiplyNutrition(per100g: NutritionFacts, grams: number): NutritionFacts {
  if (!Number.isFinite(grams) || grams < 0 || grams > 100000) {
    throw new Error("Invalid serving quantity");
  }
  return Object.fromEntries(
    NUTRITION_KEYS.map((key) => [
      key,
      Math.round((per100g[key] * grams / 100) * 100) / 100,
    ]),
  ) as NutritionFacts;
}

export function sumNutrition(values: NutritionFacts[]): NutritionFacts {
  return Object.fromEntries(
    NUTRITION_KEYS.map((key) => [
      key,
      Math.round(values.reduce((sum, item) => sum + item[key], 0) * 100) / 100,
    ]),
  ) as NutritionFacts;
}
