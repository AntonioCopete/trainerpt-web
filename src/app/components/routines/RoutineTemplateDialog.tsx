"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  RoutineExercise,
  RoutineTemplate,
  RoutineTemplateExercise,
} from "@/src/app/lib/types/routines";
import { SafeHtml } from "@/src/app/components/routines/SafeHtml";
import { ExerciseDetailDialog } from "@/src/app/components/routines/ExerciseDetailDialog";

interface RoutineTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    name: string;
    description: string;
    schema: RoutineTemplateExercise[];
  }) => Promise<void>;
  initialTemplate?: RoutineTemplate | null;
}

export function RoutineTemplateDialog({
  open,
  onOpenChange,
  onSubmit,
  initialTemplate,
}: RoutineTemplateDialogProps) {
  const normalizeDescription = (value: unknown): string | string[] | null => {
    if (Array.isArray(value)) {
      const lines = value
        .map((line) => (typeof line === "string" ? line.trim() : ""))
        .filter(Boolean);
      return lines.length > 0 ? lines : null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  };

  const normalizeExerciseFromApi = (exercise: any): RoutineExercise => ({
    ...exercise,
    name: exercise?.nameEs ?? exercise?.name ?? "Ejercicio",
    description:
      normalizeDescription(exercise?.descriptionEs) ??
      normalizeDescription(exercise?.description),
    categoryName: exercise?.categoryNameEs ?? exercise?.categoryName ?? null,
  });

  const renderExerciseDescription = (
    value: string | string[] | null | undefined,
    className: string,
  ) => {
    if (!value) return null;
    if (Array.isArray(value)) {
      const lines = value.map((line) => line?.trim()).filter(Boolean);
      if (lines.length === 0) return null;
      return (
        <ul className={className}>
          {lines.map((line, idx) => (
            <li key={`${idx}-${line}`}>{line}</li>
          ))}
        </ul>
      );
    }
    return <SafeHtml html={value} className={className} />;
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseResults, setExerciseResults] = useState<RoutineExercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<
    RoutineTemplateExercise[]
  >([]);
  const [trainingTitles, setTrainingTitles] = useState<string[]>([]);
  const newTrainingTitleRef = useRef<HTMLInputElement | null>(null);
  const [exerciseToAssignId, setExerciseToAssignId] = useState<string | null>(
    null,
  );
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [exerciseDetail, setExerciseDetail] =
    useState<RoutineTemplateExercise | null>(null);
  const isEdit = Boolean(initialTemplate);
  const supabase = createSupabaseBrowser();
  const visibleExerciseResults = useMemo(
    () => exerciseResults.slice(0, 60),
    [exerciseResults],
  );

  useEffect(() => {
    if (!open) return;
    setName(initialTemplate?.name ?? "");
    setDescription(initialTemplate?.description ?? "");
    const existingSchema = Array.isArray(initialTemplate?.schema)
      ? initialTemplate.schema
      : [];
    setSelectedExercises(
      existingSchema
        .map((item, index) => {
          const trainingTitle =
            typeof item.trainingTitle === "string" && item.trainingTitle.trim()
              ? item.trainingTitle.trim()
              : "";

          if (!trainingTitle) {
            return null;
          }

          return {
            exerciseId: String(item.exerciseId ?? item.id ?? `legacy-${index}`),
            source: (item.source ?? "wger") as
              | "wger"
              | "free_exercise_db"
              | "custom",
            trainerId: item.trainerId ?? null,
            author:
              item.author ?? (item.source === "custom" ? "Tú" : "Biblioteca"),
            license: item.license ?? null,
            name: item.name ?? "Ejercicio",
            description: normalizeDescription(item.description),
            categoryName: item.categoryName ?? null,
            imageUrl: item.imageUrl ?? null,
            videoUrl: item.videoUrl ?? null,
            imageUrls: Array.isArray(item.imageUrls)
              ? item.imageUrls
              : item.imageUrl
                ? [item.imageUrl]
                : [],
            videoUrls: Array.isArray(item.videoUrls)
              ? item.videoUrls
              : item.videoUrl
                ? [item.videoUrl]
                : [],
            instructions: item.instructions ?? "",
            trainingTitle,
            order: index,
          };
        })
        .filter((item) => item !== null)
        .sort((a, b) => a!.order - b!.order) as RoutineTemplateExercise[],
    );
    const inferredTrainingTitles = Array.from(
      new Set(
        existingSchema
          .map((item) =>
            typeof item?.trainingTitle === "string"
              ? item.trainingTitle.trim()
              : "",
          )
          .filter(Boolean),
      ),
    );
    setTrainingTitles(
      inferredTrainingTitles.length > 0 ? inferredTrainingTitles : [],
    );
  }, [open, initialTemplate]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function fetchExercises() {
      setLoadingExercises(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        const query = exerciseSearch.trim();
        const url = query
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/exercises?q=${encodeURIComponent(query)}`
          : `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/exercises`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          const normalized = Array.isArray(data.exercises)
            ? data.exercises.map(normalizeExerciseFromApi)
            : [];
          setExerciseResults(normalized);
        }
      } catch {
        if (!cancelled) {
          setExerciseResults([]);
          toast.error("No se pudieron cargar ejercicios");
        }
      } finally {
        if (!cancelled) setLoadingExercises(false);
      }
    }

    const timer = setTimeout(() => {
      void fetchExercises();
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, exerciseSearch]);

  useEffect(() => {
    if (exerciseResults.length === 0) return;
    const exerciseById = new Map(
      exerciseResults.map((exercise) => [exercise.id, exercise]),
    );

    setSelectedExercises((prev) =>
      prev.map((item) => {
        const sourceExercise = exerciseById.get(item.exerciseId);
        if (!sourceExercise) return item;

        const sourceImageUrls =
          sourceExercise.imageUrls ??
          (sourceExercise.imageUrl ? [sourceExercise.imageUrl] : []);
        const sourceVideoUrls =
          sourceExercise.videoUrls ??
          (sourceExercise.videoUrl ? [sourceExercise.videoUrl] : []);

        const nextImageUrls =
          item.imageUrls && item.imageUrls.length > 0
            ? item.imageUrls
            : sourceImageUrls;
        const nextVideoUrls =
          item.videoUrls && item.videoUrls.length > 0
            ? item.videoUrls
            : sourceVideoUrls;

        return {
          ...item,
          source: item.source ?? sourceExercise.source,
          trainerId: item.trainerId ?? sourceExercise.trainerId ?? null,
          author:
            item.author ??
            sourceExercise.author ??
            (sourceExercise.source === "custom" ? "Tú" : "Biblioteca"),
          license: item.license ?? sourceExercise.license ?? null,
          name: item.name || sourceExercise.name,
          description:
            item.description ??
            normalizeDescription(sourceExercise.description),
          categoryName:
            item.categoryName ?? sourceExercise.categoryName ?? null,
          imageUrl:
            item.imageUrl ??
            sourceExercise.imageUrl ??
            nextImageUrls[0] ??
            null,
          videoUrl:
            item.videoUrl ??
            sourceExercise.videoUrl ??
            nextVideoUrls[0] ??
            null,
          imageUrls: nextImageUrls,
          videoUrls: nextVideoUrls,
        };
      }),
    );
  }, [exerciseResults]);

  const addExercise = (exercise: RoutineExercise, trainingTitle: string) => {
    if (!trainingTitle) {
      toast.error("Selecciona un entrenamiento para añadir el ejercicio");
      return;
    }

    const newExercise: RoutineTemplateExercise = {
      exerciseId: exercise.id,
      source: exercise.source,
      trainerId: exercise.trainerId ?? null,
      author:
        exercise.author ?? (exercise.source === "custom" ? "Tú" : "Biblioteca"),
      license: exercise.license ?? null,
      name: exercise.name,
      description: normalizeDescription(exercise.description),
      categoryName: exercise.categoryName ?? null,
      imageUrl: exercise.imageUrl ?? null,
      videoUrl: exercise.videoUrl ?? null,
      imageUrls:
        exercise.imageUrls ?? (exercise.imageUrl ? [exercise.imageUrl] : []),
      videoUrls:
        exercise.videoUrls ?? (exercise.videoUrl ? [exercise.videoUrl] : []),
      instructions: "",
      trainingTitle,
      order: 0,
    };

    setSelectedExercises((prev) => [...prev, newExercise]);
    toast.success(`Ejercicio añadido a "${trainingTitle}"`);
    setExerciseToAssignId(null);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, idx) => ({ ...item, order: idx })),
    );
  };

  const updateInstructions = (index: number, instructions: string) => {
    setSelectedExercises((prev) =>
      prev.map((item, i) => (i === index ? { ...item, instructions } : item)),
    );
  };

  const addTrainingTitle = () => {
    const normalized = newTrainingTitleRef.current?.value.trim() ?? "";
    if (!normalized) return;
    if (trainingTitles.includes(normalized)) {
      toast.info(`El entrenamiento "${normalized}" ya existe`);
      if (newTrainingTitleRef.current) newTrainingTitleRef.current.value = "";
      return;
    }
    setTrainingTitles((prev) => [...prev, normalized]);
    if (newTrainingTitleRef.current) newTrainingTitleRef.current.value = "";
  };

  const groupedSelectedExercises = useMemo(() => {
    return trainingTitles.map((title) => ({
      title,
      exercises: selectedExercises
        .map((exercise, originalIndex) => ({ ...exercise, originalIndex }))
        .filter((exercise) => exercise.trainingTitle === title),
    }));
  }, [selectedExercises, trainingTitles]);

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) {
      toast.error("Completa nombre y descripcion");
      return;
    }
    if (selectedExercises.length === 0) {
      toast.error("Añade al menos un ejercicio");
      return;
    }
    const hasInvalidExercise = selectedExercises.some(
      (ex) => !ex.trainingTitle || !ex.trainingTitle.trim(),
    );
    if (hasInvalidExercise) {
      toast.error("Todos los ejercicios deben tener un entrenamiento asignado");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        schema: selectedExercises.map((item, index) => ({
          ...item,
          order: index,
        })),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit
                ? "Editar plantilla de rutina"
                : "Nueva plantilla de rutina"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Selecciona ejercicios existentes y define instrucciones por
              ejercicio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-auto pr-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">
                Nombre
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rutina Full Body A"
                className="border-gray-700 bg-gray-800 text-gray-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">
                Descripción
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Objetivo y notas de esta rutina"
                className="border-gray-700 bg-gray-800 text-gray-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">
                Buscar ejercicio en biblioteca
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="Ej: press banca, sentadilla..."
                  className="border-gray-700 bg-gray-800 pl-10 text-gray-100"
                />
              </div>
              <div className="max-h-44 space-y-2 overflow-auto rounded-lg border border-gray-800 bg-gray-800/30 p-2">
                {loadingExercises ? (
                  <p className="px-2 py-1 text-xs text-gray-500">Cargando...</p>
                ) : exerciseResults.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-gray-500">
                    No hay ejercicios para mostrar
                  </p>
                ) : (
                  visibleExerciseResults.map((exercise) => {
                    const alreadyAdded = selectedExercises.some(
                      (item) => item.exerciseId === exercise.id,
                    );
                    return (
                      <div key={exercise.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 rounded-md border border-gray-700 bg-gray-900/60 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-gray-100">
                              {exercise.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                  exercise.source === "custom"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-blue-500/20 text-blue-300"
                                }`}
                              >
                                {exercise.source === "custom"
                                  ? "Tuyo"
                                  : "Biblioteca"}
                              </span>
                            </div>
                          </div>
                          <div className="ml-2 flex shrink-0 items-center gap-1">
                            {exerciseToAssignId === exercise.id ? (
                              <select
                                autoFocus
                                onChange={(e) => {
                                  if (e.target.value) {
                                    addExercise(exercise, e.target.value);
                                  }
                                }}
                                onBlur={() => setExerciseToAssignId(null)}
                                className="h-7 rounded-md border border-gray-600 bg-gray-800 px-2 text-xs text-gray-100"
                              >
                                <option value="">Elegir...</option>
                                {trainingTitles.map((title) => (
                                  <option key={title} value={title}>
                                    {title}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (trainingTitles.length === 0) {
                                    toast.error(
                                      "Crea al menos un entrenamiento antes de añadir ejercicios",
                                    );
                                    return;
                                  }
                                  setExerciseToAssignId(exercise.id);
                                }}
                                className={`h-7 border-gray-600 px-2 ${
                                  alreadyAdded
                                    ? "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                                    : "bg-transparent text-gray-300 hover:bg-gray-700"
                                }`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setExerciseDetail({
                                  exerciseId: exercise.id,
                                  name: exercise.name,
                                  description: normalizeDescription(
                                    exercise.description,
                                  ),
                                  categoryName: exercise.categoryName ?? null,
                                  source: exercise.source,
                                  trainerId: exercise.trainerId,
                                  author:
                                    exercise.author ??
                                    (exercise.source === "custom"
                                      ? "Tú"
                                      : "Biblioteca"),
                                  license: exercise.license ?? null,
                                  imageUrl: exercise.imageUrl ?? null,
                                  videoUrl: exercise.videoUrl ?? null,
                                  imageUrls: exercise.imageUrls ?? [],
                                  videoUrls: exercise.videoUrls ?? [],
                                  instructions: "",
                                  trainingTitle: "",
                                  order: 0,
                                });
                                setDetailOpen(true);
                              }}
                              className="h-7 px-2 text-gray-300 hover:bg-gray-700"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {!loadingExercises &&
                  exerciseResults.length > visibleExerciseResults.length && (
                    <p className="px-2 py-1 text-[11px] text-gray-500">
                      Mostrando {visibleExerciseResults.length} de{" "}
                      {exerciseResults.length} resultados. Usa búsqueda para
                      refinar.
                    </p>
                  )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">
                Ejercicios de la rutina ({selectedExercises.length})
              </label>
              <div className="space-y-2">
                <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-3">
                  <p className="mb-2 text-xs font-medium text-gray-400">
                    Entrenamientos dentro de la rutina
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      ref={newTrainingTitleRef}
                      placeholder="Ej: Lunes - Torso, Miércoles - Pierna"
                      className="border-gray-700 bg-gray-900 text-gray-100"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addTrainingTitle}
                      className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800"
                    >
                      Añadir
                    </Button>
                  </div>
                  {trainingTitles.length === 0 ? (
                    <p className="mt-2 text-[11px] text-orange-300">
                      Crea al menos un entrenamiento para poder añadir
                      ejercicios.
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] font-medium text-gray-200">
                      {trainingTitles.length} entrenamiento(s):{" "}
                      {trainingTitles.join(", ")}
                    </p>
                  )}
                </div>
                {selectedExercises.length === 0 ? (
                  <p className="rounded-lg border border-gray-800 bg-gray-800/30 px-3 py-2 text-xs text-gray-500">
                    Añade ejercicios desde la biblioteca
                  </p>
                ) : (
                  groupedSelectedExercises.map((group) => (
                    <div
                      key={`group-${group.title}`}
                      className="rounded-lg border border-gray-800 bg-gray-800/30 p-3"
                    >
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-300">
                        {group.title}
                      </p>
                      {group.exercises.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          Sin ejercicios en este entrenamiento.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {group.exercises.map((exercise, index) => (
                            <div
                              key={exercise.originalIndex}
                              className="rounded-md border border-gray-800 bg-gray-900/50 p-3"
                            >
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium text-gray-100">
                                    {index + 1}. {exercise.name}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                        exercise.source === "custom"
                                          ? "bg-emerald-500/20 text-emerald-300"
                                          : "bg-blue-500/20 text-blue-300"
                                      }`}
                                    >
                                      {exercise.source === "custom"
                                        ? "Tuyo"
                                        : "Biblioteca"}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeExercise(exercise.originalIndex)
                                  }
                                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <Input
                                value={exercise.instructions ?? ""}
                                onChange={(e) =>
                                  updateInstructions(
                                    exercise.originalIndex,
                                    e.target.value,
                                  )
                                }
                                placeholder="Instrucciones del trainer para este ejercicio"
                                className="border-gray-700 bg-gray-900 text-gray-100"
                              />
                              <div className="mt-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setExerciseDetail(exercise);
                                    setDetailOpen(true);
                                  }}
                                  className="h-7 border-gray-600 bg-transparent px-2 text-xs text-gray-300 hover:bg-gray-700"
                                >
                                  <Eye className="mr-1 h-3.5 w-3.5" />
                                  Ver detalle completo
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            >
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ExerciseDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        exercise={exerciseDetail}
      />
    </>
  );
}
