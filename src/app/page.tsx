import Link from "next/link";
import { ArrowRight, Dumbbell, FileText, Users, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// import { LandingPage } from "@/components/landing-page";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* <LandingPage /> */}
      <div className="fixed top-4 right-4 flex gap-2 z-20">
        <Button
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
          asChild
        >
          <Link href="/trainers">Ver Entrenadores</Link>
        </Button>
        <Button
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
          asChild
        >
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
        <Button className="bg-primary/80 backdrop-blur-sm" asChild>
          <Link href="/register">Registrarse</Link>
        </Button>
      </div>

      <main className="flex-grow container mx-auto px-4 py-12 z-10">
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Tu herramienta profesional para entrenadores
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-emerald-100 p-3 rounded-full mb-4">
                    <Dumbbell className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Crea rutinas</h3>
                  <p className="text-gray-500">
                    Diseña entrenamientos personalizados para tus clientes
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-emerald-100 p-3 rounded-full mb-4">
                    <Utensils className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Planifica dietas
                  </h3>
                  <p className="text-gray-500">
                    Crea planes nutricionales adaptados a cada objetivo
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-emerald-100 p-3 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Genera PDFs</h3>
                  <p className="text-gray-500">
                    Exporta documentos profesionales para compartir
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-emerald-100 p-3 rounded-full mb-4">
                    <Users className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Gestiona clientes
                  </h3>
                  <p className="text-gray-500">
                    Administra perfiles y seguimiento de progreso
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <div className="bg-gray-50 rounded-xl p-8">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                <h2 className="text-3xl font-bold mb-4">
                  Crea rutinas profesionales
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Diseña entrenamientos personalizados, reutilizables y fáciles
                  de compartir con tus clientes. Nuestra plataforma te permite
                  crear rutinas completas con ejercicios detallados.
                </p>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/dashboard/routines">
                    Empezar ahora <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                  <img
                    src="/placeholder.svg?height=300&width=500"
                    alt="Ejemplo de rutina"
                    className="rounded-md w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="mb-2">
                © 2025 FitCoach Pro. Todos los derechos reservados.
              </p>
              <p className="text-sm text-gray-400">
                Hecho con pasión para entrenadores y clientes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 w-full md:w-auto justify-between">
              <div className="flex flex-col">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Accesos rápidos
                </h4>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/dashboard/profile"
                    className="text-sm hover:underline"
                  >
                    Editar Perfil
                  </Link>
                  <Link
                    href="/dashboard/nutrition"
                    className="text-sm hover:underline"
                  >
                    Mis Dietas
                  </Link>
                  <Link
                    href="/dashboard/forms"
                    className="text-sm hover:underline"
                  >
                    Formularios
                  </Link>
                  <Link
                    href="/dashboard/routines"
                    className="text-sm hover:underline"
                  >
                    Rutinas
                  </Link>
                </div>
              </div>

              <div className="flex flex-col">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Legal
                </h4>

                <div className="flex flex-col gap-2">
                  <Link href="/terms" className="text-sm hover:underline">
                    Términos
                  </Link>
                  <Link href="/privacy" className="text-sm hover:underline">
                    Privacidad
                  </Link>
                  <Link href="/contact" className="text-sm hover:underline">
                    Contacto
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
