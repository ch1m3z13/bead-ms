import watchlistRoutes from "./watchlist.js";
import projectRoutes from "./project.js";

export const registerRoutes = (app) => {
  app.get("/", async () => ({ status: "ok", service: "core-api" }));
  app.register(watchlistRoutes, { prefix: "/watchlist" });
  app.register(projectRoutes, { prefix: "/project" });
};
