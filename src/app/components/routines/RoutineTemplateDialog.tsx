"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  Plus,
  Search,
  Trash2,
  X,
  GripVertical,
  Pencil,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import type {
  CustomExerciseForEdit,
  RoutineExercise,
  RoutineTemplate,
  RoutineTemplateExercise,
} from "@/src/app/lib/types/routines";
import { SafeHtml } from "@/src/app/components/routines/SafeHtml";
import { ExerciseDetailDialog } from "@/src/app/components/routines/ExerciseDetailDialog";
import { CustomExerciseDialog } from "@/src/app/components/routines/CustomExerciseDialog";

interface SortableExerciseItemProps {
  exercise: RoutineTemplateExercise;
  onRemove: () => void;
  uniqueId: string;
}

function SortableExerciseItem({
  exercise,
  onRemove,
  uniqueId,
}: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: uniqueId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-orange-500/20 bg-gray-900/40 px-2 py-1.5"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-gray-500 hover:text-gray-300 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <p className="flex-1 text-sm text-gray-200">{exercise.name}</p>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onRemove}
        className="h-6 px-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        title="Eliminar ejercicio"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface SortableTrainingGroupProps {
  title: string;
  exercises: (RoutineTemplateExercise & { originalIndex: number })[];
  onEditTitle: () => void;
  onDeleteTraining: () => void;
  onManageExercises: () => void;
  onRemoveExercise: (index: number) => void;
  onUpdateInstructions: (index: number, instructions: string) => void;
  onViewDetail: (exercise: RoutineTemplateExercise) => void;
  isEditing: boolean;
  editingValue: string;
  onEditingChange: (value: string) => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
}

