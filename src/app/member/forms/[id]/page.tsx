"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  Ruler,
  Camera,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "../../../components/forms/PhotoUpload";
import type { FormAssignment, CustomField } from "../../../lib/types/forms";
import { createSupabaseBrowser } from "../../../lib/supabase/browser";
import { uploadPhotoWithPresignedUrl } from "../../../lib/forms-upload";

export default function FillFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] = useState<FormAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const supabase = createSupabaseBrowser();

  // Form state: all values (text/number) and photos
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [photos, setPhotos] = useState<Record<string, File | null>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/assignments/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );
        if (cancelled) return;
        if (!res.ok) {
          setAssignment(null);
          return;
        }
        const data = await res.json();
        const raw = data.assignment ?? data;
        if (!raw) {
          setAssignment(null);
          return;
        }
        const rawTemplate = raw.template ?? raw;
        const schemaSource =
          rawTemplate?.customFields ??
          rawTemplate?.schema ??
          raw.schemaSnapshot;
        const fields: CustomField[] = Array.isArray(schemaSource)
          ? schemaSource.map((f: CustomField, i: number) => ({
              ...f,
              id: f.id ?? `field_${f.order ?? i}`,
              order: f.order ?? i,
            }))
          : [];
        const template = rawTemplate
          ? { ...rawTemplate, customFields: fields, schema: fields }
          : {
              name: "Formulario",
              description: "",
              customFields: fields,
              schema: fields,
            };
        setAssignment({ ...raw, template });
      } catch {
        if (!cancelled) setAssignment(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, supabase]);

  const updateValue = useCallback((fieldId: string, value: string | number) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const updatePhoto = useCallback((fieldId: string, file: File | null) => {
    setPhotos((prev) => ({ ...prev, [fieldId]: file }));
  }, []);

  // Get fields from schema
  const fields =
    assignment?.template?.schema ?? assignment?.template?.customFields ?? [];
  const numberFields = fields.filter((f) => f.type === "number");
  const photoFields = fields.filter((f) => f.type === "photo");
  const textFields = fields.filter((f) => f.type === "text");

  // Validation: all required fields must be filled
  const isFormValid = fields
    .filter((f) => f.required)
    .every((f) => {
      if (f.type === "photo") {
        return photos[f.id] != null;
      }
      const val = values[f.id];
      if (val === undefined || val === "") return false;
      if (f.type === "number") {
        const s = String(val);
        if (s.endsWith(".") || s.endsWith(",")) return false;
        const n = Number.parseFloat(s.replace(",", "."));
        return !Number.isNaN(n);
      }
      return true;
    });

  const handleSubmit = async () => {
    if (!assignment || !isFormValid) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");

      const assignmentId = assignment.id;

      // Upload photos and get S3 keys
      const photoKeys: Record<string, string> = {};
      for (const [fieldId, file] of Object.entries(photos)) {
        if (file) {
          const key = await uploadPhotoWithPresignedUrl({
            assignmentId,
            file,
            filename: fieldId,
            token,
          });
          if (!key?.trim()) {
            const field = fields.find((f) => f.id === fieldId);
            throw new Error(
              `La foto "${field?.label ?? fieldId}" no se subió correctamente. Inténtalo de nuevo.`,
            );
          }
          photoKeys[fieldId] = key;
        }
      }

      // Build answers object
      const answers: Record<string, unknown> = {};

      for (const field of fields) {
        if (field.type === "photo") {
          const key = photoKeys[field.id];
          if (key) answers[field.id] = key;
        } else if (field.type === "number") {
          const val = values[field.id];
          if (val === undefined || val === "") continue;
          const n =
            typeof val === "number"
              ? val
              : Number.parseFloat(String(val).replace(",", "."));
          answers[field.id] = Number.isNaN(n) ? val : n;
        } else {
          const val = values[field.id];
          if (val !== undefined && val !== "") {
            answers[field.id] = val;
          }
        }
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/assignments/${assignmentId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        let msg = "Error al enviar el formulario.";
        try {
          const errJson = JSON.parse(errText);
          if (errJson.message) msg = errJson.message;
        } catch {
          if (errText) msg = errText.slice(0, 200);
        }
        throw new Error(msg);
      }

      setSubmitted(true);
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Error al enviar. Inténtalo de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-red-500" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="py-20 text-center text-gray-500">
        Formulario no encontrado
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20"
        >
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </motion.div>
        <h2 className="mt-6 text-2xl font-bold text-white">
          Formulario enviado
        </h2>
        <p className="mt-2 text-gray-400 text-center max-w-sm">
          Tu información se ha enviado correctamente a tu entrenador.
        </p>
        <Button
          onClick={() => router.push("/member/forms")}
          className="mt-8 gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
        >
          Volver a formularios
        </Button>
      </motion.div>
    );
  }

  const template = assignment.template;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => router.push("/member/forms")}
          className="mt-1 rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {template?.name ?? "Formulario"}
          </h1>
          {template?.description && (
            <p className="mt-1 text-sm text-gray-400">{template.description}</p>
          )}
        </div>
      </div>

      {/* Form sections */}
      <div className="space-y-6 max-w-2xl">
        {/* Number fields (measurements) */}
        {numberFields.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Medidas
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {numberFields
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label className="text-xs text-gray-400">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="—"
                        value={
                          values[field.id] !== undefined &&
                          values[field.id] !== ""
                            ? String(values[field.id])
                            : ""
                        }
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          if (!/^\d*[.,]?\d*$/.test(raw)) return;
                          if (raw === "") {
                            updateValue(field.id, "");
                            return;
                          }
                          if (raw.endsWith(".") || raw.endsWith(",")) {
                            updateValue(field.id, raw);
                            return;
                          }
                          const n = Number.parseFloat(raw.replace(",", "."));
                          if (!Number.isNaN(n)) updateValue(field.id, n);
                        }}
                        className="h-10 rounded-xl border-gray-700 bg-gray-800 pr-12 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      {field.unit && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                          {field.unit}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Photo fields */}
        {photoFields.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Fotos
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {photoFields
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label className="text-xs text-gray-400">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </Label>
                    <PhotoUpload
                      photoType="front"
                      value={photos[field.id] ?? null}
                      onChange={(file) => updatePhoto(field.id, file)}
                    />
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Text fields */}
        {textFields.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Información adicional
              </h3>
            </div>
            <div className="space-y-4">
              {textFields
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label className="text-xs text-gray-400">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </Label>
                    <Textarea
                      value={(values[field.id] as string) ?? ""}
                      onChange={(e) => updateValue(field.id, e.target.value)}
                      placeholder={`Introduce ${field.label.toLowerCase()}...`}
                      rows={3}
                      className="rounded-xl border-gray-700 bg-gray-800 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20 resize-none"
                    />
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Submit button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || submitting}
            className="w-full h-14 gap-2 rounded-xl text-base font-semibold bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            {submitting ? "Enviando..." : "Enviar formulario"}
          </Button>
          {submitError && (
            <p className="mt-2 text-center text-sm text-red-400" role="alert">
              {submitError}
            </p>
          )}
          {!isFormValid && !submitError && (
            <p className="mt-2 text-center text-xs text-gray-500">
              Completa todos los campos obligatorios para enviar
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
