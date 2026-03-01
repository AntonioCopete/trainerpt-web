"use client";

import { Ruler, Camera, Type, Hash } from "lucide-react";
import type { CustomField } from "../../lib/types/forms";
import {
  BASIC_LABELS,
  BASIC_UNITS,
  MANDATORY_BASICS,
  MANDATORY_MEASUREMENTS,
  MEASUREMENT_LABELS,
  PHOTO_LABELS,
} from "../../lib/types/forms";

interface FormPreviewProps {
  templateName: string;
  templateDescription: string;
  customFields: CustomField[];
}

export function FormPreview({
  templateName,
  templateDescription,
  customFields,
}: FormPreviewProps) {
  const typeIcons: Record<string, React.ElementType> = {
    text: Type,
    number: Hash,
    photo: Camera,
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-800/30 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
          Vista previa del formulario
        </p>
        <h3 className="font-semibold text-white">
          {templateName || "Sin nombre"}
        </h3>
        {templateDescription && (
          <p className="mt-1 text-sm text-gray-400">{templateDescription}</p>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Mandatory basics */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ruler className="h-3.5 w-3.5 text-red-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Datos básicos
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MANDATORY_BASICS.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
              >
                <span className="text-xs text-gray-300">
                  {BASIC_LABELS[key]}
                </span>
                <span className="text-xs text-gray-600">
                  {BASIC_UNITS[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mandatory measurements */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ruler className="h-3.5 w-3.5 text-red-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Medidas corporales
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MANDATORY_MEASUREMENTS.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
              >
                <span className="text-xs text-gray-300">
                  {MEASUREMENT_LABELS[key]}
                </span>
                <span className="text-xs text-gray-600">cm</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mandatory photos */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Camera className="h-3.5 w-3.5 text-red-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Fotos de progreso
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PHOTO_LABELS).map(([key, label]) => (
              <div
                key={key}
                className="flex aspect-[3/4] max-h-24 items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-800/30"
              >
                <span className="text-[10px] text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Custom fields */}
        {customFields.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Campos personalizados
            </span>
            <div className="space-y-2">
              {customFields.map((field, index) => {
                const Icon = typeIcons[field.type] ?? Type;
                return (
                  <div
                    key={field.id ?? `field-${field.order ?? index}`}
                    className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2"
                  >
                    <Icon className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-xs text-gray-300 flex-1 truncate">
                      {field.label || "Sin nombre"}
                    </span>
                    {field.required && (
                      <span className="text-[10px] text-red-400">*</span>
                    )}
                    <span className="text-[10px] text-gray-600 capitalize">
                      {field.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
