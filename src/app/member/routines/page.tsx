"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import { SafeHtml } from "@/src/app/components/routines/SafeHtml";
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

  const renderExerciseDescription = (
    value: string | string[] | null | undefined,
  ) => {
    if (!value) return null;
    if (Array.isArray(value)) {
      const lines = value.map((line) => line?.trim()).filter(Boolean);
      if (lines.length === 0) return null;
      return (
        <ul className="mt-1 text-xs text-gray-400 [&_li]:ml-4 [&_li]:list-disc">
          {lines.map((line, idx) => (
            <li key={`${idx}-${line}`}>{line}</li>
          ))}
        </ul>
      );
    }
    return (
      <SafeHtml
        html={value}
        className="mt-1 text-xs text-gray-400 [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-1"
      />
    );
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
    if (!activeAssignment) return history;
    return history.filter((item) => item.id !== activeAssignment.id);
  }, [history, activeAssignment]);

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

          {Array.isArray(activeAssignment.schemaSnapshot) &&
            activeAssignment.schemaSnapshot.length > 0 && (
              <div className="mt-4 space-y-2 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Ejercicios
                </p>
                {activeAssignment.schemaSnapshot.map((item, index) => (
                  <div
                    key={`${activeAssignment.id}-${item.exerciseId}-${index}`}
                    className="rounded-md border border-gray-800 bg-gray-900/50 px-3 py-2"
                  >
                    <p className="text-sm text-gray-100">
                      {index + 1}. {item.name ?? "Ejercicio"}
                    </p>
                    {renderExerciseDescription(item.description)}
                    {item.instructions && (
                      <p className="mt-1 text-xs text-gray-400">
                        {item.instructions}
                      </p>
                    )}
                    {(item.imageUrl || item.videoUrl) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        {item.imageUrl && (
                          <a
                            href={item.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-gray-700 px-2 py-1 text-blue-300 hover:bg-gray-800"
                          >
                            Ver imagen
                          </a>
                        )}
                        {item.videoUrl && (
                          <a
                            href={item.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-gray-700 px-2 py-1 text-blue-300 hover:bg-gray-800"
                          >
                            Ver video
                          </a>
                        )}
                      </div>
                    )}
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
            return (
              <div
                key={assignment.id}
                className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">
                    {assignment.template?.name ?? "Rutina"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatRoutineDate(assignment.startDate)} -{" "}
                    {formatRoutineDate(assignment.endDate)}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`border-0 ${STATUS_BADGE_CLASS[status]}`}
                >
                  {ROUTINE_STATUS_LABELS[status]}
                </Badge>
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
