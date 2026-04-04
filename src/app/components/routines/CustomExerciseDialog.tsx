"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import type {
  CustomExerciseForEdit,
  MuscleCatalogItem,
} from "@/src/app/lib/types/routines";
import { MuscleMultiSelect } from "@/src/app/components/routines/MuscleMultiSelect";

/** Radix Select needs a non-empty sentinel for “sin principal”. */
const PRIMARY_NONE_VALUE = "__none__";

interface CustomExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  /** Si está definido, el diálogo carga ese ejercicio y guarda con PATCH */
  editingExerciseId?: string | null;
  /** Tras editar bien; recibe el snapshot del backend para actualizar listas locales */
  onSaved?: (exercise: CustomExerciseForEdit) => void;
}

export function CustomExerciseDialog({
  open,
  onOpenChange,
  onCreated,
  editingExerciseId = null,
  onSaved,
}: CustomExerciseDialogProps) {
  const supabase = createSupabaseBrowser();
  const [name, setName] = useState("");
  const [descriptionLines, setDescriptionLines] = useState<string[]>([""]);
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [musclesCatalog, setMusclesCatalog] = useState<MuscleCatalogItem[]>([]);
  /** At most one primary muscle (main target of the exercise). */
  const [primaryMuscleId, setPrimaryMuscleId] = useState<string | null>(null);
  const [secondaryMuscleIds, setSecondaryMuscleIds] = useState<string[]>([]);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const isEditMode = Boolean(editingExerciseId);

  useEffect(() => {
    if (!open) return;
    if (editingExerciseId) return;
    setName("");
    setDescriptionLines([""]);
    setImageUrl("");
    setVideoUrl("");
    setPrimaryMuscleId(null);
    setSecondaryMuscleIds([]);
  }, [open, editingExerciseId]);

  useEffect(() => {
    if (!open || !editingExerciseId) return;
    let cancelled = false;
    setLoadingEdit(true);
    (async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/exercises/custom/${editingExerciseId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            cache: "no-store",
          },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          toast.error(data?.message ?? "No se pudo cargar el ejercicio");
          onOpenChange(false);
          return;
        }
        const ex = data.exercise as CustomExerciseForEdit | undefined;
        if (!ex) {
          toast.error("Respuesta inválida del servidor");
          onOpenChange(false);
          return;
        }
        setName(ex.name ?? "");
        const desc = ex.description?.trim() ?? "";
        setDescriptionLines(desc.length > 0 ? desc.split("\n") : [""]);
        setImageUrl(ex.imageUrl ?? "");
        setVideoUrl(ex.videoUrl ?? "");
        setPrimaryMuscleId(ex.primaryMuscleId ?? null);
        setSecondaryMuscleIds(
          Array.isArray(ex.secondaryMuscleIds) ? ex.secondaryMuscleIds : [],
        );
      } catch {
        if (!cancelled) {
          toast.error("No se pudo cargar el ejercicio");
          onOpenChange(false);
        }
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, editingExerciseId, supabase, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/muscles`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setMusclesCatalog([]);
          return;
        }
        setMusclesCatalog(Array.isArray(data.muscles) ? data.muscles : []);
      } catch {
        if (!cancelled) setMusclesCatalog([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, supabase]);

  const updateDescriptionLine = (index: number, value: string) => {
    setDescriptionLines((prev) =>
      prev.map((line, idx) => (idx === index ? value : line)),
    );
  };

  const addDescriptionLine = () => {
    setDescriptionLines((prev) => [...prev, ""]);
  };

  const removeDescriptionLine = (index: number) => {
    setDescriptionLines((prev) => {
      if (prev.length === 1) return [""];
      return prev.filter((_, idx) => idx !== index);
    });
  };

  /** Secundarios: el principal no aparece en la lista (mejor que checkbox desactivado). */
  const secondaryPool = useMemo(
    () =>
      primaryMuscleId
        ? musclesCatalog.filter((m) => m.id !== primaryMuscleId)
        : musclesCatalog,
    [musclesCatalog, primaryMuscleId],
  );

  const selectPrimaryMuscle = (id: string | null) => {
    setPrimaryMuscleId(id);
    if (id) {
      setSecondaryMuscleIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (secondaryMuscleIds.length > 0 && !primaryMuscleId) {
      toast.error(
        "Si marcas músculos secundarios, elige también un músculo principal.",
      );
      return;
    }

    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const normalizedDescription = descriptionLines
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n");

      const primaryMuscleIds = primaryMuscleId ? [primaryMuscleId] : [];
      const secondaryOnly = secondaryMuscleIds.filter(
        (id) => id !== primaryMuscleId,
      );

      const url = editingExerciseId
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/exercises/${editingExerciseId}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/exercises/custom`;

      const body = editingExerciseId
        ? {
            name: name.trim(),
            description: normalizedDescription,
            imageUrl: imageUrl.trim(),
            videoUrl: videoUrl.trim(),
            primaryMuscleIds,
            secondaryMuscleIds: secondaryOnly,
          }
        : {
            name: name.trim(),
            description: normalizedDescription || undefined,
            imageUrl: imageUrl.trim() || undefined,
            videoUrl: videoUrl.trim() || undefined,
            primaryMuscleIds,
            secondaryMuscleIds: secondaryOnly,
          };

      const res = await fetch(url, {
        method: editingExerciseId ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          data?.message ??
            (editingExerciseId
              ? "No se pudo guardar el ejercicio"
              : "No se pudo crear el ejercicio"),
        );
        return;
      }

      if (editingExerciseId && data.exercise) {
        toast.success("Ejercicio actualizado");
        onSaved?.(data.exercise as CustomExerciseForEdit);
      } else {
        toast.success("Ejercicio creado");
        onCreated?.();
      }
      onOpenChange(false);
    } catch {
      toast.error(
        editingExerciseId
          ? "No se pudo guardar el ejercicio"
          : "No se pudo crear el ejercicio",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar ejercicio propio" : "Nuevo ejercicio propio"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isEditMode
              ? "Los cambios se aplican a este ejercicio en tus rutinas al guardar la plantilla o asignación."
              : "Este ejercicio será visible solo para ti al crear rutinas."}
          </DialogDescription>
        </DialogHeader>
        <div
          className={`space-y-3 ${loadingEdit ? "pointer-events-none opacity-50" : ""}`}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del ejercicio"
            className="border-gray-700 bg-gray-800 text-gray-100"
          />
          <div className="relative z-10 space-y-3 overflow-visible rounded-lg border border-gray-700 bg-gray-800/40 p-3">
            <p className="text-xs font-medium text-gray-300">
              Músculos trabajados
            </p>

            <div className="space-y-1.5">
              <label
                htmlFor="custom-exercise-primary-muscle"
                className="text-xs text-gray-400"
              >
                Músculo principal
                <span className="ml-1 font-normal text-gray-500">
                  (el que más se trabaja en el movimiento)
                </span>
              </label>
              <Select
                value={primaryMuscleId ?? PRIMARY_NONE_VALUE}
                onValueChange={(v) =>
                  selectPrimaryMuscle(v === PRIMARY_NONE_VALUE ? null : v)
                }
                disabled={musclesCatalog.length === 0}
              >
                <SelectTrigger
                  id="custom-exercise-primary-muscle"
                  className="h-auto min-h-9 w-full max-w-none border-gray-700 bg-gray-800 py-2 text-left text-gray-100 whitespace-normal [&_svg]:text-gray-400"
                >
                  <SelectValue placeholder="Sin músculo principal" />
                </SelectTrigger>
                <SelectContent className="z-[100] max-h-60 border-gray-700 bg-gray-900 text-gray-100">
                  <SelectItem
                    value={PRIMARY_NONE_VALUE}
                    className="focus:bg-gray-800 focus:text-gray-100"
                  >
                    Sin músculo principal
                  </SelectItem>
                  {musclesCatalog.map((m) => (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                      className="focus:bg-gray-800 focus:text-gray-100"
                    >
                      {m.nameEs}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label
                  htmlFor="custom-exercise-secondary-muscles-input"
                  className="text-xs text-gray-400"
                >
                  Músculos secundarios
                  <span className="ml-1 font-normal text-gray-500">
                    (opcional; clic para añadir; no incluye al principal)
                  </span>
                </label>
                {secondaryMuscleIds.length > 0 ? (
                  <span className="text-[11px] text-orange-400/90">
                    {secondaryMuscleIds.length}{" "}
                    {secondaryMuscleIds.length === 1
                      ? "seleccionado"
                      : "seleccionados"}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] leading-snug text-gray-500">
                Escribe para filtrar. Los elegidos aparecen arriba como
                etiquetas; quita con la <span className="text-gray-400">×</span>{" "}
                de cada una.
              </p>
              {musclesCatalog.length === 0 ? (
                <p className="rounded-md border border-gray-700/80 bg-gray-900/40 p-3 text-xs text-gray-500">
                  No hay catálogo de músculos disponible.
                </p>
              ) : secondaryPool.length === 0 ? (
                <p className="rounded-md border border-gray-700/80 bg-gray-900/40 p-3 text-xs text-gray-500">
                  Con un solo músculo en el catálogo no hay secundarios
                  posibles.
                </p>
              ) : (
                <div className="relative isolate">
                  <MuscleMultiSelect
                    inputId="custom-exercise-secondary-muscles-input"
                    options={secondaryPool}
                    value={secondaryMuscleIds}
                    onChange={setSecondaryMuscleIds}
                    disabled={musclesCatalog.length === 0}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-gray-700 bg-gray-800/40 p-3">
            <p className="text-xs text-gray-400">
              Descripción en pasos (cada línea se guarda como un item)
            </p>
            <div className="space-y-2">
              {descriptionLines.map((line, index) => (
                <div key={`line-${index}`} className="flex items-center gap-2">
                  <span className="w-6 text-xs text-gray-400">
                    {index + 1}.
                  </span>
                  <Input
                    value={line}
                    onChange={(e) =>
                      updateDescriptionLine(index, e.target.value)
                    }
                    placeholder={`Paso ${index + 1}`}
                    className="border-gray-700 bg-gray-800 text-gray-100"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeDescriptionLine(index)}
                    className="border-gray-700 bg-transparent px-2 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    -
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addDescriptionLine}
              className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Añadir línea
            </Button>
          </div>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="URL de imagen (opcional)"
            className="border-gray-700 bg-gray-800 text-gray-100"
          />
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="URL de video (opcional)"
            className="border-gray-700 bg-gray-800 text-gray-100"
          />
        </div>
        <DialogFooter className="relative z-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loadingEdit}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
          >
            {saving
              ? "Guardando..."
              : isEditMode
                ? "Guardar cambios"
                : "Crear ejercicio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
