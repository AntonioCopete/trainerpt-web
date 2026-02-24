"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// import { useAuth } from "@/contexts/auth-context";
// import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, UserCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { createSupabaseBrowser } from "../lib/supabase/browser";

export default function RegisterPageComponent() {
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowser();

  //   const { register } = useAuth();
  //   const { toast } = useToast();

  const handleGoogle = () => {
    setLoading(true);
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    // SignInWithGoogle()
    // Aquí iría la lógica para iniciar sesión con Google
  };

  const handleMagicLink = async (event: any) => {
    event.preventDefault();
    const email = event.target.email.value;
    // Aquí iría la lógica para enviar el magic link
    // const actionCodeSettings = {
    //   url: "http://localhost:3000/login/complete",
    //   handleCodeInApp: true,
    // };

    // Guarda el email para completar el login
    //   window.localStorage.setItem("emailForSignIn", email);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">TrainPT</h1>
          <p className="text-gray-400 mt-2">Crea tu cuenta</p>
        </div>

        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="text-white">Registro</CardTitle>
            <CardDescription className="text-gray-400">
              Completa tus datos para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogle}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FcGoogle className="h-4 w-4" />
              )}
              Continuar con Google
            </Button>
            <div className="relative my-5">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                o
              </span>
            </div>
            {/* Magic link */}
            <form className="space-y-3" onSubmit={handleMagicLink}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  required
                />
              </div>

              <Button type="submit" className="w-full gap-2">
                Enviarme magic link
              </Button>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Te mandaremos un enlace para entrar. Si no lo ves, revisa
                spam/promociones.
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-gray-400">
            ¿No tienes una cuenta? Te la crearemos al iniciar sesión
          </p>
        </div>
      </div>
    </div>
  );
}
