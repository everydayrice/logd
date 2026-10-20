import { z } from "zod";
import { NUTRITION_KEYS } from "@logd/db/nutrition";
import type { NutritionFacts } from "@logd/db/schema";

const boundedNumber = z.number().finite().min(0).max(100000);

export const nutritionSchema: z.ZodType<NutritionFacts> = z.object(
  Object.fromEntries(NUTRITION_KEYS.map((key) => [key, boundedNumber])),
) as z.ZodType<NutritionFacts>;

export const newFoodSchema = z.object({
  name: z.string().trim().min(1).max(140),
  brand: z.string().trim().max(100).nullish(),
  nutritionPer100g: nutritionSchema,
  defaultServingGrams: z.number().finite().positive().max(10000).optional(),
  servings: z.array(z.object({
    name: z.string().trim().min(1).max(70),
    grams: z.number().finite().positive().max(10000),
  })).max(20).default([]),
  remixedFromFoodId: z.uuid().optional(),
});

export const newMealSchema = z.object({
  kind: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  loggedAt: z.iso.datetime({ offset: true }).optional(),
  items: z.array(z.object({
    foodId: z.uuid(),
    gramsEaten: z.number().finite().positive().max(10000),
  })).min(1).max(30),
});

export const reportSchema = z.object({
  reason: z.enum(["incorrect_nutrition", "outdated", "duplicate", "other"]),
  details: z.string().trim().max(1500).optional(),
});
