import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({
        ok: false,
        error: "Missing Supabase environment variables",
        hasUrl: Boolean(supabaseUrl),
        hasKey: Boolean(supabaseKey)
      });
    }

    const client = createClient(supabaseUrl.trim(), supabaseKey.trim());

    const result = await client
      .from("contacts")
      .select("*")
      .limit(5);

    if (result.error) {
      return res.status(200).json({
        ok: false,
        error: result.error.message,
        urlPreview: supabaseUrl.slice(0, 30)
      });
    }

    return res.status(200).json({
      ok: true,
      contacts: result.data,
      urlPreview: supabaseUrl.slice(0, 30)
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      error: error.message,
      urlPreview: process.env.VITE_SUPABASE_URL
        ? process.env.VITE_SUPABASE_URL.slice(0, 30)
        : "missing"
    });
  }
}
