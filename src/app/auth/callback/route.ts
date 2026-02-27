import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const invite = url.searchParams.get("invite");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url));
  }

  const cookieStore = await cookies();
  const res = NextResponse.redirect(new URL("/onboarding", url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url),
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=no_token", url));
  }

  // Aseguramos que el usuario exista en la base de datos
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    // si falla, seguimos intentando el redeem igualmente
  }

  if (invite) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/invites/redeem`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ code: invite }),
      });
    } catch {
      // Si falla el redeem, seguimos con el flujo normal
    }
  }

  // Siempre dejamos que /onboarding decida a dónde enviar al usuario.
  return res;
}
