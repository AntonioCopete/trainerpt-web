"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Edit3, Plus, Search } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import type {
  RoutineExercise,
  RoutineTemplateExercise,
} from "@/src/app/lib/types/routines";
import { ExerciseDetailDialog } from "@/src/app/components/routines/ExerciseDetailDialog";
import { CustomExerciseDialog } from "@/src/app/components/routines/CustomExerciseDialog";

const ALL_PREVIEW_LIMIT = 120;

function routineExerciseToDetailItem(
  ex: RoutineExercise,
): RoutineTemplateExercise {
  const desc = ex.description;
  return {
    exerciseId: ex.id,
    source: ex.source,
    trainerId: ex.trainerId ?? null,
    author: ex.author,
    license: ex.license ?? null,
    name: ex.name,
    description: desc ?? null,
    categoryName: ex.categoryName ?? null,
    imageUrl: ex.imageUrl ?? null,
    videoUrl: ex.videoUrl ?? null,
    imageUrls: ex.imageUrls ?? [],
    videoUrls: ex.videoUrls ?? [],
    instructions: "",
    trainingTitle: "",
    order: 0,
  };
}

interface TrainerExerciseLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrainerExerciseLibraryDialog({
  open,
  onOpenChange,
}: TrainerExerciseLibraryDialogProps) {
  const supabase = createSupabaseBrowser();
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [allExercises, setAllExercises] = useState<RoutineExercise[]>([]);
  const [mineExercises, setMineExercises] = useState<RoutineExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailExercise, setDetailExercise] =
    useState<RoutineTemplateExercise | null>(null);
  const [customFormOpen, setCustomFormOpen] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDebouncedQ(search), 300);
    return () => clearTimeout(t);
  }, [search, open]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedQ("");
      setTab("all");
      setDetailOpen(false);
      setDetailExercise(null);
      setCustomFormOpen(false);
      setEditingExerciseId(null);
    }
  }, [open]);

  const fetchAllExercises = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const q = debouncedQ.trim();
      const url = q
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/exercises?q=${encodeURIComponent(q)}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/exercises`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      setAllExercises(Array.isArray(data.exercises) ? data.exercises : []);
    } catch {
      setAllExercises([]);
    }
  }, [debouncedQ, supabase]);

  const fetchMineExercises = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const q = debouncedQ.trim();
      const url = q
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/exercises/custom?q=${encodeURIComponent(q)}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/exercises/custom`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      setMineExercises(Array.isArray(data.exercises) ? data.exercises : []);
    } catch {
      setMineExercises([]);
    }
  }, [debouncedQ, supabase]);

  const refreshBoth = useCallback(async () => {
    await Promise.all([fetchAllExercises(), fetchMineExercises()]);
  }, [fetchAllExercises, fetchMineExercises]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (tab === "all") await fetchAllExercises();
        else await fetchMineExercises();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, tab, debouncedQ, fetchAllExercises, fetchMineExercises]);

  const visibleAll = useMemo(
    () => allExercises.slice(0, ALL_PREVIEW_LIMIT),
    [allExercises],
  );

  const openDetail = (ex: RoutineExercise) => {
    setDetailExercise(routineExerciseToDetailItem(ex));
    setDetailOpen(true);
  };

  const openCreateCustom = () => {
    setEditingExerciseId(null);
    setCustomFormOpen(true);
  };

  const openEditCustom = (id: string) => {
    setEditingExerciseId(id);
    setCustomFormOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(85vh,720px)] max-w-2xl flex-col border-gray-800 bg-gray-900 text-white">
          <DialogHeader className="shrink-0 space-y-1">
            <DialogTitle>Biblioteca de ejercicios</DialogTitle>
            <DialogDescription className="text-gray-400">
              Consulta el catálogo completo o solo tus movimientos propios. Los
              ejercicios propios puedes crearlos y editarlos aquí.
            </DialogDescription>
          </DialogHeader>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
              onClick={openCreateCustom}
            >
              <Plus className="h-4 w-4" />
              Nuevo ejercicio propio
            </Button>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "all" | "mine")}
            className="flex min-h-0 flex-1 flex-col gap-3"
          >
            <TabsList
              variant="line"
              className="h-auto w-full shrink-0 justify-start border-b border-gray-800 bg-transparent p-0"
            >
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent px-3 py-2 text-gray-400 data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                Todos
              </TabsTrigger>
              <TabsTrigger
                value="mine"
                className="rounded-none border-b-2 border-transparent px-3 py-2 text-gray-400 data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                Mis propios
              </TabsTrigger>
            </TabsList>

            <div className="relative shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === "all"
                    ? "Buscar en todo el catálogo…"
                    : "Buscar en tus ejercicios…"
                }
                className="border-gray-700 bg-gray-800 pl-10 text-gray-100"
              />
            </div>

            <TabsContent
              value="all"
              className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
            >
              <div className="max-h-[min(42vh,380px)] space-y-2 overflow-y-auto pr-1">
                {loading ? (
                  <ListSkeleton />
                ) : visibleAll.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">
                    {debouncedQ.trim()
                      ? "Sin resultados."
                      : "No hay ejercicios disponibles."}
                  </p>
                ) : (
                  visibleAll.map((ex) => (
                    <ExerciseLibraryRow
                      key={ex.id}
                      exercise={ex}
                      showOriginBadge
                      onView={() => openDetail(ex)}
                      onEdit={
                        ex.source === "custom"
                          ? () => openEditCustom(ex.id)
                          : undefined
                      }
                    />
                  ))
                )}
                {!loading && allExercises.length > ALL_PREVIEW_LIMIT && (
                  <p className="py-2 text-center text-xs text-gray-500">
                    Mostrando {ALL_PREVIEW_LIMIT} de {allExercises.length}.
                    Acota la búsqueda para ver menos resultados.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="mine"
              className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
            >
              <div className="max-h-[min(42vh,380px)] space-y-2 overflow-y-auto pr-1">
                {loading ? (
                  <ListSkeleton />
                ) : mineExercises.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">
                    {debouncedQ.trim()
                      ? "Ningún ejercicio coincide."
                      : "Aún no tienes ejercicios propios. Usa «Nuevo ejercicio propio»."}
                  </p>
                ) : (
                  mineExercises.map((ex) => (
                    <ExerciseLibraryRow
                      key={ex.id}
                      exercise={ex}
                      showOriginBadge={false}
                      onView={() => openDetail(ex)}
                      onEdit={() => openEditCustom(ex.id)}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="shrink-0 border-t border-gray-800 pt-3 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExerciseDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        exercise={detailExercise}
        onEditCustom={
          detailExercise?.source === "custom"
            ? () => {
                if (!detailExercise) return;
                setDetailOpen(false);
                openEditCustom(detailExercise.exerciseId);
              }
            : undefined
        }
      />

      <CustomExerciseDialog
        open={customFormOpen}
        onOpenChange={(next) => {
          if (!next) setEditingExerciseId(null);
          setCustomFormOpen(next);
        }}
        editingExerciseId={editingExerciseId}
        onCreated={() => void refreshBoth()}
        onSaved={() => void refreshBoth()}
      />
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2 py-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-lg border border-gray-800/80 bg-gray-900/50"
        />
      ))}
    </div>
  );
}

