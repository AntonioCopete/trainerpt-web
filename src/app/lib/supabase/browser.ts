import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowser() {
  console.log(
    "Creating Supabase browser client with URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  console.log(
    "Using Supabase anon key:",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "****" : "undefined",
  );
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
