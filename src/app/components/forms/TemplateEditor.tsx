"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { ArrowLeft, Plus, Save, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldBuilder } from "./FieldBuilder";
import { FormPreview } from "./FormPreview";
import { MeasurementFields } from "./MeasurementField";
import type { CustomField, FormTemplate } from "../../lib/types/forms";
import { PHOTO_LABELS, nextPlaceholderFieldId } from "../../lib/types/forms";
import { createSupabaseBrowser } from "../../lib/supabase/browser";
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
    (existing?.schema ?? []).filter((field) => !field.required),
  );
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        customFields: customFields.map((f) => ({
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

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Error al guardar la plantilla");
      }

      toast.success("Plantilla guardada correctamente");
      router.push("/trainer/forms");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Error al guardar la plantilla",
      );
    } finally {
      setSaving(false);
    }
  };

  const isValid = name.trim().length > 0;

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
              <Label className="text-sm text-gray-300">
                Nombre de la plantilla <span className="text-red-500">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Seguimiento Semanal"
                className="h-11 rounded-xl border-gray-700 bg-gray-800 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-300">Descripcion</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el proposito de este formulario..."
                rows={3}
                className="rounded-xl border-gray-700 bg-gray-800 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20 resize-none"
              />
            </div>
          </div>

          {/* Mandatory fields (read-only section) */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Campos obligatorios
              </h2>
              <span className="rounded-full bg-gray-800 px-2.5 py-1 text-[10px] font-medium text-gray-400">
                Incluidos siempre
              </span>
            </div>

            <MeasurementFields values={null} readOnly />

            {/* Mandatory photos indicator */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(PHOTO_LABELS).map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-800/30 px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                    <svg
                      className="h-4 w-4 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{label}</p>
                    <p className="text-[10px] text-gray-500">Obligatorio</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom fields */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Campos personalizados
              </h2>
              <span className="text-xs text-gray-500">
                {customFields.length} campo
                {customFields.length !== 1 ? "s" : ""}
              </span>
            </div>

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
                No hay campos personalizados. Agrega campos adicionales para
                recopilar mas informacion.
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
