"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Send, User, Calendar, Repeat } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import type {
  FormTemplate,
  MemberSummary,
  RepeatCadence,
} from "../../lib/types/forms";
import { REPEAT_LABELS } from "../../lib/types/forms";
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
  const [repeat, setRepeat] = useState<RepeatCadence>("none");
  const [dueAt, setDueAt] = useState<string>("");
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
      setRepeat("none");
      setDueAt("");
    }
  }, [open, preselectedMemberId, getMembers]);

  const filteredMembers =
    members && members.length > 0
      ? members.filter(
          (m) =>
            m.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            m.email?.toLowerCase().includes(search.toLowerCase()),
        )
      : [];

  const handleSend = async () => {
    if (!template || !selectedMemberId) return;
    setSending(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;

      const payload: Record<string, unknown> = { memberId: selectedMemberId };
      if (repeat !== "none") {
        payload.repeat = repeat;
      }
      if (dueAt) {
        // Cliente: impedir seleccionar fechas pasadas.
        // Backend interpreta `YYYY-MM-DD` como fin de día en UTC.
        const [yyyy, mm, dd] = dueAt.split("-").map((v) => Number(v));
        const dueAtUtcEnd = new Date(
          Date.UTC(yyyy, mm - 1, dd, 23, 59, 59, 999),
        );
        if (dueAtUtcEnd.getTime() < Date.now()) {
          toast.error("La fecha límite no puede ser anterior a hoy");
          return;
        }

        payload.dueAt = dueAt;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template/${template.id}/assign`,
        {
          method: "POST",
          body: JSON.stringify(payload),
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
        let msg = "Error al enviar el formulario";
        if (data.message?.includes("already has a pending assignment")) {
          msg = "Este cliente ya tiene un formulario pendiente de este tipo";
        } else if (data.message) {
          msg = data.message;
        }
        toast.error(msg);
      }
    } catch {
      toast.error("Error al enviar el formulario");
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

        {/* Scheduling options */}
        <div className="space-y-4 border-t border-gray-800 pt-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-300 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha límite
            </Label>
            <Input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="h-10 rounded-xl border-gray-700 bg-gray-800 text-white focus:border-red-500 focus:ring-red-500/20"
            />
            <p className="text-xs text-gray-500">
              El cliente podrá rellenar 48h antes de la fecha límite
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-300 flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Repetición
            </Label>
            <div className="flex gap-2">
              {(Object.keys(REPEAT_LABELS) as RepeatCadence[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRepeat(key)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    repeat === key
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-gray-800 text-gray-400 border border-transparent hover:bg-gray-700"
                  }`}
                >
                  {REPEAT_LABELS[key]}
                </button>
              ))}
            </div>
            {repeat !== "none" && (
              <p className="text-xs text-gray-500">
                Se creará automáticamente un nuevo formulario cada{" "}
                {repeat === "weekly" ? "semana" : "mes"}
              </p>
            )}
          </div>
        </div>

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
