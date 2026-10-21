import { randomBytes, randomUUID } from "node:crypto";

const base = "https://logd.ricecloud.workers.dev";
const email = `logd-e2e-${randomUUID()}@example.com`;
const password = randomBytes(24).toString("hex");
let cookies = "";

async function request(path, method = "GET", body, expectedStatus = 200) {
  const response = await fetch(base + path, {
    method,
    headers: {
      origin: base,
      ...(cookies ? { cookie: cookies } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const setCookies = response.headers.getSetCookie();
  if (setCookies.length) {
    cookies = setCookies.map((value) => value.split(";")[0]).join("; ");
  }
  if (response.status !== expectedStatus) {
    const value = await response.json().catch(() => null);
    const error = typeof value?.error === "object" ? value.error?.code : value?.code;
    throw new Error(`${method} ${path}: HTTP ${response.status} (expected ${expectedStatus}), code=${error ?? "unknown"}`);
  }
  return response.json().catch(() => null);
}

const signUp = await request("/api/auth/sign-up/email", "POST", {
  name: "LOGD Integration Test",
  email,
  password,
});
if (!signUp?.user?.id) throw new Error("Signup did not return a user.");
if (!cookies) throw new Error("Signup did not set a session cookie.");
console.log("PASS: signup and session cookie");

const session = await request("/api/auth/get-session");
if (session?.user?.id !== signUp.user.id) throw new Error("Session lookup failed.");
console.log("PASS: session verification");

const nutrition = {
  calories: 200, totalFatG: 6, saturatedFatG: 1, polyunsaturatedFatG: 2,
  monounsaturatedFatG: 3, transFatG: 0, cholesterolMg: 40, sodiumMg: 80,
  potassiumMg: 200, totalCarbohydratesG: 4, dietaryFiberG: 1, sugarsG: 1,
  addedSugarsG: 0, sugarAlcoholsG: 0, netCarbsG: 3, proteinG: 24,
  vitaminAPct: 2, vitaminCPct: 1, calciumPct: 3, ironPct: 6, vitaminDPct: 1,
};

const { food } = await request("/v1/foods", "POST", {
  name: "LOGD QA Chicken " + randomUUID().slice(0, 8),
  nutritionPer100g: nutrition,
}, 201);
if (!food?.id) throw new Error("Food was not saved.");
console.log("PASS: food creation");

const { meal } = await request("/v1/meals", "POST", {
  kind: "lunch",
  items: [{ foodId: food.id, gramsEaten: 150 }],
}, 201);
if (!meal?.id || meal.total.calories !== 300 || meal.total.proteinG !== 36) {
  throw new Error("Serving nutrition mismatch.");
}
console.log("PASS: meal creation and nutrition calculations");

const diary = await request("/v1/meals");
if (!diary?.meals?.some((entry) => entry.id === meal.id)) {
  throw new Error("Saved meal not found in diary.");
}
console.log("PASS: diary retrieval");

await request("/v1/meals/" + meal.id, "DELETE");
console.log("PASS: meal removal");