function SortableTrainingGroup({
  title,
  exercises,
  onEditTitle,
  onDeleteTraining,
  onManageExercises,
  onRemoveExercise,
  onUpdateInstructions,
  onViewDetail,
  isEditing,
  editingValue,
  onEditingChange,
  onConfirmEdit,
  onCancelEdit,
}: SortableTrainingGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: title });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-gray-800 bg-gray-800/30 p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            type="button"
            className="cursor-grab touch-none text-gray-500 hover:text-gray-300 active:cursor-grabbing shrink-0"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editingValue}
                onChange={(e) => onEditingChange(e.target.value)}
                className="h-7 border-gray-700 bg-gray-900 text-gray-100 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onConfirmEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onConfirmEdit}
                className="h-6 px-1.5 text-green-400 hover:bg-green-500/10 hover:text-green-300"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onCancelEdit}
                className="h-6 px-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-300 truncate">
                {title}
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onEditTitle}
                className="h-6 px-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                title="Editar nombre"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onDeleteTraining}
                className="h-6 px-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                title="Eliminar entrenamiento"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
        {!isEditing && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onManageExercises}
            className="h-7 gap-1 border-gray-600 bg-transparent px-2 text-xs text-gray-300 hover:bg-gray-700 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Gestionar ejercicios
          </Button>
        )}
      </div>
      {exercises.length === 0 ? (
        <p className="text-xs text-gray-500">
          Sin ejercicios. Usa el botón para añadir.
        </p>
      ) : (
        <div className="space-y-2">
          {exercises.map((exercise, index) => (
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
                      {exercise.source === "custom" ? "Tuyo" : "Biblioteca"}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveExercise(exercise.originalIndex)}
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input
                value={exercise.instructions ?? ""}
                onChange={(e) =>
                  onUpdateInstructions(exercise.originalIndex, e.target.value)
                }
                placeholder="Instrucciones del trainer para este ejercicio"
                className="border-gray-700 bg-gray-900 text-gray-100"
              />
              <div className="mt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onViewDetail(exercise)}
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
  );
}

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
  // Helper function to extract muscle names from the muscles field
  const getMuscleNames = (
    muscles: string[] | { name: string }[] | null | undefined,
  ): string[] => {
    if (!muscles || !Array.isArray(muscles)) return [];

    return muscles
      .map((muscle) => {
        if (typeof muscle === "string") return muscle;
        if (muscle && typeof muscle === "object" && "name" in muscle) {
          return muscle.name;
        }
        return null;
      })
      .filter((name): name is string => Boolean(name))
      .slice(0, 3); // Limit to first 3 muscles to avoid clutter
  };

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
    muscleLabelsPrimary: Array.isArray(exercise?.muscleLabelsPrimary)
      ? exercise.muscleLabelsPrimary
      : undefined,
    muscleLabelsSecondary: Array.isArray(exercise?.muscleLabelsSecondary)
      ? exercise.muscleLabelsSecondary
      : undefined,
    primaryMuscleIds: Array.isArray(exercise?.primaryMuscleIds)
      ? exercise.primaryMuscleIds
      : undefined,
    secondaryMuscleIds: Array.isArray(exercise?.secondaryMuscleIds)
      ? exercise.secondaryMuscleIds
      : undefined,
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
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [exerciseDetail, setExerciseDetail] =
    useState<RoutineTemplateExercise | null>(null);
  const [manageExercisesDialogOpen, setManageExercisesDialogOpen] =
    useState(false);
  const [currentTrainingTitle, setCurrentTrainingTitle] = useState<
    string | null
  >(null);
  const [editingTrainingTitle, setEditingTrainingTitle] = useState<
    string | null
  >(null);
  const [editingTrainingValue, setEditingTrainingValue] = useState("");
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [customExerciseEditorOpen, setCustomExerciseEditorOpen] =
    useState(false);
  const [editingCustomExerciseId, setEditingCustomExerciseId] = useState<
    string | null
  >(null);
  const isEdit = Boolean(initialTemplate);
  const supabase = createSupabaseBrowser();
  const visibleExerciseResults = useMemo(
    () => exerciseResults.slice(0, 100),
    [exerciseResults],
  );

  const applyUpdatedCustomExercise = (updated: CustomExerciseForEdit) => {
    setSelectedExercises((prev) =>
      prev.map((ex) => {
        if (ex.exerciseId !== updated.id) return ex;
        const lines = updated.description
          .split(/\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        return {
          ...ex,
          name: updated.name,
          categoryName: updated.categoryName,
          description: lines.length > 0 ? lines : ex.description,
          imageUrl: updated.imageUrl,
          videoUrl: updated.videoUrl,
          imageUrls: updated.imageUrl ? [updated.imageUrl] : [],
          videoUrls: updated.videoUrl ? [updated.videoUrl] : [],
        };
      }),
    );
    setHasUnsavedChanges(true);
  };

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
    // Preservar el orden de los entrenamientos según aparecen en el schema
    const inferredTrainingTitles: string[] = [];
    const seenTitles = new Set<string>();
    for (const item of existingSchema) {
      const title =
        typeof item?.trainingTitle === "string"
          ? item.trainingTitle.trim()
          : "";
      if (title && !seenTitles.has(title)) {
        inferredTrainingTitles.push(title);
        seenTitles.add(title);
      }
    }
    setTrainingTitles(
      inferredTrainingTitles.length > 0 ? inferredTrainingTitles : [],
    );
    setExerciseSearch("");
    setHasUnsavedChanges(false);
  }, [open, initialTemplate]);

  // Detectar cambios sin guardar
  useEffect(() => {
    if (!open) return;

    const initialName = initialTemplate?.name ?? "";
    const initialDescription = initialTemplate?.description ?? "";
    const initialExercisesCount = Array.isArray(initialTemplate?.schema)
      ? initialTemplate.schema.filter((item) => item.trainingTitle).length
      : 0;
    const initialTrainingsCount = Array.isArray(initialTemplate?.schema)
      ? Array.from(
          new Set(
            initialTemplate.schema
              .map((item) =>
                typeof item?.trainingTitle === "string"
                  ? item.trainingTitle.trim()
                  : "",
              )
              .filter(Boolean),
          ),
        ).length
      : 0;

    const hasChanges =
      name.trim() !== initialName ||
      description.trim() !== initialDescription ||
      selectedExercises.length !== initialExercisesCount ||
      trainingTitles.length !== initialTrainingsCount;

    setHasUnsavedChanges(hasChanges);
  }, [
    open,
    name,
    description,
    selectedExercises,
    trainingTitles,
    initialTemplate,
  ]);

  useEffect(() => {
    if (!manageExercisesDialogOpen) return;
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
  }, [manageExercisesDialogOpen, exerciseSearch]);

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

  const addExercise = (exercise: RoutineExercise) => {
    if (!currentTrainingTitle) {
      toast.error("Error: no hay entrenamiento seleccionado");
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
      trainingTitle: currentTrainingTitle,
      order: 0,
    };

    setSelectedExercises((prev) => [...prev, newExercise]);
    toast.success(`Ejercicio añadido a "${currentTrainingTitle}"`);
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

  const startEditingTrainingTitle = (title: string) => {
    setEditingTrainingTitle(title);
    setEditingTrainingValue(title);
  };

  const confirmEditTrainingTitle = () => {
    if (!editingTrainingTitle) return;
    const newTitle = editingTrainingValue.trim();

    if (!newTitle) {
      toast.error("El nombre del entrenamiento no puede estar vacío");
      return;
    }

    if (
      newTitle !== editingTrainingTitle &&
      trainingTitles.includes(newTitle)
    ) {
      toast.error("Ya existe un entrenamiento con ese nombre");
      return;
    }

    // Actualizar el nombre en trainingTitles
    setTrainingTitles((prev) =>
      prev.map((title) => (title === editingTrainingTitle ? newTitle : title)),
    );

    // Actualizar el nombre en todos los ejercicios que tienen ese entrenamiento
    setSelectedExercises((prev) =>
      prev.map((ex) =>
        ex.trainingTitle === editingTrainingTitle
          ? { ...ex, trainingTitle: newTitle }
          : ex,
      ),
    );

    setEditingTrainingTitle(null);
    setEditingTrainingValue("");
    toast.success("Nombre actualizado");
  };

  const cancelEditTrainingTitle = () => {
    setEditingTrainingTitle(null);
    setEditingTrainingValue("");
  };

  const deleteTrainingTitle = (title: string) => {
    // Eliminar todos los ejercicios de este entrenamiento
    setSelectedExercises((prev) =>
      prev.filter((ex) => ex.trainingTitle !== title),
    );

    // Eliminar el título del entrenamiento
    setTrainingTitles((prev) => prev.filter((t) => t !== title));

    toast.success("Entrenamiento eliminado");
  };

  const handleTrainingDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setTrainingTitles((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);

      if (oldIndex === -1 || newIndex === -1) return prev;

      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setSelectedExercises((prev) => {
      // Filtrar ejercicios del entrenamiento actual
      const currentTrainingExercises = prev.filter(
        (ex) => ex.trainingTitle === currentTrainingTitle,
      );

      // Encontrar índices en el subset usando los IDs
      const oldIndex = currentTrainingExercises.findIndex(
        (ex) => `${ex.exerciseId}-${ex.trainingTitle}` === active.id,
      );
      const newIndex = currentTrainingExercises.findIndex(
        (ex) => `${ex.exerciseId}-${ex.trainingTitle}` === over.id,
      );

      if (oldIndex === -1 || newIndex === -1) return prev;

      // Reordenar el subset
      const reordered = arrayMove(currentTrainingExercises, oldIndex, newIndex);

      // Reconstruir el array: mantener otros entrenamientos y reemplazar el actual
      const result = prev.filter(
        (ex) => ex.trainingTitle !== currentTrainingTitle,
      );

      // Insertar los ejercicios reordenados en la misma posición relativa
      const firstIndex = prev.findIndex(
        (ex) => ex.trainingTitle === currentTrainingTitle,
      );

      result.splice(firstIndex, 0, ...reordered);

      return result;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
      // Reordenar ejercicios según el orden de trainingTitles
      const reorderedExercises = trainingTitles.flatMap((title) =>
        selectedExercises.filter((ex) => ex.trainingTitle === title),
      );

      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        schema: reorderedExercises.map((item, index) => ({
          ...item,
          order: index,
        })),
      });
      setHasUnsavedChanges(false);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseAttempt = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setConfirmCloseOpen(true);
    } else {
      onOpenChange(open);
    }
  };

  const handleConfirmClose = () => {
    setConfirmCloseOpen(false);
    setHasUnsavedChanges(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseAttempt}>
        <DialogContent className="max-h-[90vh] overflow-auto border-gray-800 bg-gray-900 p-5 text-white sm:max-w-3xl">
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

          <div className="space-y-4 overflow-x-hidden">
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
                {trainingTitles.length === 0 ? (
                  <p className="rounded-lg border border-gray-800 bg-gray-800/30 px-3 py-2 text-xs text-gray-500">
                    Crea entrenamientos para comenzar
                  </p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleTrainingDragEnd}
                  >
                    <SortableContext
                      items={trainingTitles}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {groupedSelectedExercises.map((group) => (
                          <SortableTrainingGroup
                            key={`group-${group.title}`}
                            title={group.title}
                            exercises={group.exercises}
                            isEditing={editingTrainingTitle === group.title}
                            editingValue={editingTrainingValue}
                            onEditingChange={setEditingTrainingValue}
                            onConfirmEdit={confirmEditTrainingTitle}
                            onCancelEdit={cancelEditTrainingTitle}
                            onEditTitle={() =>
                              startEditingTrainingTitle(group.title)
                            }
                            onDeleteTraining={() =>
                              deleteTrainingTitle(group.title)
                            }
                            onManageExercises={() => {
                              setCurrentTrainingTitle(group.title);
                              setExerciseSearch("");
                              setManageExercisesDialogOpen(true);
                            }}
                            onRemoveExercise={removeExercise}
                            onUpdateInstructions={updateInstructions}
                            onViewDetail={(exercise) => {
                              setExerciseDetail(exercise);
                              setDetailOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
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
      <Dialog
        open={manageExercisesDialogOpen}
        onOpenChange={setManageExercisesDialogOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-auto border-gray-800 bg-gray-900 p-5 text-white sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gestionar ejercicios</DialogTitle>
            <DialogDescription className="text-gray-400">
              Añade ejercicios a{" "}
              <span className="font-semibold text-orange-300">
                {currentTrainingTitle}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Ejercicios actuales del entrenamiento */}
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-orange-300">
                  Ejercicios en {currentTrainingTitle}
                </label>
                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[11px] font-semibold text-orange-300">
                  {
                    selectedExercises.filter(
                      (ex) => ex.trainingTitle === currentTrainingTitle,
                    ).length
                  }{" "}
                  ejercicio(s)
                </span>
              </div>
              {selectedExercises.filter(
                (ex) => ex.trainingTitle === currentTrainingTitle,
              ).length === 0 ? (
                <p className="text-xs text-gray-500">
                  Aún no hay ejercicios. Busca y añade desde la biblioteca.
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedExercises
                      .filter((ex) => ex.trainingTitle === currentTrainingTitle)
                      .map((ex) => `${ex.exerciseId}-${ex.trainingTitle}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {selectedExercises
                        .map((ex, originalIndex) => ({
                          ...ex,
                          originalIndex,
                        }))
                        .filter(
                          (ex) => ex.trainingTitle === currentTrainingTitle,
                        )
                        .map((ex, idx) => {
                          const uniqueId = `${ex.exerciseId}-${ex.trainingTitle}`;
                          return (
                            <SortableExerciseItem
                              key={uniqueId}
                              exercise={ex}
                              uniqueId={uniqueId}
                              onRemove={() => removeExercise(ex.originalIndex)}
                            />
                          );
                        })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">
                Buscar en la biblioteca
              </label>
              <p className="text-[11px] leading-snug text-gray-500">
                Nombre, categoría, autor o palabras del ejercicio (incluido
                músculo en texto).
              </p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="Ej. remo, espalda, press…"
                  className="border-gray-700 bg-gray-800 pl-10 text-gray-100"
                />
              </div>
            </div>

            <div className="max-h-96 space-y-2 overflow-auto rounded-lg border border-gray-800 bg-gray-800/30 p-2">
              {loadingExercises ? (
                <p className="px-2 py-1 text-xs text-gray-500">Cargando...</p>
              ) : exerciseResults.length === 0 ? (
                <p className="px-2 py-1 text-xs text-gray-500">
                  No hay ejercicios para mostrar
                </p>
              ) : (
                visibleExerciseResults.map((exercise) => {
                  const alreadyAdded = selectedExercises.some(
                    (item) =>
                      item.exerciseId === exercise.id &&
                      item.trainingTitle === currentTrainingTitle,
                  );
                  const primaryMuscles = (
                    exercise.muscleLabelsPrimary?.length
                      ? exercise.muscleLabelsPrimary
                      : getMuscleNames(exercise.muscles)
                  ).slice(0, 4);
                  const secondaryMuscles = (
                    exercise.muscleLabelsSecondary?.length
                      ? exercise.muscleLabelsSecondary
                      : getMuscleNames(exercise.musclesSecondary)
                  ).slice(0, 3);
                  const formatMuscle = (s: string) =>
                    s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;

                  return (
                    <div key={exercise.id} className="space-y-1">
                      <div className="flex items-center gap-3 rounded-md border border-gray-700 bg-gray-900/60 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 w-full items-center gap-2">
                            <p className="min-w-0 shrink truncate text-base font-semibold leading-snug text-white">
                              {exercise.name}
                            </p>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                                exercise.source === "custom"
                                  ? "bg-emerald-500/25 text-emerald-200"
                                  : "bg-blue-500/25 text-blue-200"
                              }`}
                            >
                              {exercise.source === "custom"
                                ? "Tuyo"
                                : "Biblioteca"}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {primaryMuscles.map((muscle, idx) => (
                              <Badge
                                key={`primary-${idx}`}
                                variant="outline"
                                className="h-6 rounded-md border-red-400/50 bg-red-500/20 px-2.5 py-0 text-xs font-bold normal-case text-red-100 shadow-none"
                              >
                                {formatMuscle(muscle)}
                              </Badge>
                            ))}
                            {secondaryMuscles.map((muscle, idx) => (
                              <Badge
                                key={`secondary-${idx}`}
                                variant="outline"
                                className="h-6 rounded-md border-orange-400/50 bg-orange-500/20 px-2.5 py-0 text-xs font-bold normal-case text-orange-100 shadow-none"
                              >
                                {formatMuscle(muscle)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addExercise(exercise)}
                            disabled={alreadyAdded}
                            className={`h-7 gap-1 border-gray-600 px-2 ${
                              alreadyAdded
                                ? "cursor-not-allowed bg-gray-700 text-gray-500"
                                : "bg-transparent text-gray-300 hover:bg-gray-700"
                            }`}
                            title={
                              alreadyAdded ? "Ya añadido" : "Añadir ejercicio"
                            }
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
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
                            className="h-7 px-1.5 text-gray-300 hover:bg-gray-700"
                            title="Ver detalle"
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setManageExercisesDialogOpen(false);
                setCurrentTrainingTitle(null);
              }}
              className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ExerciseDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        exercise={exerciseDetail}
        onEditCustom={
          exerciseDetail?.source === "custom"
            ? () => {
                if (!exerciseDetail) return;
                setEditingCustomExerciseId(exerciseDetail.exerciseId);
                setDetailOpen(false);
                setCustomExerciseEditorOpen(true);
              }
            : undefined
        }
      />
      <CustomExerciseDialog
        open={customExerciseEditorOpen}
        onOpenChange={(next) => {
          if (!next) setEditingCustomExerciseId(null);
          setCustomExerciseEditorOpen(next);
        }}
        editingExerciseId={editingCustomExerciseId}
        onSaved={applyUpdatedCustomExercise}
      />
      <Dialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambios sin guardar</DialogTitle>
            <DialogDescription className="text-gray-400">
              Tienes cambios sin guardar. ¿Qué deseas hacer?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmCloseOpen(false)}
              className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Continuar editando
            </Button>
            <Button
              variant="outline"
              onClick={handleConfirmClose}
              className="border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              Descartar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
