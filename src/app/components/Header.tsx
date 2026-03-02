"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createSupabaseBrowser } from "../lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function Header({ isLogged }) {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut(); // 🔐 cierra sesión en Supabase (borra cookies)
    router.refresh(); // 🔄 re-renderiza los Server Components (layout/header)
  };

  return (
    <div className="fixed top-4 right-4 flex gap-2 z-20">
      {/* <Button
      variant="outline"
      className="bg-background/80 backdrop-blur-sm"
      asChild
    >
      <Link href="/trainers">Ver Entrenadores</Link>
    </Button> */}
      {!isLogged ? (
        <>
          <Button
            variant="outline"
            className="bg-background/80 backdrop-blur-sm"
            asChild
          >
            <Link href="/join">Iniciar Sesión</Link>
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          className="bg-background/80 backdrop-blur-sm cursor-pointer"
          asChild
          onClick={handleLogout}
        >
          <div>Cerrar Sesión</div>
        </Button>
      )}
    </div>
  );
}
