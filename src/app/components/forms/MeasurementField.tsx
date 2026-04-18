"use client";

import { useState, useCallback } from "react";
import { Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BASIC_LABELS,
  BASIC_UNITS,
  MANDATORY_MEASUREMENTS,
  MANDATORY_BASICS,
  MEASUREMENT_LABELS,
  type MeasurementData,
  type MandatoryKey,
} from "../../lib/types/forms";

/** Peso: dígitos y separador decimal (. o ,), máx 2 decimales */
function normalizeWeightInput(raw: string): string | null {
  if (!/^\d*[.,]?\d{0,2}$/.test(raw)) return null;
  return raw;
}

/** Para medidas en cm: dígitos y un separador decimal (. o ,), sin límite de decimales */
function normalizeMeasurementInput(raw: string): string | null {
  if (!/^\d*[.,]?\d*$/.test(raw)) return null;
  return raw;
}

interface MeasurementFieldsProps {
  /** When null, renders as a preview (read-only visual) */
  values: Partial<MeasurementData> | null;
  onChange?: (key: MandatoryKey, value: number | undefined) => void;
  readOnly?: boolean;
}

export function MeasurementFields({
  values,
  onChange,
  readOnly = false,
}: MeasurementFieldsProps) {
  const [draft, setDraft] = useState<Partial<Record<MandatoryKey, string>>>({});

  const displayBasic = useCallback(
    (key: MandatoryKey) =>
      draft[key] !== undefined
        ? draft[key]
        : values?.[key] != null
          ? String(values[key])
          : "",
    [draft, values],
  );

  const handleBasicChange = useCallback(
    (key: MandatoryKey, raw: string) => {
      const trimmed = raw.trim();
      const normalized = normalizeWeightInput(trimmed);
      if (normalized === null) return;
      setDraft((prev) => ({ ...prev, [key]: normalized }));
      if (trimmed === "") {
        onChange?.(key, undefined);
        return;
      }
      if (trimmed.endsWith(".") || trimmed.endsWith(",")) return;
      const n = Number.parseFloat(trimmed.replace(",", "."));
      if (!Number.isNaN(n)) onChange?.(key, Math.round(n * 100) / 100);
    },
    [onChange],
  );

  const handleBasicBlur = useCallback(
    (key: MandatoryKey) => {
      const current =
        draft[key] ?? (values?.[key] != null ? String(values[key]) : "");
      setDraft((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (current === "") return;
      const n = Number.parseFloat(current.replace(",", "."));
      if (!Number.isNaN(n)) onChange?.(key, Math.round(n * 100) / 100);
    },
    [draft, values, onChange],
  );

  const displayMeasurement = useCallback(
    (key: MandatoryKey) =>
      draft[key] !== undefined
        ? draft[key]
        : values?.[key] != null
          ? String(values[key])
          : "",
    [draft, values],
  );

  const handleMeasurementChange = useCallback(
    (key: MandatoryKey, raw: string) => {
      const trimmed = raw.trim();
      const normalized = normalizeMeasurementInput(trimmed);
      if (normalized === null) return;
      setDraft((prev) => ({ ...prev, [key]: normalized }));
      if (trimmed === "") {
        onChange?.(key, undefined);
        return;
      }
      if (trimmed.endsWith(".") || trimmed.endsWith(",")) return;
      const n = Number.parseFloat(trimmed.replace(",", "."));
      if (!Number.isNaN(n)) onChange?.(key, n);
    },
    [onChange],
  );

  const handleMeasurementBlur = useCallback(
    (key: MandatoryKey) => {
      const current =
        draft[key] ?? (values?.[key] != null ? String(values[key]) : "");
      setDraft((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (current === "") return;
      const n = Number.parseFloat(current.replace(",", "."));
      if (!Number.isNaN(n)) onChange?.(key, n);
    },
    [draft, values, onChange],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-red-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Datos básicos
          </h3>
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
            Obligatorio
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MANDATORY_BASICS.map((key) => {
            const unit = BASIC_UNITS[key];
            return (
              <div key={key} className="space-y-1.5">
                <Label
                  htmlFor={`basic-${key}`}
                  className="text-xs font-medium text-gray-400"
                >
                  {BASIC_LABELS[key]}
                </Label>
                {readOnly ? (
                  <div className="flex h-10 items-center rounded-xl border border-gray-800 bg-gray-800/50 px-3 text-sm text-white">
                    {values?.[key] ?? "---"}
                    <span className="ml-auto text-xs text-gray-500">
                      {unit}
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      id={`basic-${key}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="—"
                      value={displayBasic(key)}
                      onChange={(e) => handleBasicChange(key, e.target.value)}
                      onBlur={() => handleBasicBlur(key)}
                      className="h-10 rounded-xl border-gray-700 bg-gray-800 pr-12 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      {unit}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Ruler className="h-4 w-4 text-red-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Medidas corporales
        </h3>
        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
          Obligatorio
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {MANDATORY_MEASUREMENTS.map((key) => (
          <div key={key} className="space-y-1.5">
            <Label
              htmlFor={`measurement-${key}`}
              className="text-xs font-medium text-gray-400"
            >
              {MEASUREMENT_LABELS[key]}
            </Label>
            {readOnly ? (
              <div className="flex h-10 items-center rounded-xl border border-gray-800 bg-gray-800/50 px-3 text-sm text-white">
                {values?.[key] ?? "---"}
                <span className="ml-auto text-xs text-gray-500">cm</span>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id={`measurement-${key}`}
                  type="text"
                  inputMode="decimal"
                  placeholder="—"
                  value={displayMeasurement(key)}
                  onChange={(e) => handleMeasurementChange(key, e.target.value)}
                  onBlur={() => handleMeasurementBlur(key)}
                  className="h-10 rounded-xl border-gray-700 bg-gray-800 pr-10 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  cm
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