function ExerciseLibraryRow({
  exercise,
  showOriginBadge,
  onView,
  onEdit,
}: {
  exercise: RoutineExercise;
  showOriginBadge: boolean;
  onView: () => void;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-800/90 bg-gray-900/50 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-white">
            {exercise.name}
          </p>
          {showOriginBadge ? (
            exercise.source === "custom" ? (
              <Badge className="border-0 bg-emerald-500/20 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                Tuyo
              </Badge>
            ) : (
              <Badge className="border-0 bg-gray-700/80 text-[10px] font-semibold uppercase tracking-wide text-gray-300">
                Biblioteca
              </Badge>
            )
          ) : null}
        </div>
        {exercise.muscleLabelsPrimary &&
        exercise.muscleLabelsPrimary.length > 0 ? (
          <div className="mt-0.5 truncate text-xs text-gray-500">
            {exercise.muscleLabelsPrimary.slice(0, 3).join(", ")}
            {exercise.muscleLabelsPrimary.length > 3 ? "…" : ""}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          onClick={onView}
          title="Ver detalle"
        >
          <Eye className="h-4 w-4" />
        </Button>
        {onEdit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 border-gray-700 bg-transparent px-2 text-gray-300 hover:bg-gray-800 hover:text-white"
            onClick={onEdit}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Editar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
