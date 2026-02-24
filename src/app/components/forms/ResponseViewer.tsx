"use client";

import { Calendar, User } from "lucide-react";
import type { FormResponse } from "../../lib/types/forms";
import { MEASUREMENT_LABELS, type MeasurementKey } from "../../lib/types/forms";
import { MeasurementFields } from "./MeasurementField";
import { PhotoUpload } from "./PhotoUpload";

interface ResponseViewerProps {
  response: FormResponse;
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  const date = new Date(response.submittedAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20">
            <User className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-white">{response.clientName}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {date}
            </div>
          </div>
        </div>
      </div>

      {/* Measurements */}
      <MeasurementFields values={response.measurements} readOnly />

      {/* Photos */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Fotos de progreso
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <PhotoUpload
            photoType="front"
            value={response.photos.front}
            readOnly
          />
          <PhotoUpload photoType="side" value={response.photos.side} readOnly />
        </div>
      </div>

      {/* Custom field values */}
      {response.customFieldValues.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Campos adicionales
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {response.customFieldValues.map((fv) => {
              const templateField =
                response.assignment.template.customFields.find(
                  (f) => f.id === fv.fieldId,
                );
              return (
                <div
                  key={fv.fieldId}
                  className="rounded-xl border border-gray-800 bg-gray-800/30 p-3"
                >
                  <p className="text-xs text-gray-500">
                    {templateField?.label ?? "Campo"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {String(fv.value)}
                    {templateField?.unit && (
                      <span className="ml-1 text-xs text-gray-500">
                        {templateField.unit}
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
