"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Send, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FormTemplate, MemberSummary } from "../../lib/types/forms";
import { createSupabaseBrowser } from "../../lib/supabase/browser";
import { toast } from "sonner";

interface SendFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FormTemplate | null;
  onSent?: () => void;
  /** Si se pasa, el cliente queda fijo y no se muestra el selector de cliente */
  preselectedMemberId?: string | null;
}

export function SendFormDialog({
  open,
  onOpenChange,
  template,
  onSent,
  preselectedMemberId = null,
}: SendFormDialogProps) {
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const supabase = createSupabaseBrowser();

  const getMembers = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const data = await res.json();
      console;
      setMembers(data.members ?? []);
    } catch {
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      getMembers();
      setSearch("");
      setSelectedMemberId(preselectedMemberId ?? null);
    }
  }, [open, preselectedMemberId]);

  const filteredMembers =
    members && members.length > 0
      ? members.filter(
          (m) =>
            m.fullName.toLowerCase().includes(search.toLowerCase()) ||
            m.fullName.toLowerCase().includes(search.toLowerCase()),
        )
      : [];

  const handleSend = async () => {
    if (!template || !selectedMemberId) return;
    setSending(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template/${template.id}/assign`,
        {
          method: "POST",
          body: JSON.stringify({ memberId: selectedMemberId }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );
      const data = await res.json();
      if (res.ok && data.assignment) {
        toast.success("Formulario enviado correctamente");
        onSent?.();
        onOpenChange(false);
      } else {
        toast.error("Error al enviar el formulario");
      }
      // onSent?.();
      // onOpenChange(false);
    } catch {
      // Error handling would go here
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Enviar formulario</DialogTitle>
          <DialogDescription className="text-gray-400">
            {template
              ? preselectedMemberId
                ? `Enviar "${template.name}" a este cliente`
                : `Enviar "${template.name}" a un cliente`
              : "Selecciona un cliente"}
          </DialogDescription>
        </DialogHeader>

        {preselectedMemberId ? (
          <div className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-700">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">
                {members.find((m) => m.id === preselectedMemberId)?.fullName ??
                  "Cliente"}
              </p>
              <p className="truncate text-xs text-gray-500">
                {members.find((m) => m.id === preselectedMemberId)?.email ?? ""}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="h-10 rounded-xl border-gray-700 bg-gray-800 pl-10 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
            <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
              {filteredMembers?.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  No se encontraron clientes
                </p>
              ) : (
                filteredMembers?.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      selectedMemberId === member.id
                        ? "bg-red-500/10 border border-red-500/30"
                        : "hover:bg-gray-800 border border-transparent"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {member.fullName}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {member.email}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {preselectedMemberId && !template && (
          <p className="text-sm text-gray-500">
            Elige una plantilla desde Formularios y envía a este cliente, o usa
            el botón desde una plantilla.
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedMemberId || !template || sending}
            className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
