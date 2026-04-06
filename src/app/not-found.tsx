import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-gray-950 px-4 py-16 text-center text-white">
      <p className="text-sm font-medium uppercase tracking-widest text-gray-500">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Página no encontrada
      </h1>
      <p className="max-w-md text-sm text-gray-400 md:text-base">
        La dirección no existe o ha cambiado.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-red-600 hover:to-orange-600"
        >
          Ir al inicio
        </Link>
        <Link
          href="/join"
          className="rounded-lg border border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-200 transition hover:border-gray-500 hover:bg-gray-900"
        >
          Entrar o registrarse
        </Link>
      </div>
    </div>
  );
}
