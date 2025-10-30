import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generatePosts = async (summary, project) => {
  const prompt = `Summarize recent updates for ${project} and produce 3 Farcaster-style posts. Keep tone witty, concise, no emojis. Output JSON array of 3 strings. Summary:\n${summary}`;
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400
  }).catch(e => { console.error("openai error", e); return null; });
  if (!res) return [];
  const raw = res.choices?.[0]?.message?.content || res.choices?.[0]?.text || "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    // If model returned plain text, split by lines (fallback)
    return raw.split("\n").filter(Boolean).slice(0,3);
  } catch (e) {
    // fallback: return the raw text chunked
    return raw.split("\n").filter(Boolean).slice(0,3);
  }
};
