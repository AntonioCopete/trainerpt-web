import { redirect } from "next/navigation";
import { createSupabaseServer } from "../../lib/supabase/server";

export default async function CompleteLogin() {
  const supabase = await createSupabaseServer();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login?error=no_user");

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) redirect("/login?error=no_token");

  // Llamada al backend (Nest)
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) redirect(`/login?error=backend_${res.status}`);

  const me = await res.json();

  // Aquí decides ruta por rol
  if (me.role === "trainer") redirect("/trainer");
  if (me.role === "client") redirect("/client");
  redirect("/onboarding");
}
