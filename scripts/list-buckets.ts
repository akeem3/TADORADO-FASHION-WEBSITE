// scripts/list-buckets.ts
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function list() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) console.error("Error:", error.message);
  else console.log("Available Buckets:", data.map(b => b.name));
}
list();
