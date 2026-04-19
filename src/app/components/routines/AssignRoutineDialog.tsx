"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import type { MemberSummary } from "@/src/app/lib/types/forms";
import type { RoutineTemplate } from "@/src/app/lib/types/routines";

interface AssignRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: RoutineTemplate | null;
  preselectedMemberId?: string;
  onAssigned?: () => void;
}

export function AssignRoutineDialog({
  open,
  onOpenChange,
  template,
  preselectedMemberId,
  onAssigned,
}: AssignRoutineDialogProps) {
  const supabase = createSupabaseBrowser();
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [memberId, setMemberId] = useState(preselectedMemberId ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.tagName === "INPUT") {
          activeElement.blur();
        }
      }, 0);
    }
  }, [open]);

  useEffect(() => {
    setMemberId(preselectedMemberId ?? "");
  }, [preselectedMemberId, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadMembers() {
      setLoadingMembers(true);
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
        if (!cancelled) {
          setMembers(data.members ?? []);
        }
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    void loadMembers();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === memberId),
    [members, memberId],
  );

  const resetForm = () => {
    setStartDate("");
    setEndDate("");
    if (!preselectedMemberId) setMemberId("");
  };

  const handleSubmit = async () => {
    if (!template) return;
    if (!memberId || !startDate || !endDate) {
      toast.error("Completa member y rango de fechas");
      return;
    }

    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/templates/${template.id}/assign`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ memberId, startDate, endDate }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message ?? "No se pudo asignar la rutina");
        return;
      }

      toast.success("Rutina asignada correctamente");
      onAssigned?.();
      onOpenChange(false);
      resetForm();
    } catch {
      toast.error("Error al asignar la rutina");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar rutina</DialogTitle>
          <DialogDescription className="text-gray-400">
            {template
              ? `Asigna "${template.name}" a un cliente con un rango de fechas`
              : "Selecciona una rutina para asignarla"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Cliente</label>
            {preselectedMemberId ? (
              <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-200">
                {selectedMember
                  ? `${selectedMember.fullName || "Sin nombre"} (${selectedMember.email})`
                  : "Member"}
              </div>
            ) : (
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                disabled={loadingMembers}
                className="h-10 w-full appearance-none rounded-lg border border-gray-700 bg-gray-800 px-3 pr-8 text-sm text-gray-100 outline-none transition-colors focus:border-red-500"
              >
                <option value="">Selecciona un cliente</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {(member.fullName || "Sin nombre") + ` (${member.email})`}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">Desde</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-gray-700 bg-gray-800 text-gray-100 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">Hasta</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-gray-700 bg-gray-800 text-gray-100 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !template}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
          >
            {submitting ? "Asignando..." : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
