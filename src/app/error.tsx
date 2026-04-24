"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-gray-950 px-4 py-16 text-center text-white">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Algo salió mal
      </h1>
      <p className="max-w-md text-sm text-gray-400 md:text-base">
        Ha ocurrido un error inesperado. Puedes reintentar o volver al inicio.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-red-600 hover:to-orange-600"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-200 transition hover:border-gray-500 hover:bg-gray-900"
        >
          Ir al inicio
        </Link>
        <a
          href="mailto:pedro.ruiz@trainerpt.com"
          className="text-sm text-gray-400 underline-offset-2 hover:text-white hover:underline"
        >
          Contacto
        </a>
      </div>
    </div>
  );
}
