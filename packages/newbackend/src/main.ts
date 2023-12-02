import fastify from "fastify";
import db, { migrate } from "./drizzle/db";
import fastifyCookie from "@fastify/cookie";
import fastifySecureSession from "@fastify/secure-session";
import fastifyStatic from "@fastify/static";
import env, { isProd } from "./env";
import path from "path";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { fileURLToPath } from "url";
import appRouter, { AppRouter } from "./routers/app.router";
import { createContext } from "./trpc/context";
import fastifyPassport from "@fastify/passport";
import discordStrategy from "./auth/Discord.strategy";
import { user } from "./drizzle/schema";
import { eq } from "drizzle-orm";

const root = path.dirname(fileURLToPath(import.meta.url));

await migrate();

const server = fastify({
  maxParamLength: 5000,
});

await server.register(fastifyCookie);

await server.register(fastifySecureSession, {
  cookieName: "session",
  key: Buffer.from(env.SESSION_SECRET, "hex"),
  cookie: {
    path: "/",
    sameSite: "strict",
    secure: isProd,
    httpOnly: true,
  },
});

await server.register(fastifyPassport.initialize());
await server.register(fastifyPassport.secureSession());
await fastifyPassport.use("discord", discordStrategy);

type User = typeof user.$inferSelect;

// register a serializer that stores the user object's id in the session ...
fastifyPassport.registerUserSerializer(async (user: User, request) => user.id);

// ... and then a deserializer that will fetch that user from the database when a request with an id in the session arrives
fastifyPassport.registerUserDeserializer(async (id: string, request) => {
  const [dbUser] = await db.select().from(user).where(eq(user.id, id)).limit(1);

  if (!dbUser) {
    return null;
  }

  return dbUser;
});

await server.register(fastifyStatic, {
  root: path.join(root, "public"),
  wildcard: false,
});

await server.register(fastifyTRPCPlugin, {
  prefix: "/api/trpc",
  trpcOptions: { router: appRouter, createContext },
});

await server.get("/api/auth/discord", {
  preValidation: fastifyPassport.authenticate("discord", { authInfo: false }),
  handler: async (req, res) => {
    return res.redirect("/");
  },
});

await server.get("/api/auth/discord/callback", {
  preValidation: fastifyPassport.authenticate("discord", {
    authInfo: false,
    failureRedirect: "/login",
    successRedirect: "/",
  }),
  handler: async (req, res) => {
    return res.redirect("/");
  },
});

await server.listen({ port: env.PORT, host: "0.0.0.0" }).catch((err) => {
  console.error(err);
  process.exit(1);
});

export { type AppRouter };
