"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Dumbbell, UtensilsCrossed, Users } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Clientes",
    href: "/trainer/members",
    icon: Users,
    active: true,
  },
  {
    label: "Formularios",
    href: "/trainer/forms",
    icon: ClipboardList,
    active: true,
  },
  {
    label: "Rutinas",
    href: "/trainer/routines",
    icon: Dumbbell,
    active: false,
  },
  {
    label: "Dietas",
    href: "/trainer/diets",
    icon: UtensilsCrossed,
    active: false,
  },
];

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sub-header navigation */}
      <nav className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              const isDisabled = !item.active;

              return isDisabled ? (
                <span
                  key={item.href}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-600 cursor-not-allowed"
                  title="Proximamente"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Pronto
                  </span>
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
