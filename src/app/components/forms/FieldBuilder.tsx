"use client";

import { useState } from "react";
import { GripVertical, Trash2, Type, Hash, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomField, CustomFieldType } from "../../lib/types/forms";

const FIELD_TYPE_OPTIONS: {
  value: CustomFieldType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "text", label: "Texto", icon: Type },
  { value: "number", label: "Número", icon: Hash },
  { value: "photo", label: "Foto", icon: Camera },
];

interface FieldBuilderProps {
  field: CustomField;
  onUpdate: (updated: CustomField) => void;
  onRemove: () => void;
  /** Campos del sistema (peso, medidas, fotos): no se borran ni cambia el tipo */
  isBaseField?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export function FieldBuilder({
  field,
  onUpdate,
  onRemove,
  isBaseField = false,
  dragHandleProps,
}: FieldBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon =
    FIELD_TYPE_OPTIONS.find((o) => o.value === field.type)?.icon ?? Type;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-800/40">
        <button
          type="button"
          className="cursor-grab text-gray-600 hover:text-gray-400 touch-none"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Icon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-white truncate">
            {field.label || "Campo sin nombre"}
          </span>
          {isBaseField && (
            <span className="shrink-0 rounded bg-gray-700/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Base
            </span>
          )}
          {field.required && (
            <span className="text-[10px] text-red-400">*</span>
          )}
        </button>

        {!isBaseField ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <span className="w-8 shrink-0" aria-hidden />
        )}
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="space-y-4 px-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Label */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Nombre del campo</Label>
              <Input
                value={field.label}
                onChange={(e) => onUpdate({ ...field, label: e.target.value })}
                placeholder="Ej: Peso corporal"
                className="h-9 rounded-lg border-gray-700 bg-gray-800 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Tipo de campo</Label>
              {isBaseField ? (
                <div className="flex h-9 items-center rounded-lg border border-gray-700 bg-gray-800/80 px-3 text-sm text-gray-300">
                  {FIELD_TYPE_OPTIONS.find((o) => o.value === field.type)
                    ?.label ?? field.type}
                </div>
              ) : (
                <Select
                  value={field.type}
                  onValueChange={(v: CustomFieldType) =>
                    onUpdate({
                      ...field,
                      type: v,
                      unit: v === "number" ? (field.unit ?? "") : undefined,
                    })
                  }
                >
                  <SelectTrigger className="h-9 rounded-lg border-gray-700 bg-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-800 bg-gray-900 text-gray-300">
                    {FIELD_TYPE_OPTIONS.map((opt) => {
                      const OptIcon = opt.icon;
                      return (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="focus:bg-gray-800 focus:text-white"
                        >
                          <span className="flex items-center gap-2">
                            <OptIcon className="h-3.5 w-3.5" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Unit + Required toggle */}
          <div className="flex items-end gap-4">
            {field.type === "number" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Unidad</Label>
                <Input
                  value={field.unit ?? ""}
                  onChange={(e) => onUpdate({ ...field, unit: e.target.value })}
                  placeholder="kg, cm..."
                  className="h-9 w-24 rounded-lg border-gray-700 bg-gray-800 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Obligatorio</Label>
              <div className="flex h-9 rounded-lg border border-gray-700 bg-gray-800/50 p-0.5">
                <button
                  type="button"
                  onClick={() => onUpdate({ ...field, required: false })}
                  className={`rounded-md px-3 text-xs font-medium transition-colors ${
                    !field.required
                      ? "bg-gray-700 text-white"
                      : "text-gray-500 hover:text-gray-400"
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ ...field, required: true })}
                  className={`rounded-md px-3 text-xs font-medium transition-colors ${
                    field.required
                      ? "bg-red-500/80 text-white"
                      : "text-gray-500 hover:text-gray-400"
                  }`}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
