import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      ok: false,
      error: "Missing Supabase environment variables"
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .limit(5);

  if (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }

  return res.status(200).json({
    ok: true,
    contacts: data
  });
}
