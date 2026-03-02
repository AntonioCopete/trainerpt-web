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

  if (!res.ok) {
    return redirect("/join?error=me_failed");
  }

  const me = await res.json();
  const user = me?.user ?? me;
  const role = user?.role as string | undefined;
  const fullName = user?.fullName as string | undefined;

  // Si ya tiene nombre (perfil completo), redirigimos directamente por rol.
  if (fullName && role) {
    serverRedirectByRole(redirect, role);
  }

  return (
    <OnboardingPageComponent
      initialRole={role ?? null}
      initialFullName={fullName ?? ""}
    />
  );
}
