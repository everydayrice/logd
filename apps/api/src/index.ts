import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { and, desc, eq, ilike, inArray, sql as drizzleSql } from "drizzle-orm";
import { foods, foodReports, mealItems, meals, type NutritionFacts } from "@logd/db/schema";
import { multiplyNutrition, normalizeNutrition, sumNutrition } from "@logd/db/nutrition";
import { z } from "zod";
import { getAuth } from "./auth";
import { getDb, type Bindings } from "./db";
import { newFoodSchema, newMealSchema, reportSchema } from "./validators";

type AppEnv = { Bindings: Bindings; Variables: { userId: string } };
const api = new Hono<AppEnv>();

api.use("*", secureHeaders());
api.use("*", cors({
  origin: (origin, c) => {
    const allowed = [
      "http://localhost:8081",
      "http://localhost:19006",
      ...(c.env.ALLOWED_WEB_ORIGINS ?? "").split(",").map((x: string) => x.trim()).filter(Boolean),
    ];
    return allowed.includes(origin) ? origin : "";
  },
  allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 3600,
}));

api.get("/", (c) => c.json({ name: "LOGD API", status: "online", version: "v1" }));
api.get("/health", (c) => c.json({ ok: true, service: "logd-api", version: "0.2.0" }));

api.all("/api/auth/*", (c) => {
  if (!c.env.DATABASE_URL || !c.env.BETTER_AUTH_SECRET) {
    return c.json({ error: { code: "SERVICE_NOT_CONFIGURED" } }, 503);
  }
  return getAuth(c.env).handler(c.req.raw);
});

api.use("/v1/*", async (c, next) => {
  if (!c.env.DATABASE_URL || !c.env.BETTER_AUTH_SECRET) {
    return c.json({ error: { code: "SERVICE_NOT_CONFIGURED" } }, 503);
  }
  const currentSession = await getAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });
  if (!currentSession?.user?.id) {
    return c.json({ error: { code: "UNAUTHORIZED" } }, 401);
  }
  c.set("userId", currentSession.user.id);
  await next();
});

api.get("/v1/me", async (c) => {
  const result = await getAuth(c.env).api.getSession({ headers: c.req.raw.headers });
  return c.json({ user: result?.user ?? null });
});

api.get("/v1/foods", async (c) => {
  const q = (c.req.query("q") ?? "").trim().slice(0, 100);
  const db = getDb(c.env);
  const results = q
    ? await db.select().from(foods).where(ilike(foods.name, `%${q}%`)).limit(30)
    : await db.select().from(foods).orderBy(desc(foods.useCount)).limit(30);
  return c.json({ foods: results });
});

api.get("/v1/foods/:id", async (c) => {
  const id = z.uuid().safeParse(c.req.param("id"));
  if (!id.success) return c.json({ error: { code: "INVALID_FOOD_ID" } }, 400);
  const [food] = await getDb(c.env).select().from(foods).where(eq(foods.id, id.data)).limit(1);
  return food ? c.json({ food }) : c.json({ error: { code: "NOT_FOUND" } }, 404);
});

api.post("/v1/foods", async (c) => {
  const parsed = newFoodSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { code: "INVALID_FOOD", details: parsed.error.flatten() } }, 400);
  const db = getDb(c.env);
  if (parsed.data.remixedFromFoodId) {
    const [parent] = await db.select({ id: foods.id }).from(foods)
      .where(eq(foods.id, parsed.data.remixedFromFoodId)).limit(1);
    if (!parent) return c.json({ error: { code: "REMIX_SOURCE_NOT_FOUND" } }, 404);
  }
  const [created] = await db.insert(foods).values({
    name: parsed.data.name,
    brand: parsed.data.brand ?? null,
    nutritionPer100g: parsed.data.nutritionPer100g,
    defaultServingGrams: parsed.data.defaultServingGrams?.toString() ?? null,
    servings: parsed.data.servings,
    remixedFromFoodId: parsed.data.remixedFromFoodId ?? null,
    createdByUserId: c.get("userId"),
    source: "community",
  }).returning();
  return c.json({ food: created }, 201);
});

