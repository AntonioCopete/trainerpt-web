"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import { ExerciseDetailDialog } from "@/src/app/components/routines/ExerciseDetailDialog";
import type {
  RoutineAssignment,
  RoutineTemplateExercise,
} from "@/src/app/lib/types/routines";
import {
  formatRoutineDate,
  ROUTINE_STATUS_LABELS,
} from "@/src/app/lib/types/routines";

const STATUS_BADGE_CLASS: Record<string, string> = {
  active: "bg-green-500/10 text-green-400",
  scheduled: "bg-blue-500/10 text-blue-400",
  expired: "bg-orange-500/10 text-orange-400",
  archived: "bg-gray-500/10 text-gray-300",
};

export default function MemberRoutinesPage() {
  const supabase = createSupabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [activeAssignment, setActiveAssignment] =
    useState<RoutineAssignment | null>(null);
  const [history, setHistory] = useState<RoutineAssignment[]>([]);
  const [exerciseDetailOpen, setExerciseDetailOpen] = useState(false);
  const [exerciseDetail, setExerciseDetail] =
    useState<RoutineTemplateExercise | null>(null);
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(
    new Set(),
  );

  const toggleHistoryExpanded = (assignmentId: string) => {
    setExpandedHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(assignmentId)) {
        next.delete(assignmentId);
      } else {
        next.add(assignmentId);
      }
      return next;
    });
  };

  const fetchRoutines = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const [activeRes, historyRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/my-active`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/my-history`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
      ]);

      const activeData = await activeRes.json().catch(() => ({}));
      const historyData = await historyRes.json().catch(() => ({}));

      setActiveAssignment(activeData.assignment ?? null);
      setHistory(historyData.assignments ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const historyWithoutActive = useMemo(() => {
    const notActive = !activeAssignment
      ? history
      : history.filter((item) => item.id !== activeAssignment.id);
    // Ocultar asignaciones archivadas por el entrenador (canceladas).
    return notActive.filter((item) => {
      const s = item.computedStatus ?? item.status;
      return s !== "archived";
    });
  }, [history, activeAssignment]);

  const groupedExercises = useMemo(() => {
    const snapshot = Array.isArray(activeAssignment?.schemaSnapshot)
      ? activeAssignment.schemaSnapshot
      : [];
    const groups = new Map<string, RoutineTemplateExercise[]>();
    snapshot.forEach((item) => {
      const title =
        typeof item.trainingTitle === "string" && item.trainingTitle.trim()
          ? item.trainingTitle.trim()
          : "Entrenamiento";
      const current = groups.get(title) ?? [];
      current.push(item);
      groups.set(title, current);
    });
    return Array.from(groups.entries()).map(([title, exercises]) => ({
      title,
      exercises,
    }));
  }, [activeAssignment]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-gray-800 bg-gray-900/60"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mi rutina</h1>
        <p className="mt-1 text-sm text-gray-400">
          Consulta la rutina vigente asignada por tu entrenador
        </p>
      </div>

      {!activeAssignment ? (
        <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/30 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-800/60">
            <Dumbbell className="h-7 w-7 text-gray-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-300">
            Sin rutina activa
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Tu entrenador te asignara una rutina en breve.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-white">
                {activeAssignment.template?.name ?? "Rutina"}
              </p>
              <p className="mt-1 text-sm text-gray-300">
                {activeAssignment.template?.description ?? "Sin descripcion"}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={`border-0 ${
                STATUS_BADGE_CLASS[activeAssignment.computedStatus || "active"]
              }`}
            >
              {
                ROUTINE_STATUS_LABELS[
                  activeAssignment.computedStatus || "active"
                ]
              }
            </Badge>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
            <CalendarClock className="h-4 w-4 text-orange-400" />
            Vigencia: {formatRoutineDate(activeAssignment.startDate)} -{" "}
            {formatRoutineDate(activeAssignment.endDate)}
          </div>

          {groupedExercises.length > 0 && (
            <div className="mt-4 space-y-2 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Ejercicios
              </p>
              {groupedExercises.map((group, groupIdx) => (
                <div
                  key={`${activeAssignment.id}-group-${groupIdx}-${group.title}`}
                  className="rounded-lg border border-gray-800 bg-gray-900/50 p-3"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-300">
                    {group.title}
                  </p>
                  <div className="space-y-2">
                    {group.exercises.map((item, index) => (
                      <div
                        key={`${activeAssignment.id}-${group.title}-${item.exerciseId}-${index}`}
                        className="rounded-md border border-gray-800 bg-gray-900/50 px-3 py-2"
                      >
                        <p className="text-sm text-gray-100">
                          {index + 1}. {item.name ?? "Ejercicio"}
                        </p>
                        {item.instructions && item.instructions.trim() && (
                          <p className="mt-1 text-xs text-orange-300">
                            {item.instructions}
                          </p>
                        )}
                        {(() => {
                          const imageCandidates = Array.isArray(item.imageUrls)
                            ? item.imageUrls
                            : item.imageUrl
                              ? [item.imageUrl]
                              : [];
                          const previewImages = imageCandidates.slice(0, 2);
                          if (previewImages.length === 0) return null;
                          return (
                            <div className="mt-2 grid max-w-xs grid-cols-2 gap-2">
                              {previewImages.map((url, imgIdx) => (
                                <img
                                  key={`${item.exerciseId}-${imgIdx}-${url}`}
                                  src={url}
                                  alt={item.name ?? "Ejercicio"}
                                  className="h-20 w-full rounded-md border border-gray-700 bg-gray-800 object-cover"
                                />
                              ))}
                            </div>
                          );
                        })()}
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-gray-700 bg-transparent text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
                            onClick={() => {
                              setExerciseDetail(item);
                              setExerciseDetailOpen(true);
                            }}
                          >
                            Ver detalle
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Historial
        </h2>
        {historyWithoutActive.length === 0 ? (
          <p className="rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3 text-sm text-gray-500">
            No hay rutinas anteriores.
          </p>
        ) : (
          historyWithoutActive.map((assignment) => {
            const status = assignment.computedStatus || assignment.status;
            const isExpanded = expandedHistoryIds.has(assignment.id);

            const groupedHistoryExercises = (() => {
              const snapshot = Array.isArray(assignment.schemaSnapshot)
                ? assignment.schemaSnapshot
                : [];
              const groups = new Map<string, RoutineTemplateExercise[]>();
              snapshot.forEach((item) => {
                const title =
                  typeof item.trainingTitle === "string" &&
                  item.trainingTitle.trim()
                    ? item.trainingTitle.trim()
                    : "Entrenamiento";
                const current = groups.get(title) ?? [];
                current.push(item);
                groups.set(title, current);
              });
              return Array.from(groups.entries()).map(([title, exercises]) => ({
                title,
                exercises,
              }));
            })();

            return (
              <div
                key={assignment.id}
                className="rounded-xl border border-gray-800 bg-gray-900/60 p-4"
              >
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => toggleHistoryExpanded(assignment.id)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">
                      {assignment.template?.name ?? "Rutina"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatRoutineDate(assignment.startDate)} -{" "}
                      {formatRoutineDate(assignment.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`border-0 ${STATUS_BADGE_CLASS[status]}`}
                    >
                      {ROUTINE_STATUS_LABELS[status]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:bg-gray-800 hover:text-white"
                    >
                      {isExpanded ? "Ocultar" : "Ver detalles"}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4">
                    {assignment.template?.description && (
                      <p className="mb-3 text-sm text-gray-300">
                        {assignment.template.description}
                      </p>
                    )}

                    {groupedHistoryExercises.length > 0 && (
                      <div className="space-y-2 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Ejercicios
                        </p>
                        {groupedHistoryExercises.map((group, groupIdx) => (
                          <div
                            key={`${assignment.id}-history-group-${groupIdx}-${group.title}`}
                            className="rounded-lg border border-gray-800 bg-gray-900/50 p-3"
                          >
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-300">
                              {group.title}
                            </p>
                            <div className="space-y-2">
                              {group.exercises.map((item, index) => (
                                <div
                                  key={`${assignment.id}-history-${group.title}-${item.exerciseId}-${index}`}
                                  className="rounded-md border border-gray-800 bg-gray-900/50 px-3 py-2"
                                >
                                  <p className="text-sm text-gray-100">
                                    {index + 1}. {item.name ?? "Ejercicio"}
                                  </p>
                                  {item.instructions &&
                                    item.instructions.trim() && (
                                      <p className="mt-1 text-xs text-orange-300">
                                        {item.instructions}
                                      </p>
                                    )}
                                  {(() => {
                                    const imageCandidates = Array.isArray(
                                      item.imageUrls,
                                    )
                                      ? item.imageUrls
                                      : item.imageUrl
                                        ? [item.imageUrl]
                                        : [];
                                    const previewImages = imageCandidates.slice(
                                      0,
                                      2,
                                    );
                                    if (previewImages.length === 0) return null;
                                    return (
                                      <div className="mt-2 grid max-w-xs grid-cols-2 gap-2">
                                        {previewImages.map((url, imgIdx) => (
                                          <img
                                            key={`${item.exerciseId}-history-${imgIdx}-${url}`}
                                            src={url}
                                            alt={item.name ?? "Ejercicio"}
                                            className="h-20 w-full rounded-md border border-gray-700 bg-gray-800 object-cover"
                                          />
                                        ))}
                                      </div>
                                    );
                                  })()}
                                  <div className="mt-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="border-gray-700 bg-transparent text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExerciseDetail(item);
                                        setExerciseDetailOpen(true);
                                      }}
                                    >
                                      Ver detalle
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <ExerciseDetailDialog
        open={exerciseDetailOpen}
        onOpenChange={setExerciseDetailOpen}
        exercise={exerciseDetail}
      />
    </div>
  );
}
