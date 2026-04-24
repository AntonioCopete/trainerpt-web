import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-gray-800 bg-gray-950">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md space-y-3">
            <Image
              src="/images/logo/title-black-bg-no-bg.png"
              alt="TrainerPT"
              width={1251}
              height={216}
              className="h-auto w-44"
            />
            <p className="text-sm leading-relaxed text-gray-400">
              Herramientas web para entrenadores personales y sus clientes.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:gap-x-16 sm:gap-y-6">
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Cuenta
              </h2>
              <Link
                href="/join"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                Entrar o registrarse
              </Link>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Legal
              </h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <Link href="/terms" className="transition hover:text-white">
                    Términos de servicio
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="transition hover:text-white">
                    Política de privacidad
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Contacto
              </h2>
              <a
                href="mailto:pedro.ruiz@trainerpt.com"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                pedro.ruiz@trainerpt.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-500 md:text-left">
          © {year} TrainerPT. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
