"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (process.env.NODE_ENV === "development") {
    console.error(error);
  }

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 px-4 text-center text-white antialiased">
        <h1 className="text-xl font-semibold">Error en la aplicación</h1>
        <p className="max-w-sm text-sm text-gray-400">
          Vuelve a cargar la página. Si el problema continúa, contacta con
          soporte.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
