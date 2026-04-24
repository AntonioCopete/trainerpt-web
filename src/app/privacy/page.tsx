import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Información sobre el tratamiento de datos personales en TrainerPT.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-200">
      <div className="container mx-auto max-w-3xl px-4 py-14 md:py-20">
        <p className="mb-6 text-sm text-gray-500">
          Última actualización: abril de 2026. Documento base para MVP; revisión
          jurídica recomendable antes de escala o público amplio.
        </p>
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Política de privacidad
        </h1>

        <div className="space-y-8 text-sm leading-relaxed text-gray-300 md:text-base">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              1. Responsable del tratamiento
            </h2>
            <p>
              TrainerPT (según la entidad que opere el servicio) es responsable
              del tratamiento de los datos personales recogidos a través de la
              aplicación. Contacto:{" "}
              <a
                href="mailto:pedro.ruiz@trainerpt.com"
                className="text-red-400 underline-offset-2 hover:underline"
              >
                pedro.ruiz@trainerpt.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              2. Datos que tratamos
            </h2>
            <p>
              Tratamos, entre otros, datos identificativos y de contacto
              asociados a la cuenta (por ejemplo, correo electrónico), datos
              necesarios para prestar el servicio (perfiles de entrenador y
              cliente, rutinas, respuestas a formularios que el entrenador
              configure) y datos técnicos habituales (logs, dirección IP,
              identificadores de sesión) para seguridad y funcionamiento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              3. Finalidad y base legal
            </h2>
            <p>
              Los datos se tratan para gestionar el registro y la cuenta,
              prestar la plataforma, mantener la seguridad, cumplir obligaciones
              legales cuando proceda y, en su caso, gestionar la relación
              contractual (planes de suscripción). La base puede ser la
              ejecución del contrato, el interés legítimo o el consentimiento,
              según cada tratamiento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              4. Encargados y subencargados
            </h2>
            <p>
              Utilizamos proveedores para alojamiento, autenticación y
              infraestructura. En particular, la autenticación y parte del
              almacenamiento pueden prestarse a través de{" "}
              <strong className="text-gray-200">Supabase</strong> y servidores
              propios o de terceros que actúen como encargados del tratamiento,
              con las garantías contractuales aplicables.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              5. Conservación
            </h2>
            <p>
              Conservamos los datos el tiempo necesario para las finalidades
              indicadas y para cumplir obligaciones legales. Tras la baja de la
              cuenta, podrán aplicarse plazos de bloqueo o eliminación según la
              normativa.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">6. Derechos</h2>
            <p>
              Puedes ejercer los derechos de acceso, rectificación, supresión,
              oposición, limitación y portabilidad cuando correspondan, así como
              retirar el consentimiento, dirigiéndote a la dirección de contacto
              indicada. También puedes reclamar ante la autoridad de protección
              de datos de tu país.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              7. Cookies y analítica
            </h2>
            <p>
              Utilizamos cookies o almacenamiento local necesarios para la
              sesión y el funcionamiento seguro del servicio. Si en el futuro se
              incorporan herramientas de analítica (por ejemplo Google
              Analytics), actualizaremos esta política y, si es obligatorio, el
              mecanismo de consentimiento.
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
