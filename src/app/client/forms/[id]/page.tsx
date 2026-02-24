"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2, CheckCircle2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MeasurementFields } from "../../../components/forms/MeasurementField";
import { PhotoUpload } from "../../../components/forms/PhotoUpload";
import type {
  FormAssignment,
  MeasurementData,
  MandatoryKey,
  CustomFieldValue,
} from "../../../lib/types/forms";
import {
  MANDATORY_BASICS,
  MANDATORY_MEASUREMENTS,
} from "../../../lib/types/forms";
// import { getAssignment, submitFormResponse } from "@/lib/api/forms";

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

  // Form state
  const [measurements, setMeasurements] = useState<Partial<MeasurementData>>(
    {},
  );
  const [photoFront, setPhotoFront] = useState<File | null>(null);
  const [photoSide, setPhotoSide] = useState<File | null>(null);
  const [customValues, setCustomValues] = useState<
    Record<string, string | number>
  >({});
  const [customPhotos, setCustomPhotos] = useState<Record<string, File | null>>(
    {},
  );

  useEffect(() => {
    // getAssignment(id).then((a) => {
    //   setAssignment(a);
    //   setLoading(false);
    // });
  }, [id]);

  const updateMeasurement = useCallback((key: MandatoryKey, value: number) => {
    setMeasurements((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateCustomValue = useCallback(
    (fieldId: string, value: string | number) => {
      setCustomValues((prev) => ({ ...prev, [fieldId]: value }));
    },
    [],
  );

  // Validation
  const isMeasurementsValid = [
    ...MANDATORY_BASICS,
    ...MANDATORY_MEASUREMENTS,
  ].every(
    (key) =>
      measurements[key] !== undefined &&
      measurements[key] !== 0 &&
      !Number.isNaN(measurements[key]),
  );
  const isPhotosValid = photoFront !== null && photoSide !== null;
  const isCustomValid =
    assignment?.template.customFields
      .filter((f) => f.required)
      .every((f) => {
        if (f.type === "photo") return customPhotos[f.id] != null;
        const val = customValues[f.id];
        return val !== undefined && val !== "";
      }) ?? true;

  const isFormValid = isMeasurementsValid && isPhotosValid && isCustomValid;

  const handleSubmit = async () => {
    if (!assignment || !isFormValid) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("assignmentId", assignment.id);
      formData.append("measurements", JSON.stringify(measurements));
      if (photoFront) formData.append("photoFront", photoFront);
      if (photoSide) formData.append("photoSide", photoSide);

      const cfValues: CustomFieldValue[] = Object.entries(customValues).map(
        ([fieldId, value]) => ({ fieldId, value }),
      );
      formData.append("customFieldValues", JSON.stringify(cfValues));

      // Append custom photos
      for (const [fieldId, file] of Object.entries(customPhotos)) {
        if (file) formData.append(`custom-photo-${fieldId}`, file);
      }

      //   await submitFormResponse(formData);
      setSubmitted(true);
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

  // Success screen
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
          Tus medidas y fotos se han enviado correctamente a tu entrenador.
        </p>
        <Button
          onClick={() => router.push("/client/forms")}
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
          onClick={() => router.push("/client/forms")}
          className="mt-1 rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{template.name}</h1>
          {template.description && (
            <p className="mt-1 text-sm text-gray-400">{template.description}</p>
          )}
        </div>
      </div>

      {/* Form sections */}
      <div className="space-y-6 max-w-2xl">
        {/* Measurements */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5"
        >
          <MeasurementFields
            values={measurements}
            onChange={updateMeasurement}
          />
        </motion.div>

        {/* Photos */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Fotos de progreso
            </h3>
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
              Obligatorio
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PhotoUpload
              photoType="front"
              value={photoFront}
              onChange={setPhotoFront}
            />
            <PhotoUpload
              photoType="side"
              value={photoSide}
              onChange={setPhotoSide}
            />
          </div>
        </motion.div>

        {/* Custom fields */}
        {template.customFields.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 space-y-4"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Informacion adicional
            </h3>

            <div className="space-y-4">
              {template.customFields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label className="text-xs text-gray-400">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </Label>

                    {field.type === "text" && (
                      <Textarea
                        value={(customValues[field.id] as string) ?? ""}
                        onChange={(e) =>
                          updateCustomValue(field.id, e.target.value)
                        }
                        placeholder={`Introduce ${field.label.toLowerCase()}...`}
                        rows={3}
                        className="rounded-xl border-gray-700 bg-gray-800 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20 resize-none"
                      />
                    )}

                    {field.type === "number" && (
                      <div className="relative">
                        <Input
                          type="number"
                          step={0.1}
                          value={customValues[field.id] ?? ""}
                          onChange={(e) =>
                            updateCustomValue(
                              field.id,
                              Number.parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          className="h-10 rounded-xl border-gray-700 bg-gray-800 pr-12 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20"
                        />
                        {field.unit && (
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            {field.unit}
                          </span>
                        )}
                      </div>
                    )}

                    {field.type === "select" && (
                      <Select
                        value={(customValues[field.id] as string) ?? ""}
                        onValueChange={(v) => updateCustomValue(field.id, v)}
                      >
                        <SelectTrigger className="h-10 rounded-xl border-gray-700 bg-gray-800 text-white">
                          <SelectValue placeholder="Selecciona una opcion..." />
                        </SelectTrigger>
                        <SelectContent className="border-gray-800 bg-gray-900 text-gray-300">
                          {(field.options ?? []).map((opt) => (
                            <SelectItem
                              key={opt.id}
                              value={opt.label}
                              className="focus:bg-gray-800 focus:text-white"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === "photo" && (
                      <PhotoUpload
                        photoType="front"
                        value={customPhotos[field.id] ?? null}
                        onChange={(file) =>
                          setCustomPhotos((prev) => ({
                            ...prev,
                            [field.id]: file,
                          }))
                        }
                      />
                    )}
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
          {!isFormValid && (
            <p className="mt-2 text-center text-xs text-gray-500">
              Completa todos los campos obligatorios para enviar
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
