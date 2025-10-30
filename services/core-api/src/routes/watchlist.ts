import { supabase } from "../../shared/supabase-client.js";
import { queue } from "../../shared/queue-client.js";

export default async function (app) {
  app.post("/", async (req, res) => {
    const { fid, project } = req.body;
    if (!project || !fid) return { error: "fid and project required" };
    await supabase.from("watchlists").insert({ fid, project });
    await queue.publish("scrape.requested", { project, fid });
    return { message: "Project added and scrape triggered." };
  });

  app.get("/", async (req, res) => {
    const { fid } = req.query;
    const { data } = await supabase.from("watchlists").select("*").eq("fid", fid);
    return data;
  });
}
