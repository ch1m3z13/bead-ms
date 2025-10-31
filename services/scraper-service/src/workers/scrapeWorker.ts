import { twitterClient } from "../lib/twitter.js";
import { supabase } from "../../shared/supabase.js";
import { queue } from "../../shared/queue.js";

export default async function (app) {
  app.post("/", async (req, res) => {
    const { project } = req.body;
    if (!project) return { error: "project required" };
    // Basic search: fetch recent tweets from the handle (max 10)
    const tweets = await twitterClient.v2.search(`from:${project}`, { max_results: 10 }).catch(e => {
      console.error("twitter error", e);
      return { data: [] };
    });
    const data = tweets.data || [];
    // store simplified insights
    const rows = data.map(t => ({ project, text: t.text, created_at: t.created_at || new Date().toISOString() }));
    await supabase.from("project_insights").insert(rows).catch(e => console.error("supabase insert", e));
    await queue.publish("insight.new", { project, data: rows });
    return { message: "Scrape complete", count: rows.length };
  });

  app.get("/health", async () => ({ status: "ok", service: "scraper" }));
}