api.post("/v1/foods/:id/reports", async (c) => {
  const id = z.uuid().safeParse(c.req.param("id"));
  const parsed = reportSchema.safeParse(await c.req.json().catch(() => null));
  if (!id.success || !parsed.success) return c.json({ error: { code: "INVALID_REPORT" } }, 400);
  const db = getDb(c.env);
  const [food] = await db.select({ id: foods.id }).from(foods).where(eq(foods.id, id.data)).limit(1);
  if (!food) return c.json({ error: { code: "NOT_FOUND" } }, 404);
  const [report] = await db.insert(foodReports).values({
    foodId: id.data,
    reporterUserId: c.get("userId"),
    reason: parsed.data.reason,
    details: parsed.data.details,
  }).returning({ id: foodReports.id, status: foodReports.status });
  return c.json({ report }, 201);
});

api.get("/v1/meals", async (c) => {
  const db = getDb(c.env);
  const list = await db.select().from(meals)
    .where(eq(meals.ownerUserId, c.get("userId")))
    .orderBy(desc(meals.loggedAt)).limit(60);
  if (!list.length) return c.json({ meals: [] });
  const items = await db.select().from(mealItems).where(inArray(mealItems.mealId, list.map(m => m.id)));
  return c.json({
    meals: list.map(meal => {
      const mealFoods = items.filter(i => i.mealId === meal.id);
      return {
        ...meal,
        items: mealFoods,
        total: sumNutrition(mealFoods.map(i => i.nutritionSnapshot)),
      };
    }),
  });
});

api.post("/v1/meals", async (c) => {
  const parsed = newMealSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { code: "INVALID_MEAL", details: parsed.error.flatten() } }, 400);
  const db = getDb(c.env);
  const distinctIds = [...new Set(parsed.data.items.map(i => i.foodId))];
  const matched = await db.select().from(foods).where(inArray(foods.id, distinctIds));
  if (matched.length !== distinctIds.length) return c.json({ error: { code: "UNKNOWN_FOOD" } }, 400);
  const byId = new Map(matched.map(food => [food.id, food]));
  const values = parsed.data.items.map(item => {
    const food = byId.get(item.foodId)!;
    return {
      foodId: food.id,
      displayName: food.name,
      gramsEaten: item.gramsEaten.toString(),
      nutritionSnapshot: multiplyNutrition(food.nutritionPer100g, item.gramsEaten),
    };
  });

  const [meal] = await db.insert(meals).values({
    ownerUserId: c.get("userId"),
    kind: parsed.data.kind,
    ...(parsed.data.loggedAt ? { loggedAt: new Date(parsed.data.loggedAt) } : {}),
  }).returning();

  let inserted: typeof mealItems.$inferSelect[];
  try {
    inserted = await db.insert(mealItems).values(values.map(v => ({ ...v, mealId: meal.id }))).returning();
  } catch (error) {
    await db.delete(meals).where(and(eq(meals.id, meal.id), eq(meals.ownerUserId, c.get("userId"))));
    throw error;
  }
  await Promise.all(distinctIds.map(id => db.update(foods)
    .set({ useCount: drizzleSql`${foods.useCount} + 1` })
    .where(eq(foods.id, id))));
  return c.json({
    meal: { ...meal, items: inserted, total: sumNutrition(inserted.map(i => i.nutritionSnapshot)) },
  }, 201);
});

api.delete("/v1/meals/:id", async (c) => {
  const id = z.uuid().safeParse(c.req.param("id"));
  if (!id.success) return c.json({ error: { code: "INVALID_MEAL_ID" } }, 400);
  const deleted = await getDb(c.env).delete(meals)
    .where(and(eq(meals.id, id.data), eq(meals.ownerUserId, c.get("userId"))))
    .returning({ id: meals.id });
  return deleted.length
    ? c.json({ deleted: true })
    : c.json({ error: { code: "NOT_FOUND" } }, 404);
});

