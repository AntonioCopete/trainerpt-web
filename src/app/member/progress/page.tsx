"use client";

import { TrendingUp } from "lucide-react";
import { MemberProgressPanel } from "@/src/app/components/forms/MemberProgressPanel";

export default function MemberProgressPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
          <TrendingUp className="h-7 w-7 text-emerald-400" />
          Tu progreso
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Evolución de medidas y fotos de los formularios que ya completaste.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <MemberProgressPanel />
      </div>
    </div>
  );
}
