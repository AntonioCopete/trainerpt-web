"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldBuilder } from "./FieldBuilder";
import { FormPreview } from "./FormPreview";
import type { CustomField, FormTemplate } from "../../lib/types/forms";
import {
  getDefaultTemplateFields,
  nextPlaceholderFieldId,
} from "../../lib/types/forms";
import { createSupabaseBrowser } from "../../lib/supabase/browser";
import { messageFromTemplateSaveResponse } from "../../lib/routine-template-save-errors";
import { toast } from "sonner";

interface TemplateEditorProps {
  /** If provided, we're editing an existing template */
  existing?: FormTemplate;
}

export function TemplateEditor({ existing }: TemplateEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [customFields, setCustomFields] = useState<CustomField[]>(
    existing?.schema ?? getDefaultTemplateFields(),
  );
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    description?: string;
  }>({});
  const supabase = createSupabaseBrowser();

  const addField = useCallback(() => {
    const existingIds = customFields.map((f) => f.id);
    const newField: CustomField = {
      id: nextPlaceholderFieldId(existingIds),
      type: "text",
      label: "",
      required: false,
      order: customFields.length,
    };
    setCustomFields((prev) => [...prev, newField]);
  }, [customFields]);

  const updateField = useCallback((updated: CustomField) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f)),
    );
  }, []);

  const removeField = useCallback((id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleReorder = useCallback((reordered: CustomField[]) => {
    setCustomFields(reordered.map((f, i) => ({ ...f, order: i })));
  }, []);

  const handleClearAll = useCallback(() => {
    setCustomFields([]);
  }, []);

  const handleRestoreDefaults = useCallback(() => {
    setCustomFields(getDefaultTemplateFields());
  }, []);

  const handleSave = async () => {
    const nextErrors: { name?: string; description?: string } = {};
    if (!name.trim()) {
      nextErrors.name = "El nombre es obligatorio.";
    }
    if (!description.trim()) {
      nextErrors.description = "La descripción es obligatoria.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      toast.error("Revisa los campos marcados como obligatorios.");
      return;
    }
    setFormErrors({});

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        schema: customFields.map((f) => ({
          id: f.id,
          type: f.type,
          label: f.label,
          required: f.required,
          order: f.order,
          unit: f.unit,
        })),
      };

      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const url = existing
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template/${existing.id}/update`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template`;
      const method = existing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") ?? "";
      let data: unknown = {};
      if (contentType.includes("application/json")) {
        data = await res.json().catch(() => ({}));
      } else {
        const text = await res.text().catch(() => "");
        if (text) {
          try {
            data = JSON.parse(text) as unknown;
          } catch {
            data = { message: text };
          }
        }
      }

      if (!res.ok) {
        toast.error(
          messageFromTemplateSaveResponse(
            res,
            data,
            "No se pudo guardar la plantilla",
          ),
        );
        return;
      }

      toast.success("Plantilla guardada correctamente");
      router.push("/trainer/forms");
    } catch {
      toast.error("Error de red al guardar la plantilla");
    } finally {
      setSaving(false);
    }
  };

  const isValid = name.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/trainer/forms")}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {existing ? "Editar plantilla" : "Nueva plantilla"}
            </h1>
            <p className="mt-0.5 text-sm text-gray-400">
              {existing
                ? "Modifica los campos de tu plantilla"
                : "Define los campos de seguimiento para tus clientes"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2 border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            {showPreview ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showPreview ? "Ocultar" : "Vista previa"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Editor panel */}
        <div
          className={`space-y-6 ${showPreview ? "lg:col-span-3" : "lg:col-span-5"}`}
        >
          {/* Name & description */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="form-template-name"
                className="text-sm text-gray-300"
              >
                Nombre de la plantilla{" "}
                <span className="text-red-500" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="form-template-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formErrors.name)
                    setFormErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Ej: Seguimiento Semanal"
                required
                aria-invalid={Boolean(formErrors.name)}
                aria-describedby={
                  formErrors.name ? "form-template-name-error" : undefined
                }
                className={`h-11 rounded-xl border-gray-700 bg-gray-800 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20 ${
                  formErrors.name
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
              />
              {formErrors.name ? (
                <p
                  id="form-template-name-error"
                  className="text-xs text-red-400"
                  role="alert"
                >
                  {formErrors.name}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="form-template-description"
                className="text-sm text-gray-300"
              >
                Descripción{" "}
                <span className="text-red-500" aria-hidden>
                  *
                </span>
              </Label>
              <Textarea
                id="form-template-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (formErrors.description)
                    setFormErrors((prev) => ({
                      ...prev,
                      description: undefined,
                    }));
                }}
                placeholder="Describe el propósito de este formulario..."
                rows={3}
                required
                aria-invalid={Boolean(formErrors.description)}
                aria-describedby={
                  formErrors.description
                    ? "form-template-description-error"
                    : undefined
                }
                className={`rounded-xl border-gray-700 bg-gray-800 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20 resize-none ${
                  formErrors.description
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
              />
              {formErrors.description ? (
                <p
                  id="form-template-description-error"
                  className="text-xs text-red-400"
                  role="alert"
                >
                  {formErrors.description}
                </p>
              ) : null}
            </div>
          </div>

          {/* Fields */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Campos del formulario
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {customFields.length} campo
                  {customFields.length !== 1 ? "s" : ""}
                </span>
                {!existing && (
                  <>
                    {customFields.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-800 hover:text-red-400 transition-colors"
                        title="Limpiar todos los campos"
                      >
                        <Trash2 className="h-3 w-3" />
                        Limpiar
                      </button>
                    )}
                    {customFields.length === 0 && (
                      <button
                        type="button"
                        onClick={handleRestoreDefaults}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-800 hover:text-orange-400 transition-colors"
                        title="Restaurar campos predeterminados"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Predeterminados
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Arrastra para reordenar. Elimina los campos que no necesites.
            </p>

            {customFields.length > 0 ? (
              <Reorder.Group
                axis="y"
                values={customFields}
                onReorder={handleReorder}
                className="space-y-3"
              >
                <AnimatePresence mode="popLayout">
                  {customFields.map((field) => (
                    <Reorder.Item key={field.id} value={field}>
                      <FieldBuilder
                        field={field}
                        onUpdate={updateField}
                        onRemove={() => removeField(field.id)}
                      />
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            ) : (
              <p className="py-4 text-center text-sm text-gray-600">
                No hay campos. Agrega al menos un campo para tu formulario.
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addField}
              className="w-full gap-2 border-dashed border-gray-700 bg-transparent text-gray-400 hover:border-gray-600 hover:bg-gray-800/50 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Agregar campo
            </Button>
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start"
          >
            <FormPreview
              templateName={name}
              templateDescription={description}
              customFields={customFields}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
