"use client";

import { Calendar, User, Ruler, Camera, Type } from "lucide-react";
import type { CustomField } from "../../lib/types/forms";
import { PhotoUpload } from "./PhotoUpload";

interface ResponseViewerProps {
  clientName: string;
  submittedAt: string;
  /** Schema fields from the template */
  fields: CustomField[];
  /** Field values (from answers) - fieldId -> value */
  values: Record<string, string | number>;
  /** Photo URLs (presigned) - fieldId -> url */
  photoUrls: Record<string, string>;
}

export function ResponseViewer({
  clientName,
  submittedAt,
  fields,
  values,
  photoUrls,
}: ResponseViewerProps) {
  const date =
    submittedAt && !Number.isNaN(new Date(submittedAt).getTime())
      ? new Date(submittedAt).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const numberFields = fields.filter((f) => f.type === "number");
  const photoFields = fields.filter((f) => f.type === "photo");
  const textFields = fields.filter((f) => f.type === "text");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20">
            <User className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-white">{clientName}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {date}
            </div>
          </div>
        </div>
      </div>

      {/* Number fields (measurements) */}
      {numberFields.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Medidas
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {numberFields
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((field) => {
                const val = values[field.id];
                return (
                  <div
                    key={field.id}
                    className="rounded-xl border border-gray-800 bg-gray-800/30 p-3"
                  >
                    <p className="text-xs text-gray-500">{field.label}</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {val !== undefined && val !== "" ? val : "—"}
                      {field.unit && val !== undefined && val !== "" && (
                        <span className="ml-1 text-sm font-normal text-gray-500">
                          {field.unit}
                        </span>
                      )}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Photos */}
      {photoFields.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Fotos
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {photoFields
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((field) => {
                const url = photoUrls[field.id] ?? "";
                return (
                  <div key={field.id} className="space-y-1.5">
                    <p className="text-xs text-gray-400">{field.label}</p>
                    <PhotoUpload
                      photoType="front"
                      value={url}
                      readOnly
                      compact
                      showLabel={false}
                      labelText={field.label}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Text fields */}
      {textFields.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Información adicional
            </h3>
          </div>
          <div className="space-y-3">
            {textFields
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((field) => {
                const val = values[field.id];
                return (
                  <div
                    key={field.id}
                    className="rounded-xl border border-gray-800 bg-gray-800/30 p-3"
                  >
                    <p className="text-xs text-gray-500">{field.label}</p>
                    <p className="mt-1 text-sm text-white whitespace-pre-wrap">
                      {val !== undefined && val !== "" ? String(val) : "—"}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {fields.length === 0 && (
        <p className="py-4 text-center text-sm text-gray-500">
          Este formulario no tiene campos configurados.
        </p>
      )}
    </div>
  );
}
