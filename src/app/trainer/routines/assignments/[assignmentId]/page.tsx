"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import { ExerciseDetailDialog } from "@/src/app/components/routines/ExerciseDetailDialog";
import type {
  RoutineAssignment,
  RoutineAssignmentStatus,
  RoutineTemplateExercise,
} from "@/src/app/lib/types/routines";
import {
  formatRoutineDate,
  ROUTINE_STATUS_LABELS,
} from "@/src/app/lib/types/routines";

const STATUS_BADGE_CLASS: Record<RoutineAssignmentStatus, string> = {
  active: "bg-green-500/10 text-green-400",
  scheduled: "bg-blue-500/10 text-blue-400",
  expired: "bg-orange-500/10 text-orange-400",
  archived: "bg-gray-500/10 text-gray-300",
};

export default function TrainerRoutineAssignmentDetailPage() {
  const supabase = createSupabaseBrowser();
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = params.assignmentId;

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<RoutineAssignment | null>(null);
  const [exerciseDetailOpen, setExerciseDetailOpen] = useState(false);
  const [exerciseDetail, setExerciseDetail] =
    useState<RoutineTemplateExercise | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/assignments/trainer/${assignmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setAssignment(data.assignment ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (assignmentId) load();
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  const orderedExercises = useMemo(() => {
    if (!Array.isArray(assignment?.schemaSnapshot)) return [];
    return [...assignment.schemaSnapshot].sort((a, b) => a.order - b.order);
  }, [assignment]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-gray-800 bg-gray-900/50"
          />
        ))}
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/30 p-8 text-center text-sm text-gray-500">
        Assignment no encontrado.
      </div>
    );
  }

  const status = assignment.computedStatus || assignment.status;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/trainer/routines/assignments"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a asignaciones
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {assignment.template?.name ?? "Rutina asignada"}
          </h1>
          <p className="text-sm text-gray-400">
            {assignment.member?.fullName
              ? `${assignment.member.fullName} (${assignment.member.email})`
              : assignment.member?.email || "Member"}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={`border-0 ${STATUS_BADGE_CLASS[status]}`}
        >
          {ROUTINE_STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-sm text-gray-300">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <CalendarClock className="h-3.5 w-3.5 text-orange-400" />
          {formatRoutineDate(assignment.startDate)} -{" "}
          {formatRoutineDate(assignment.endDate)}
        </div>
        {assignment.template?.description && (
          <p className="mt-2 text-sm text-gray-300">
            {assignment.template.description}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Ejercicios ({orderedExercises.length})
        </h2>
        {orderedExercises.map((exercise, index) => (
          <div
            key={`${assignment.id}-${exercise.exerciseId}-${index}`}
            className="rounded-xl border border-gray-800 bg-gray-900/60 p-4"
          >
            <p className="font-medium text-white">
              {index + 1}. {exercise.name || "Ejercicio"}
            </p>
            {exercise.instructions && (
              <p className="mt-1 text-xs text-gray-400">
                {exercise.instructions}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setExerciseDetail(exercise);
                setExerciseDetailOpen(true);
              }}
              className="mt-2 rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Ver detalle
            </button>
          </div>
        ))}
      </div>

      <ExerciseDetailDialog
        open={exerciseDetailOpen}
        onOpenChange={setExerciseDetailOpen}
        exercise={exerciseDetail}
      />
    </div>
  );
}
