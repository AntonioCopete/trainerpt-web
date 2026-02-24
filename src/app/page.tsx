import { LandingPage } from "./components/LandingPage";
import { createSupabaseServer } from "./lib/supabase/server";
import { serverRedirectByRole } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getSession();

  if (data?.session?.access_token) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
      headers: { Authorization: `Bearer ${data?.session?.access_token}` },
      cache: "no-store",
    });

    if (res.ok) {
      const me = await res.json();
      serverRedirectByRole(redirect, me?.user?.role);
    }
  }
  return (
    <div className="flex flex-col min-h-screen">
      <LandingPage />
    </div>
  );
}
