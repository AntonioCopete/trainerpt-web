"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Link as LinkIcon, Copy, Check } from "lucide-react";
import { createSupabaseBrowser } from "../lib/supabase/browser";

interface InviteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteClientDialog({
  open,
  onOpenChange,
}: InviteClientDialogProps) {
  const supabase = createSupabaseBrowser();
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setInvitationUrl(null);
    setCopied(false);

    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;

      if (!token) {
        setError("No hay sesión activa. Vuelve a iniciar sesión.");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/invites`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      );

      if (!res.ok) {
        setError("No se ha podido generar el enlace. Inténtalo de nuevo.");
        return;
      }

      const data = await res.json();
      // Se asume que la API devuelve { url: string }
      if (typeof data.url === "string") {
        setInvitationUrl(data.url);
      } else {
        setError("La API no ha devuelto un enlace válido.");
      }
    } catch {
      setError("Ha ocurrido un error al generar el enlace.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!invitationUrl) return;
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se ha podido copiar el enlace.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Invitar cliente</DialogTitle>
          <DialogDescription className="text-gray-400">
            Genera un enlace para que tu cliente acceda a su panel.
          </DialogDescription>
        </DialogHeader>

        {!invitationUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Pulsa en &quot;Generar enlace&quot; para crear una invitación
              única que podrás compartir con tu cliente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">
              Enlace de invitación
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={invitationUrl}
                className="h-10 flex-1 rounded-xl border-gray-700 bg-gray-800 text-xs text-gray-100"
              />
              <Button
                type="button"
                size="icon"
                onClick={handleCopy}
                className={`shrink-0 border border-gray-700 text-gray-200 transition-colors ${
                  copied
                    ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-gray-500">
              Este enlace se puede compartir con tu cliente para que se
              registre.
            </p>
            {copied && (
              <p className="text-[11px] text-emerald-400">
                Enlace copiado al portapapeles.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <DialogFooter className="mt-4 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            )}
            {invitationUrl ? "Regenerar enlace" : "Generar enlace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
