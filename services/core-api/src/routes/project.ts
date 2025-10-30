import { supabase } from '../../shared/supabase-client.js';
export default async function (app) {
  app.get("/insights", async (req, res) => {
    const { project } = req.query;
    const { data } = await supabase.from("project_insights").select("*").eq("project", project).order('created_at', {ascending:false}).limit(50);
    return { project, insights: data || [] };
  });
}
