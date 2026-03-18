"use client";

import { Ruler, Camera, Type, Hash } from "lucide-react";
import type { CustomField } from "../../lib/types/forms";

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

  const numberFields = customFields.filter((f) => f.type === "number");
  const photoFields = customFields.filter((f) => f.type === "photo");
  const textFields = customFields.filter((f) => f.type === "text");

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
        {customFields.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-600">
            Añade campos para ver la vista previa
          </p>
        ) : (
          <>
            {/* Number fields (measurements) */}
            {numberFields.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Ruler className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Medidas
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {numberFields.map((field, index) => (
                    <div
                      key={field.id ?? `num-${index}`}
                      className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
                    >
                      <span className="text-xs text-gray-300 truncate">
                        {field.label || "Sin nombre"}
                      </span>
                      <span className="text-xs text-gray-600 shrink-0 ml-2">
                        {field.unit || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo fields */}
            {photoFields.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Fotos
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {photoFields.map((field, index) => (
                    <div
                      key={field.id ?? `photo-${index}`}
                      className="flex aspect-[3/4] max-h-24 items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-800/30"
                    >
                      <span className="text-[10px] text-gray-600 text-center px-2">
                        {field.label || "Foto"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text fields */}
            {textFields.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Type className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Campos de texto
                  </span>
                </div>
                <div className="space-y-2">
                  {textFields.map((field, index) => (
                    <div
                      key={field.id ?? `text-${index}`}
                      className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2"
                    >
                      <Type className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-xs text-gray-300 flex-1 truncate">
                        {field.label || "Sin nombre"}
                      </span>
                      {field.required && (
                        <span className="text-[10px] text-red-400">*</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
