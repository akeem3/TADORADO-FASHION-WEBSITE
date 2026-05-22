// scripts/check-bucket.ts
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  const { data, error } = await supabase.storage.getBucket('tadorado-assets');
  if (error) {
    console.error("❌ Bucket 'tadorado-assets' not found or not accessible:", error.message);
    console.log("Please ensure you have created the bucket and set it to 'Public' in the Supabase Dashboard.");
  } else {
    console.log("✅ Bucket 'tadorado-assets' is ready!", data);
  }
}
check();
