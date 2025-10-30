import { queue } from "../lib/queue.js";
import { generatePosts } from "../lib/llm.js";
import { supabase } from "../../shared/supabase.js";

queue.subscribe("insight.new", async (payload) => {
  try {
    const { project, data } = payload;
    const summary = (data || []).map(t => t.text).slice(0, 10).join("\n");
    const posts = await generatePosts(summary, project);
    if (Array.isArray(posts) && posts.length) {
      const rows = posts.map((p, i) => ({ project, text: p, rank: i+1, created_at: new Date().toISOString() }));
      await supabase.from("generated_posts").insert(rows).catch(e => console.error("supabase insert", e));
      await queue.publish("post.generated", { project, count: rows.length });
      console.log(`Generated ${rows.length} posts for ${project}`);
    } else {
      console.log("No posts generated for", project);
    }
  } catch (e) {
    console.error("worker error", e);
  }
});
