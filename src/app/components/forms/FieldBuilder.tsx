"use client";

import { useState } from "react";
import {
  GripVertical,
  Trash2,
  Plus,
  Type,
  Hash,
  List,
  Camera,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CustomField,
  CustomFieldType,
  SelectOption,
} from "../../lib/types/forms";

const FIELD_TYPE_OPTIONS: {
  value: CustomFieldType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "text", label: "Texto", icon: Type },
  { value: "number", label: "Numero", icon: Hash },
  { value: "select", label: "Seleccion", icon: List },
  { value: "photo", label: "Foto", icon: Camera },
];

interface FieldBuilderProps {
  field: CustomField;
  onUpdate: (updated: CustomField) => void;
  onRemove: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export function FieldBuilder({
  field,
  onUpdate,
  onRemove,
  dragHandleProps,
}: FieldBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon =
    FIELD_TYPE_OPTIONS.find((o) => o.value === field.type)?.icon ?? Type;

  const addOption = () => {
    const newOpt: SelectOption = {
      id: `opt-${Date.now()}`,
      label: "",
    };
    onUpdate({
      ...field,
      options: [...(field.options ?? []), newOpt],
    });
  };

  const updateOption = (optId: string, label: string) => {
    onUpdate({
      ...field,
      options: (field.options ?? []).map((o) =>
        o.id === optId ? { ...o, label } : o,
      ),
    });
  };

  const removeOption = (optId: string) => {
    onUpdate({
      ...field,
      options: (field.options ?? []).filter((o) => o.id !== optId),
    });
  };

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
          {field.required && (
            <span className="text-[10px] text-red-400">*</span>
          )}
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-1 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
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
              <Select
                value={field.type}
                onValueChange={(v: CustomFieldType) =>
                  onUpdate({
                    ...field,
                    type: v,
                    options: v === "select" ? (field.options ?? []) : undefined,
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
            </div>
          </div>

          {/* Unit (for number fields) */}
          {field.type === "number" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Unidad (opcional)</Label>
              <Input
                value={field.unit ?? ""}
                onChange={(e) => onUpdate({ ...field, unit: e.target.value })}
                placeholder="Ej: kg, cm, %"
                className="h-9 w-32 rounded-lg border-gray-700 bg-gray-800 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
          )}

          {/* Options (for select fields) */}
          {field.type === "select" && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Opciones</Label>
              <div className="space-y-2">
                {(field.options ?? []).map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <Input
                      value={opt.label}
                      onChange={(e) => updateOption(opt.id, e.target.value)}
                      placeholder="Nombre de la opcion"
                      className="h-9 flex-1 rounded-lg border-gray-700 bg-gray-800 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="rounded p-1 text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="gap-1.5 border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar opcion
              </Button>
            </div>
          )}

          {/* Required toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/30 px-3 py-2">
            <Label className="text-xs text-gray-400">Campo obligatorio</Label>
            <Switch
              checked={field.required}
              onCheckedChange={(v) => onUpdate({ ...field, required: v })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
