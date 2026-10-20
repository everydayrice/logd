import { Platform } from "react-native";
import { API_BASE_URL, authClient } from "./auth-client";

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (Platform.OS !== "web") {
    const cookie = await authClient.getCookie();
    if (cookie) headers.set("Cookie", cookie);
  }
  const response = await fetch(API_BASE_URL + path, {
    ...init,
    credentials: "include",
    headers,
  });
  if (!response.ok) {
    let message = "Request failed (" + response.status + ")";
    try {
      const error = await response.json() as { error?: { code?: string; message?: string } };
      message = error.error?.message ?? error.error?.code ?? message;
    } catch { /* Response body is not JSON. */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export type MealKind = "breakfast" | "lunch" | "dinner" | "snack";
export type Nutrition = {
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
export const emptyNutrition: Nutrition = {
  calories: 0, totalFatG: 0, saturatedFatG: 0,
  polyunsaturatedFatG: 0, monounsaturatedFatG: 0, transFatG: 0,
  cholesterolMg: 0, sodiumMg: 0, potassiumMg: 0,
  totalCarbohydratesG: 0, dietaryFiberG: 0, sugarsG: 0,
  addedSugarsG: 0, sugarAlcoholsG: 0, netCarbsG: 0,
  proteinG: 0, vitaminAPct: 0, vitaminCPct: 0,
  calciumPct: 0, ironPct: 0, vitaminDPct: 0,
};
export type Food = {
  id: string; name: string; brand: string | null;
  nutritionPer100g: Nutrition;
  defaultServingGrams: string | null;
  source: "official" | "community";
};
export type Meal = {
  id: string;
  kind: MealKind;
  loggedAt: string;
  total: Nutrition;
  items: Array<{ id: string; displayName: string; gramsEaten: string; nutritionSnapshot: Nutrition }>;
};
