import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const allowedOrigins = new Set(
  [
    process.env.REPLIT_DEV_DOMAIN,
    process.env.REPLIT_EXPO_DEV_DOMAIN,
    process.env.EXPO_PUBLIC_DOMAIN,
  ]
    .filter(Boolean)
    .map(domain => (domain!.startsWith("http") ? domain! : `https://${domain}`)),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      const isLocalOrigin = Boolean(
        origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin),
      );

      if (!origin || allowedOrigins.has(origin) || isLocalOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
