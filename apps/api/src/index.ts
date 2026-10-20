import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";

const api = new Hono();

api.use("*", secureHeaders());

api.get("/", (c) =>
  c.json({
    name: "LOGD API",
    status: "online",
    version: "v1",
  }),
);

api.get("/health", (c) =>
  c.json({
    ok: true,
    service: "logd-api",
    version: "0.1.0",
  }),
);

api.notFound((c) =>
  c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: "This LOGD API endpoint does not exist.",
      },
    },
    404,
  ),
);

export default api;