const aiFood = z.object({
  name: z.string().min(1).max(140),
  grams: z.number().finite().positive().max(10000),
  nutritionPer100g: z.record(z.string(), z.number().finite()).default({}),
  confidence: z.enum(["low", "medium", "high"]).default("low"),
});
const aiResult = z.object({ foods: z.array(aiFood).min(1).max(20) });

api.post("/v1/analyze", async (c) => {
  if (!c.env.OPENAI_API_KEY) {
    return c.json({ error: { code: "AI_NOT_CONFIGURED", message: "Vision analysis is not yet enabled." } }, 503);
  }
  const type = c.req.header("content-type") ?? "";
  if (!type.includes("multipart/form-data")) return c.json({ error: { code: "IMAGE_REQUIRED" } }, 400);
  const length = Number(c.req.header("content-length") ?? "0");
  if (length > 9_000_000) return c.json({ error: { code: "IMAGE_TOO_LARGE" } }, 413);
  const body = await c.req.formData();
  const file = body.get("photo");
  if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return c.json({ error: { code: "UNSUPPORTED_IMAGE" } }, 400);
  }
  if (file.size > 8_000_000) return c.json({ error: { code: "IMAGE_TOO_LARGE" } }, 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
  }
  const input = `data:${file.type};base64,${btoa(binary)}`;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Estimate edible foods separately from meal photos. Respond ONLY in a JSON object with a foods array. Each food needs name, estimated grams, confidence (low/medium/high), and nutritionPer100g containing any known numeric nutrition fields in camelCase. Include calories,totalFatG,saturatedFatG,polyunsaturatedFatG,monounsaturatedFatG,transFatG,cholesterolMg,sodiumMg,potassiumMg,totalCarbohydratesG,dietaryFiberG,sugarsG,addedSugarsG,sugarAlcoholsG,netCarbsG,proteinG,vitaminAPct,vitaminCPct,calciumPct,ironPct,vitaminDPct where reasonably estimated; do not fabricate certainty. Explicitly separate rice, proteins, vegetables and sauces when visible. Nutrition is estimated per 100 grams, never for the full serving. Return a JSON object even if uncertain.",
        },
        { role: "user", content: [
          { type: "text", text: "Identify the visible edible foods, estimate grams eaten, and return per-100g nutrition estimates for each. Use portion clues if available. These are estimates that the user will review." },
          { type: "image_url", image_url: { url: input, detail: "high" } },
        ] },
      ],
    }),
  });
  if (!response.ok) {
    return c.json({ error: { code: "ANALYSIS_FAILED", message: "Photo analysis failed. Please try again." } }, 502);
  }
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  let json: unknown;
  try { json = JSON.parse(payload.choices?.[0]?.message?.content ?? ""); }
  catch { return c.json({ error: { code: "INVALID_AI_RESPONSE" } }, 502); }
  const parsed = aiResult.safeParse(json);
  if (!parsed.success) return c.json({ error: { code: "INVALID_AI_RESPONSE" } }, 502);
  return c.json({
    foods: parsed.data.foods.map(food => ({
      name: food.name,
      grams: Math.round(food.grams),
      confidence: food.confidence,
      nutritionPer100g: normalizeNutrition(food.nutritionPer100g as Partial<NutritionFacts>),
    })),
    notice: "AI estimates may be inaccurate. Review foods, portion sizes and nutrition before saving.",
  });
});

api.notFound((c) => c.json({ error: { code: "NOT_FOUND" } }, 404));
api.onError((error, c) => {
  console.error("LOGD API request failed", error.name);
  return c.json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong." } }, 500);
});
export default api;
