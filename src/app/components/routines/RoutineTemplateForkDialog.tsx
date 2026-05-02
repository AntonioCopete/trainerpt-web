"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import type {
  RoutineTemplate,
  RoutineTemplateExercise,
} from "@/src/app/lib/types/routines";
import { cloneRoutineSchemaForNewTemplate } from "@/src/app/lib/routine-schema-clone";
import { messageFromTemplateSaveResponse } from "@/src/app/lib/routine-template-save-errors";

export type RoutineTemplateForkSource =
  | { kind: "template"; templateId: string }
  | { kind: "schema"; schema: RoutineTemplateExercise[] };

interface RoutineTemplateForkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  defaultDescription: string;
  source: RoutineTemplateForkSource | null;
  /** Called after a successful POST; closes this dialog beforehand. */
  onCreated: (template: RoutineTemplate) => void;
}

export function RoutineTemplateForkDialog({
  open,
  onOpenChange,
  defaultName,
  defaultDescription,
  source,
  onCreated,
}: RoutineTemplateForkDialogProps) {
  const supabase = createSupabaseBrowser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>(
    {},
  );

  useEffect(() => {
    if (!open || !source) return;
    setName(defaultName);
    setDescription(defaultDescription);
    setErrors({});
  }, [open, source, defaultName, defaultDescription]);

  const validate = (): boolean => {
    const next: { name?: string; description?: string } = {};
    if (!name.trim()) next.name = "El nombre es obligatorio.";
    if (!description.trim())
      next.description = "La descripción es obligatoria.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Revisa los campos marcados como obligatorios.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!source || !validate()) return;
    setSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) {
        toast.error("Sesión caducada. Vuelve a iniciar sesión.");
        return;
      }

      if (source.kind === "template") {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/templates/${source.templateId}/duplicate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name.trim(),
              description: description.trim(),
            }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.template) {
          toast.error(
            messageFromTemplateSaveResponse(
              res,
              data,
              "No se pudo duplicar la plantilla",
            ),
          );
          return;
        }
        toast.success("Plantilla duplicada");
        onOpenChange(false);
        onCreated(data.template as RoutineTemplate);
        return;
      }

      const schema = cloneRoutineSchemaForNewTemplate(source.schema);
      if (schema.length === 0) {
        toast.error("No hay ejercicios para guardar como plantilla");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/templates`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            schema,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.template) {
        toast.error(
          messageFromTemplateSaveResponse(
            res,
            data,
            "No se pudo crear la plantilla",
          ),
        );
        return;
      }

      let created = data.template as RoutineTemplate;
      try {
        const listRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/templates`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );
        const listData = await listRes.json().catch(() => ({}));
        const list = (listData.templates ?? []) as RoutineTemplate[];
        const hydrated = list.find((t) => t.id === created.id);
        if (hydrated) created = hydrated;
      } catch {
        /* editor works with crear inline response */
      }

      toast.success("Plantilla creada desde la rutina");
      onOpenChange(false);
      onCreated(created);
    } finally {
      setSubmitting(false);
    }
  };

  if (!source) return null;

  const title =
    source.kind === "template"
      ? "Duplicar plantilla de rutina"
      : "Guardar como plantilla";

  const descriptionHint =
    source.kind === "template"
      ? "Elige un nombre para la nueva plantilla. Los ejercicios se copiarán tal cual están en la original."
      : "Esta será una nueva plantilla en tu biblioteca, con los mismos ejercicios que la rutina asignada.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {descriptionHint}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="fork-template-name"
              className="text-xs font-medium text-gray-400"
            >
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              id="fork-template-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="Ej. Rutina torso — copia verano"
              className={`border-gray-700 bg-gray-800 text-gray-100 ${
                errors.name ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? (
              <p className="text-xs text-red-400" role="alert">
                {errors.name}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="fork-template-desc"
              className="text-xs font-medium text-gray-400"
            >
              Descripción <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="fork-template-desc"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description)
                  setErrors((p) => ({ ...p, description: undefined }));
              }}
              placeholder="Objetivo y notas de la plantilla"
              rows={4}
              className={`resize-y border-gray-700 bg-gray-800 text-gray-100 ${
                errors.description
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
              }`}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description ? (
              <p className="text-xs text-red-400" role="alert">
                {errors.description}
              </p>
            ) : null}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
          >
            {submitting ? "Creando..." : "Crear plantilla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
