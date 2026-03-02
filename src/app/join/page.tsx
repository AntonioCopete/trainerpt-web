import { serverRedirectByRole } from "@/lib/utils";
import RegisterPageComponent from "../components/RegisterPageComponent";
import { createSupabaseServer } from "../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getSession();
  const sp = await searchParams;
  const invitationCode = typeof sp.code === "string" ? sp.code : null;

  if (data?.session?.access_token) {
    const token = data.session.access_token;

    // 1) Nos aseguramos de que el usuario exista en la DB
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch {
      // si falla, seguimos intentando el redeem
    }

    // 2) Si viene invitación, la canjeamos
    if (invitationCode) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/invites/redeem`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({ code: invitationCode }),
        });
      } catch {
        // si falla, seguimos
      }
    }

    // 3) Volvemos a leer el usuario y redirigimos por rol actualizado
    const meRes = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (meRes.ok) {
      const me = await meRes.json();
      const role = me?.user?.role ?? me?.role;
      serverRedirectByRole(redirect, role);
    }
  }

  return <RegisterPageComponent invitationCode={invitationCode} />;
}
