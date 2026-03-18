"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LogIn } from "lucide-react";
import { createSupabaseBrowser } from "../lib/supabase/browser";

export default function Header({ isLogged }: { isLogged: boolean }) {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="fixed top-3 right-4 z-50">
      {isLogged ? (
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-900/90 px-3 py-2 text-sm font-medium text-gray-300 backdrop-blur-sm transition-colors hover:border-gray-600 hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      ) : (
        <Link
          href="/join"
          className="flex items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-900/90 px-3 py-2 text-sm font-medium text-gray-300 backdrop-blur-sm transition-colors hover:border-gray-600 hover:bg-gray-800 hover:text-white"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Iniciar sesión</span>
        </Link>
      )}
    </div>
  );
}
