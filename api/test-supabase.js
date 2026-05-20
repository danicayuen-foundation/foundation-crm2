import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
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
