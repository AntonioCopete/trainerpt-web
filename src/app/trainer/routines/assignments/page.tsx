"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarClock, Filter, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import type {
  RoutineAssignment,
  RoutineAssignmentStatus,
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

export default function TrainerRoutineAssignmentsPage() {
  const supabase = createSupabaseBrowser();
  const searchParams = useSearchParams();
  const preselectedMemberId = searchParams.get("memberId") ?? "";

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<RoutineAssignment[]>([]);
  const [memberFilter, setMemberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "" | RoutineAssignmentStatus
  >("");

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/assignments/trainer${
          params.toString() ? `?${params.toString()}` : ""
        }`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const data = await res.json().catch(() => ({}));
      setAssignments(data.assignments ?? []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered = useMemo(() => {
    const query = memberFilter.trim().toLowerCase();
    return assignments.filter((assignment) => {
      if (preselectedMemberId && assignment.memberId !== preselectedMemberId) {
        return false;
      }
      if (!query) return true;
      const fullName = assignment.member?.fullName?.toLowerCase() ?? "";
      const email = assignment.member?.email?.toLowerCase() ?? "";
      return fullName.includes(query) || email.includes(query);
    });
  }, [assignments, memberFilter, preselectedMemberId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Rutinas asignadas</h1>
          <p className="mt-1 text-sm text-gray-400">
            Seguimiento operativo de rutinas enviadas a members
          </p>
        </div>
        <Link
          href="/trainer/routines"
          className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
        >
          Ver plantillas
        </Link>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-gray-800 bg-gray-900/50 p-3 sm:flex-row">
        <div className="relative flex-1">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            placeholder="Filtrar por nombre o email del member"
            className="border-gray-700 bg-gray-800 pl-10 text-gray-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "" | RoutineAssignmentStatus)
            }
            className="h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="scheduled">Programada</option>
            <option value="expired">Finalizada</option>
            <option value="archived">Archivada</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((n) => (
            <div
              key={n}
              className="h-24 animate-pulse rounded-xl border border-gray-800 bg-gray-900/50"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/30 p-8 text-center text-sm text-gray-500">
          No hay asignaciones con los filtros actuales.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((assignment) => {
            const status = assignment.computedStatus || assignment.status;
            return (
              <div
                key={assignment.id}
                className="rounded-xl border border-gray-800 bg-gray-900/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {assignment.template?.name ?? "Rutina"}
                    </p>
                    <p className="text-xs text-gray-400">
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
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <CalendarClock className="h-3.5 w-3.5 text-orange-400" />
                  {formatRoutineDate(assignment.startDate)} -{" "}
                  {formatRoutineDate(assignment.endDate)}
                </div>
                <div className="mt-3">
                  <Link
                    href={`/trainer/routines/assignments/${assignment.id}`}
                    className="inline-flex rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
