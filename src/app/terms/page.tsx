import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de servicio",
  description:
    "Condiciones de uso del servicio TrainerPT para entrenadores y clientes.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-200">
      <div className="container mx-auto max-w-3xl px-4 py-14 md:py-20">
        <p className="mb-6 text-sm text-gray-500">
          Última actualización: abril de 2026. Este documento es informativo;
          conviene revisarlo con asesoramiento legal antes de tráfico masivo.
        </p>
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Términos de servicio
        </h1>

        <div className="space-y-8 text-sm leading-relaxed text-gray-300 md:text-base">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">1. Objeto</h2>
            <p>
              TrainerPT pone a disposición una aplicación web para que los
              entrenadores personales organicen su actividad profesional (por
              ejemplo, clientes, rutinas y formularios) y sus clientes accedan a
              la información que el entrenador comparta. El uso del servicio
              implica la aceptación de estos términos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              2. Cuenta y uso
            </h2>
            <p>
              Debes proporcionar datos veraces al registrarte y mantener la
              confidencialidad de tus credenciales. Eres responsable de la
              actividad realizada con tu cuenta. No está permitido usar el
              servicio de forma ilícita, para vulnerar derechos de terceros ni
              para interferir con el funcionamiento de la plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              3. Contenido y relación profesional
            </h2>
            <p>
              Los entrenadores son responsables del contenido que crean o
              comparten (rutinas, formularios, mensajes) y de su relación con
              sus clientes. TrainerPT no sustituye el criterio profesional,
              médico ni legal del entrenador.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              4. Disponibilidad y cambios
            </h2>
            <p>
              Podemos modificar, suspender o interrumpir partes del servicio por
              mantenimiento, mejora o causas de fuerza mayor. Cuando sea
              razonable, procuraremos avisar con antelación.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              5. Limitación de responsabilidad
            </h2>
            <p>
              En la medida permitida por la ley aplicable, TrainerPT no será
              responsable de daños indirectos, lucro cesante o pérdida de datos
              derivados del uso del servicio. El servicio se ofrece &quot;tal
              cual&quot; y según disponibilidad.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">6. Contacto</h2>
            <p>
              Para consultas sobre estos términos:{" "}
              <a
                href="mailto:info@trainpt.com"
                className="text-red-400 underline-offset-2 hover:underline"
              >
                info@trainpt.com
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-gray-500">
          <Link href="/" className="text-gray-400 hover:text-white">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
