import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingPage } from "./components/LandingPage";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingPage />
      <div className="fixed top-4 right-4 flex gap-2 z-20">
        {/* <Button
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
          asChild
        >
          <Link href="/trainers">Ver Entrenadores</Link>
        </Button> */}
        <Button
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
          asChild
        >
          <Link href="/register">Iniciar Sesión</Link>
        </Button>
        {/*  <Button className="bg-primary/80 backdrop-blur-sm" asChild>
          <Link href="/register">Registrarse</Link>
        </Button> */}
      </div>
    </div>
  );
}
