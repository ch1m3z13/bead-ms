import Fastify from "fastify";
import dotenv from "dotenv";
import { registerRoutes } from "./routes/index.js";
dotenv.config();

const app = Fastify({ logger: true });
registerRoutes(app);

const port = process.env.CORE_API_PORT || 4000;
app.listen({ port: Number(port), host: "0.0.0.0" }, (err, addr) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log("Core API running on", addr);
});
