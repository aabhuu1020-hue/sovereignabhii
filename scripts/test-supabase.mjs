import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
for (const line of env.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from("content_items")
  .select("id")
  .limit(1);

if (error) {
  console.log("Connection test:", error.message);
  process.exitCode = 1;
} else {
  console.log("SUPABASE DATABASE CONNECTION SUCCESS");
}
