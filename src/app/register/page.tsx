import { clientRedirectByRole, serverRedirectByRole } from "@/lib/utils";
import RegisterPageComponent from "../components/RegisterPageComponent";
import { createSupabaseServer } from "../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
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

  return <RegisterPageComponent />;
}
