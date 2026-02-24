import { serverRedirectByRole } from "@/lib/utils";
import OnboardingPageComponent from "../components/OnboardingPageComponent";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "../lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getSession();

  if (!data?.session?.access_token) {
    return redirect("/");
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
    headers: { Authorization: `Bearer ${data?.session?.access_token}` },
    cache: "no-store",
  });

  if (res.ok) {
    const me = await res.json();

    if (me?.user?.role) serverRedirectByRole(redirect, me?.user?.role);
  }

  return <OnboardingPageComponent />;
}
