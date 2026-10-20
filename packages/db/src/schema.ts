import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Nutrition values represent the specified serving, not necessarily 100 g.
export type NutritionFacts = {
  calories: number;
  totalFatG: number;
  saturatedFatG: number;
  polyunsaturatedFatG: number;
  monounsaturatedFatG: number;
  transFatG: number;
  cholesterolMg: number;
  sodiumMg: number;
  potassiumMg: number;
  totalCarbohydratesG: number;
  dietaryFiberG: number;
  sugarsG: number;
  addedSugarsG: number;
  sugarAlcoholsG: number;
  netCarbsG: number;
  proteinG: number;
  vitaminAPct: number;
  vitaminCPct: number;
  calciumPct: number;
  ironPct: number;
  vitaminDPct: number;
};

export type Serving = { name: string; grams: number };

export const foodSource = pgEnum("food_source", ["official", "community"]);
export const mealType = pgEnum("meal_type", ["breakfast", "lunch", "dinner", "snack"]);
export const reportStatus = pgEnum("food_report_status", ["open", "resolved", "dismissed"]);

export const foods = pgTable(
  "foods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    brand: text("brand"),
    source: foodSource("source").notNull().default("community"),
    attributedTo: text("attributed_to"),
    createdByUserId: text("created_by_user_id"),
    remixedFromFoodId: uuid("remixed_from_food_id"),
    defaultServingGrams: numeric("default_serving_grams", { precision: 12, scale: 3 }),
    servings: jsonb("servings").$type<Serving[]>().notNull().default([]),
    nutritionPer100g: jsonb("nutrition_per_100g").$type<NutritionFacts>().notNull(),
    useCount: integer("use_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("foods_name_idx").on(t.name), index("foods_created_by_idx").on(t.createdByUserId)],
);

export const meals = pgTable(
  "meals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    kind: mealType("kind").notNull(),
    privatePhotoKey: text("private_photo_key"),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("meals_owner_logged_at_idx").on(t.ownerUserId, t.loggedAt)],
);

export const mealItems = pgTable(
  "meal_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mealId: uuid("meal_id").notNull().references(() => meals.id, { onDelete: "cascade" }),
    foodId: uuid("food_id").references(() => foods.id, { onDelete: "set null" }),
    displayName: text("display_name").notNull(),
    gramsEaten: numeric("grams_eaten", { precision: 12, scale: 3 }).notNull(),
    nutritionSnapshot: jsonb("nutrition_snapshot").$type<NutritionFacts>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("meal_items_meal_id_idx").on(t.mealId)],
);

export const foodReports = pgTable(
  "food_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    foodId: uuid("food_id").notNull().references(() => foods.id, { onDelete: "cascade" }),
    reporterUserId: text("reporter_user_id").notNull(),
    reason: text("reason").notNull(),
    details: text("details"),
    status: reportStatus("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("food_reports_food_id_idx").on(t.foodId)],
);
