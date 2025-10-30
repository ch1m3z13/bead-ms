import Fastify from "fastify";
import dotenv from "dotenv";
import scrapeRoutes from "./routes/scrape.js";
dotenv.config();
const app = Fastify({ logger: true });
app.register(scrapeRoutes, { prefix: "/scrape" });
const port = process.env.SCRAPER_PORT || 4100;
app.listen({ port: Number(port), host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log("Scraper service running on port", port);
});
