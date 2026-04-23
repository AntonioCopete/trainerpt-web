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
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { createSupabaseBrowser } from "../lib/supabase/browser";

interface RegisterPageComponentProps {
  invitationCode?: string | null;
}

export default function RegisterPageComponent({
  invitationCode,
}: RegisterPageComponentProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);
  const supabase = createSupabaseBrowser();

  //   const { register } = useAuth();
  //   const { toast } = useToast();

  const handleGoogle = () => {
    setGoogleLoading(true);
    const inviteParam = invitationCode
      ? `?invite=${encodeURIComponent(invitationCode)}`
      : "";
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback${inviteParam}`,
      },
    });
    // SignInWithGoogle()
    // Aquí iría la lógica para iniciar sesión con Google
  };

  const handleMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) return;

    setMagicLoading(true);
    setMagicSent(false);
    setMagicError(null);

    try {
      const inviteParam = invitationCode
        ? `?invite=${encodeURIComponent(invitationCode)}`
        : "";

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback${inviteParam}`,
        },
      });

      if (error) {
        setMagicError(error.message);
        return;
      }

      setMagicSent(true);
    } catch (err) {
      setMagicError("No hemos podido enviar el enlace. Inténtalo de nuevo.");
    } finally {
      setMagicLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Image
            src="/images/logo/logo-black-bg.jpeg"
            alt="TrainerPT"
            width={272}
            height={201}
            className="mx-auto h-auto w-48 sm:w-56"
            priority
          />
          <p className="text-white-400 mt-2">Crea tu cuenta</p>
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
              disabled={googleLoading}
            >
              {googleLoading ? (
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
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={magicLoading}
              >
                {magicLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Enviarme magic link
              </Button>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Te mandaremos un enlace para entrar. Si no lo ves, revisa
                spam/promociones.
              </p>

              {magicSent && !magicError && (
                <p className="text-xs text-emerald-400">
                  Enlace enviado. Revisa tu correo para continuar.
                </p>
              )}

              {magicError && (
                <p className="text-xs text-red-400">{magicError}</p>
              )}
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
