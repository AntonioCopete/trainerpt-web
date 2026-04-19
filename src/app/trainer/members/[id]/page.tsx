"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  ClipboardList,
  Dumbbell,
  Send,
  Clock,
  CheckCircle2,
  Eye,
  X,
  Calendar,
  AlertCircle,
  Lock,
  FolderOpen,
  // UtensilsCrossed, // reactivar con pestaña Dietas comentada abajo
  TrendingUp,
  Archive,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { MemberSummary, FormAssignment } from "@/src/app/lib/types/forms";
import {
  formatAssignmentSentDate,
  getAssignmentWindowStatus,
  isFormAssignmentNotCompleted,
  isFormAssignmentTrainerPendingTab,
} from "@/src/app/lib/types/forms";
import { SendFormDialog } from "@/src/app/components/forms/SendFormDialog";
import type { FormTemplate } from "@/src/app/lib/types/forms";
import type {
  RoutineTemplate,
  RoutineAssignment,
  RoutineTemplateExercise,
} from "@/src/app/lib/types/routines";
import {
  formatRoutineDate,
  ROUTINE_STATUS_LABELS,
} from "@/src/app/lib/types/routines";
import { AssignRoutineDialog } from "@/src/app/components/routines/AssignRoutineDialog";
import { CustomRoutineDialog } from "@/src/app/components/routines/CustomRoutineDialog";
import { ExerciseDetailDialog } from "@/src/app/components/routines/ExerciseDetailDialog";
import { TrainerResourceManager } from "@/src/app/components/resources/TrainerResourceManager";
import { MemberProgressPanel } from "@/src/app/components/forms/MemberProgressPanel";
import { toast } from "sonner";

const ROUTINE_STATUS_BADGE_CLASS: Record<string, string> = {
  active: "bg-green-500/10 text-green-400",
  scheduled: "bg-blue-500/10 text-blue-400",
  expired: "bg-orange-500/10 text-orange-400",
  archived: "bg-gray-500/10 text-gray-300",
};

export default function TrainerClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState("forms");
  const [activeFormsHistoryTab, setActiveFormsHistoryTab] = useState("pending");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [routineTemplates, setRoutineTemplates] = useState<RoutineTemplate[]>(
    [],
  );
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [routineAssignments, setRoutineAssignments] = useState<
    RoutineAssignment[]
  >([]);
  const [templateToSend, setTemplateToSend] = useState<FormTemplate | null>(
    null,
  );
  const [routineToSend, setRoutineToSend] = useState<RoutineTemplate | null>(
    null,
  );
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [customRoutineDialogOpen, setCustomRoutineDialogOpen] = useState(false);
  const [cancellingAssignmentId, setCancellingAssignmentId] = useState<
    string | null
  >(null);
  const [unlinkingMember, setUnlinkingMember] = useState(false);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [expandedRoutineHistoryIds, setExpandedRoutineHistoryIds] = useState<
    Set<string>
  >(new Set());
  const [routineExerciseDetailOpen, setRoutineExerciseDetailOpen] =
    useState(false);
  const [routineExerciseDetail, setRoutineExerciseDetail] =
    useState<RoutineTemplateExercise | null>(null);
  const [routineToArchiveId, setRoutineToArchiveId] = useState<string | null>(
    null,
  );
  const [archivingRoutineId, setArchivingRoutineId] = useState<string | null>(
    null,
  );
  const supabase = createSupabaseBrowser();

  const toggleRoutineHistoryExpanded = (assignmentId: string) => {
    setExpandedRoutineHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(assignmentId)) next.delete(assignmentId);
      else next.add(assignmentId);
      return next;
    });
  };

  const openSendDialog = (template: FormTemplate) => {
    setTemplateToSend(template);
    setSendDialogOpen(true);
  };

  const refreshAssignments = async () => {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    if (!token) return;

    const assignmentsRes = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/assignments?memberId=${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (assignmentsRes.ok) {
      const data = await assignmentsRes.json();
      const list: FormAssignment[] = data.assignments ?? data ?? [];
      setAssignments(list);
    } else {
      setAssignments([]);
    }
  };

  const refreshRoutineAssignments = async () => {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    if (!token) return;

    const routineAssignmentsRes = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/assignments?memberId=${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (routineAssignmentsRes.ok) {
      const data = await routineAssignmentsRes.json();
      const list: RoutineAssignment[] = data.assignments ?? data ?? [];
      setRoutineAssignments(list);
    } else {
      setRoutineAssignments([]);
    }
  };

  const handleConfirmArchiveRoutine = async () => {
    if (!routineToArchiveId) return;
    setArchivingRoutineId(routineToArchiveId);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) throw new Error("Sesión expirada");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/assignments/${routineToArchiveId}/archive`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        const text = await res.text();
        let msg = "No se pudo archivar la asignación.";
        try {
          const j = JSON.parse(text) as { message?: string };
          if (j.message) msg = j.message;
        } catch {
          if (text) msg = text.slice(0, 200);
        }
        throw new Error(msg);
      }

      toast.success("Asignación archivada");
      setRoutineToArchiveId(null);
      setExpandedRoutineHistoryIds((prev) => {
        const next = new Set(prev);
        next.delete(routineToArchiveId);
        return next;
      });
      await refreshRoutineAssignments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al archivar");
    } finally {
      setArchivingRoutineId(null);
    }
  };

  const handleCancelRecurringAssignment = async (assignmentId: string) => {
    setCancellingAssignmentId(assignmentId);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) throw new Error("Sesión expirada");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/assignments/${assignmentId}/cancel`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        toast.success("Recurrencia cancelada");
        await refreshAssignments();
      } else {
        toast.error("Error al cancelar la recurrencia");
      }
    } catch {
      toast.error("Error al cancelar la recurrencia");
    } finally {
      setCancellingAssignmentId(null);
    }
  };

  const handleUnlinkMember = () => {
    setUnlinkConfirmOpen(true);
  };

  const handleConfirmUnlinkMember = async () => {
    setUnlinkingMember(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) throw new Error("Sesión expirada");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/members/${id}/unlink`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        toast.success("Member desvinculado correctamente");
        router.push("/trainer/members");
      } else {
        toast.error("Error al desvincular el member");
      }
    } catch {
      toast.error("Error al desvincular el member");
    } finally {
      setUnlinkingMember(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;

        const [
          membersRes,
          templatesRes,
          assignmentsRes,
          routineTemplatesRes,
          routineAssignmentsRes,
        ] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/members/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/assignments?memberId=${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            },
          ),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/templates`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/assignments?memberId=${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            },
          ),
        ]);

        if (cancelled) return;

        if (membersRes.ok) {
          const data = await membersRes.json();
          setMember(data.member ?? null);
        } else {
          setMember(null);
        }

        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates(data.templates ?? []);
        }
        if (routineTemplatesRes.ok) {
          const data = await routineTemplatesRes.json();
          setRoutineTemplates(data.templates ?? []);
        }

        if (assignmentsRes.ok) {
          const data = await assignmentsRes.json();
          const list: FormAssignment[] = data.assignments ?? data ?? [];
          setAssignments(list);
        } else {
          setAssignments([]);
        }

        if (routineAssignmentsRes.ok) {
          const data = await routineAssignmentsRes.json();
          const list: RoutineAssignment[] = data.assignments ?? data ?? [];
          setRoutineAssignments(list);
        } else {
          setRoutineAssignments([]);
        }
      } catch {
        if (!cancelled) setMember(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const sortedFormAssignments = useMemo(
    () =>
      [...assignments].sort(
        (a, b) =>
          new Date(b.createdAt ?? b.sentAt ?? 0).getTime() -
          new Date(a.createdAt ?? a.sentAt ?? 0).getTime(),
      ),
    [assignments],
  );

  const trainerPendingTabAssignments = useMemo(
    () => sortedFormAssignments.filter(isFormAssignmentTrainerPendingTab),
    [sortedFormAssignments],
  );

  /** Historial del trainer: no listar cancelaciones (archivadas) para mantener la vista limpia. */
  const visibleRoutineAssignmentsForHistory = useMemo(
    () =>
      routineAssignments.filter((a) => {
        const s = a.computedStatus ?? a.status;
        return s !== "archived";
      }),
    [routineAssignments],
  );
  const trainerNotCompletedAssignments = useMemo(
    () => sortedFormAssignments.filter(isFormAssignmentNotCompleted),
    [sortedFormAssignments],
  );
  const trainerCompletedAssignments = useMemo(
    () => sortedFormAssignments.filter((a) => a.status === "completed"),
    [sortedFormAssignments],
  );

  function renderFormAssignmentRow(assignment: FormAssignment) {
    const sentDate = formatAssignmentSentDate(assignment);
    const windowStatus = getAssignmentWindowStatus(assignment);
    const notCompleted = isFormAssignmentNotCompleted(assignment);

    return (
      <div
        key={assignment.id}
        className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-800/30 px-4 py-3"
      >
        <div>
          <p className="font-medium text-white">
            {assignment.template?.name ?? "Formulario"}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            Enviado el {sentDate}
            {assignment.status === "completed" && (
              <span className="ml-2 text-[11px] text-gray-500">
                · Completado
              </span>
            )}
          </p>
          {(assignment.status === "pending" ||
            assignment.status === "missed") &&
            windowStatus.hasWindow && (
              <p
                className={`mt-1 flex flex-wrap items-center gap-1 text-xs ${
                  assignment.status === "missed" || windowStatus.isOverdue
                    ? "text-red-400"
                    : windowStatus.isBeforeWindow
                      ? "text-gray-400"
                      : "text-orange-400"
                }`}
              >
                <Calendar className="h-3 w-3 shrink-0" />
                <span>
                  {windowStatus.statusText}
                  {windowStatus.isBeforeWindow &&
                    windowStatus.dueAtFormatted && (
                      <span className="text-gray-500">
                        {" "}
                        · límite {windowStatus.dueAtFormatted}
                      </span>
                    )}
                </span>
              </p>
            )}
          {(assignment.status === "completed" ||
            assignment.status === "archived") &&
            windowStatus.dueAtFormatted && (
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3 shrink-0" />
                Límite: {windowStatus.dueAtFormatted}
              </p>
            )}
        </div>
        <div className="flex items-center gap-2">
          {assignment.status === "completed" ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Completado
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  router.push(`/trainer/assignments/${assignment.id}`)
                }
                className="gap-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <Eye className="h-3.5 w-3.5" />
                Ver respuesta
              </Button>
            </>
          ) : assignment.status === "archived" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 text-[11px] font-medium text-gray-300">
              <Clock className="h-3 w-3" />
              Cancelado
            </span>
          ) : notCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">
              <AlertCircle className="h-3 w-3" />
              No completado
            </span>
          ) : assignment.status === "pending" && windowStatus.isBeforeWindow ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-600/25 px-2 py-0.5 text-[11px] font-medium text-gray-300">
                <Lock className="h-3 w-3" />
                Pendiente · aún no disponible
              </span>
              {assignment.repeat && assignment.repeat !== "none" && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={cancellingAssignmentId === assignment.id}
                  onClick={() => handleCancelRecurringAssignment(assignment.id)}
                  className="gap-1 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <X className="h-3.5 w-3.5" />
                  {cancellingAssignmentId === assignment.id
                    ? "Cancelando..."
                    : "Cancelar"}
                </Button>
              )}
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-400">
                <Clock className="h-3 w-3" />
                Pendiente
              </span>
              {assignment.repeat && assignment.repeat !== "none" && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={cancellingAssignmentId === assignment.id}
                  onClick={() => handleCancelRecurringAssignment(assignment.id)}
                  className="gap-1 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <X className="h-3.5 w-3.5" />
                  {cancellingAssignmentId === assignment.id
                    ? "Cancelando..."
                    : "Cancelar"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-red-500" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.push("/trainer/members")}
          className="rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="py-20 text-center text-gray-500">
          Cliente no encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push("/trainer/members")}
            className="mt-1 rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
              <User className="h-7 w-7 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {member.fullName || "Sin nombre"}
              </h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-4 w-4" />
                {member.email}
              </p>
            </div>
            <div className="flex items-start">
              <Button
                variant="outline"
                size="sm"
                disabled={unlinkingMember}
                onClick={handleUnlinkMember}
                className="gap-1 border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <X className="h-4 w-4" />
                {unlinkingMember ? "Desvinculando..." : "Desvincular"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={unlinkConfirmOpen} onOpenChange={setUnlinkConfirmOpen}>
        <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Desvincular cliente
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Esto archivará los formularios pendientes recurrentes de esta
              relación.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnlinkConfirmOpen(false)}
              className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
              disabled={unlinkingMember}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                setUnlinkConfirmOpen(false);
                await handleConfirmUnlinkMember();
              }}
              disabled={unlinkingMember}
              className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            >
              {unlinkingMember ? "Desvinculando..." : "Desvincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={routineToArchiveId !== null}
        onOpenChange={(open) => {
          if (!open) setRoutineToArchiveId(null);
        }}
      >
        <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Archivar asignación de rutina
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              El cliente dejará de ver esta rutina como vigente. Podrás asignar
              otra en el mismo periodo después de archivar. Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoutineToArchiveId(null)}
              className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
              disabled={archivingRoutineId !== null}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleConfirmArchiveRoutine()}
              disabled={archivingRoutineId !== null}
              className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            >
              {archivingRoutineId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Archivando…
                </>
              ) : (
                "Archivar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs
        value={activeMainTab}
        onValueChange={setActiveMainTab}
        className="w-full"
      >
        <div className="mb-2 sm:hidden">
          <Select value={activeMainTab} onValueChange={setActiveMainTab}>
            <SelectTrigger className="w-full rounded-xl border-gray-800 bg-gray-900/80 text-white">
              <SelectValue placeholder="Seleccionar sección" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="forms">Formularios</SelectItem>
              <SelectItem value="progress">Progreso</SelectItem>
              <SelectItem value="routines">Rutinas</SelectItem>
              <SelectItem value="resources">Recursos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsList className="mb-2 hidden h-auto w-full flex-col gap-2 rounded-xl border border-gray-800 bg-gray-900/80 p-2 sm:flex sm:flex-row sm:flex-wrap sm:gap-1">
          <TabsTrigger
            value="forms"
            className="flex-1 gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm text-gray-400 data-[state=active]:border-gray-700 data-[state=active]:bg-gray-800 data-[state=active]:text-white sm:flex-initial"
          >
            <ClipboardList className="h-4 w-4 shrink-0 text-red-400" />
            Formularios
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            className="flex-1 gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm text-gray-400 data-[state=active]:border-gray-700 data-[state=active]:bg-gray-800 data-[state=active]:text-white sm:flex-initial"
          >
            <TrendingUp className="h-4 w-4 shrink-0 text-emerald-400" />
            Progreso
          </TabsTrigger>
          <TabsTrigger
            value="routines"
            className="flex-1 gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm text-gray-400 data-[state=active]:border-gray-700 data-[state=active]:bg-gray-800 data-[state=active]:text-white sm:flex-initial"
          >
            <Dumbbell className="h-4 w-4 shrink-0 text-orange-400" />
            Rutinas
          </TabsTrigger>
          {/*
          <TabsTrigger
            value="diets"
            className="flex-1 gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm text-gray-400 data-[state=active]:border-gray-700 data-[state=active]:bg-gray-800 data-[state=active]:text-white sm:flex-initial"
          >
            <UtensilsCrossed className="h-4 w-4 shrink-0 text-amber-400" />
            Dietas
          </TabsTrigger>
          */}
          <TabsTrigger
            value="resources"
            className="flex-1 gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm text-gray-400 data-[state=active]:border-gray-700 data-[state=active]:bg-gray-800 data-[state=active]:text-white sm:flex-initial"
          >
            <FolderOpen className="h-4 w-4 shrink-0 text-amber-400" />
            Recursos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="mt-0 space-y-6 outline-none">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <ClipboardList className="h-4 w-4 text-red-400" />
              Enviar formulario
            </h2>
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500">
                No tienes plantillas. Crea una en Formularios para poder
                enviarla.
              </p>
            ) : (
              <div className="space-y-2">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-800/30 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">{tpl.name}</p>
                      {tpl.description && (
                        <p className="max-w-md truncate text-xs text-gray-500">
                          {tpl.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openSendDialog(tpl)}
                      className="shrink-0 gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Enviar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">
              Historial de formularios
            </h2>
            {assignments.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aún no has enviado ningún formulario a este miembro.
              </p>
            ) : (
              <Tabs
                value={activeFormsHistoryTab}
                onValueChange={setActiveFormsHistoryTab}
                className="w-full"
              >
                <div className="mb-4 sm:hidden">
                  <Select
                    value={activeFormsHistoryTab}
                    onValueChange={setActiveFormsHistoryTab}
                  >
                    <SelectTrigger className="w-full rounded-xl border-gray-800 bg-gray-900 text-white">
                      <SelectValue placeholder="Filtrar historial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        Pendientes
                        {trainerPendingTabAssignments.length > 0
                          ? ` (${trainerPendingTabAssignments.length})`
                          : ""}
                      </SelectItem>
                      <SelectItem value="notCompleted">
                        No completados
                      </SelectItem>
                      <SelectItem value="completed">Completados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <TabsList className="mb-4 hidden h-auto min-h-10 w-full flex-wrap gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1 sm:flex">
                  <TabsTrigger
                    value="pending"
                    className="rounded-lg data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400"
                  >
                    Pendientes
                    {trainerPendingTabAssignments.length > 0 && (
                      <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-orange-400">
                        {trainerPendingTabAssignments.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="notCompleted"
                    className="rounded-lg data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400"
                  >
                    No completados
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="rounded-lg data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400"
                  >
                    Completados
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-0 space-y-2">
                  {trainerPendingTabAssignments.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No hay formularios pendientes de completar (ni
                      cancelados).
                    </p>
                  ) : (
                    trainerPendingTabAssignments.map(renderFormAssignmentRow)
                  )}
                </TabsContent>
                <TabsContent value="notCompleted" className="mt-0 space-y-2">
                  {trainerNotCompletedAssignments.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No hay envíos vencidos sin completar.
                    </p>
                  ) : (
                    trainerNotCompletedAssignments.map(renderFormAssignmentRow)
                  )}
                </TabsContent>
                <TabsContent value="completed" className="mt-0 space-y-2">
                  {trainerCompletedAssignments.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Aún no hay formularios completados.
                    </p>
                  ) : (
                    trainerCompletedAssignments.map(renderFormAssignmentRow)
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="mt-0 outline-none">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Evolución del cliente
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Medidas y fotos de los formularios ya completados, en orden
              cronológico.
            </p>
            <MemberProgressPanel memberId={id} />
          </div>
        </TabsContent>

        <TabsContent value="routines" className="mt-0 space-y-6 outline-none">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Dumbbell className="h-4 w-4 text-orange-400" />
              Asignar rutina
            </h2>
            {routineTemplates.length === 0 ? (
              <p className="text-sm text-gray-500">
                No tienes rutinas. Crea una en Rutinas para poder asignarla.
              </p>
            ) : (
              <div className="space-y-2">
                {routineTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-800/30 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">{tpl.name}</p>
                      {tpl.description && (
                        <p className="max-w-md truncate text-xs text-gray-500">
                          {tpl.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setRoutineToSend(tpl);
                        setRoutineDialogOpen(true);
                      }}
                      className="shrink-0 gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Asignar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">
              Historial de rutinas
            </h2>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setCustomRoutineDialogOpen(true)}
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
              >
                <Dumbbell className="h-3.5 w-3.5" />
                Nueva rutina personalizada
              </Button>
            </div>
            {visibleRoutineAssignmentsForHistory.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aún no has asignado ninguna rutina a este member.
              </p>
            ) : (
              <div className="space-y-3">
                {visibleRoutineAssignmentsForHistory.map((assignment) => {
                  const status = assignment.computedStatus || assignment.status;
                  const isArchived = status === "archived";
                  const isExpanded = expandedRoutineHistoryIds.has(
                    assignment.id,
                  );

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
                    return Array.from(groups.entries()).map(
                      ([title, exercises]) => ({
                        title,
                        exercises,
                      }),
                    );
                  })();

                  return (
                    <div
                      key={assignment.id}
                      className="rounded-xl border border-gray-800 bg-gray-800/30 p-4"
                    >
                      <div
                        className="flex cursor-pointer items-center justify-between gap-2"
                        onClick={() =>
                          toggleRoutineHistoryExpanded(assignment.id)
                        }
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
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                          <Badge
                            variant="secondary"
                            className={`border-0 ${ROUTINE_STATUS_BADGE_CLASS[status]}`}
                          >
                            {ROUTINE_STATUS_LABELS[status]}
                          </Badge>
                          {!isArchived && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:bg-gray-800 hover:text-orange-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoutineToArchiveId(assignment.id);
                              }}
                            >
                              <Archive className="mr-1 h-3.5 w-3.5" />
                              Archivar
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:bg-gray-800 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRoutineHistoryExpanded(assignment.id);
                            }}
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

                          {groupedHistoryExercises.length > 0 ? (
                            <div className="space-y-2 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Ejercicios
                              </p>
                              {groupedHistoryExercises.map(
                                (group, groupIdx) => (
                                  <div
                                    key={`${assignment.id}-group-${groupIdx}-${group.title}`}
                                    className="rounded-lg border border-gray-800 bg-gray-900/50 p-3"
                                  >
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-300">
                                      {group.title}
                                    </p>
                                    <div className="space-y-2">
                                      {group.exercises.map((item, index) => (
                                        <div
                                          key={`${assignment.id}-${group.title}-${item.exerciseId}-${index}`}
                                          className="rounded-md border border-gray-800 bg-gray-900/50 px-3 py-2"
                                        >
                                          <p className="text-sm text-gray-100">
                                            {index + 1}.{" "}
                                            {item.name ?? "Ejercicio"}
                                          </p>
                                          {item.instructions &&
                                            item.instructions.trim() && (
                                              <p className="mt-1 text-xs text-orange-300">
                                                {item.instructions}
                                              </p>
                                            )}
                                          {(() => {
                                            const imageCandidates =
                                              Array.isArray(item.imageUrls)
                                                ? item.imageUrls
                                                : item.imageUrl
                                                  ? [item.imageUrl]
                                                  : [];
                                            const previewImages =
                                              imageCandidates.slice(0, 2);
                                            if (previewImages.length === 0)
                                              return null;
                                            return (
                                              <div className="mt-2 grid max-w-xs grid-cols-2 gap-2">
                                                {previewImages.map(
                                                  (url, imgIdx) => (
                                                    <img
                                                      key={`${item.exerciseId}-${imgIdx}-${url}`}
                                                      src={url}
                                                      alt={
                                                        item.name ?? "Ejercicio"
                                                      }
                                                      className="h-20 w-full rounded-md border border-gray-700 bg-gray-800 object-cover"
                                                    />
                                                  ),
                                                )}
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
                                                setRoutineExerciseDetail(item);
                                                setRoutineExerciseDetailOpen(
                                                  true,
                                                );
                                              }}
                                            >
                                              Ver detalle
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              No hay ejercicios en esta asignación.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/*
        <TabsContent value="diets" className="mt-0 outline-none">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <p className="mb-4 text-sm text-gray-500">
              Planes nutricionales en PDF u otros documentos de tipo{" "}
              <span className="text-gray-300">dieta</span> para{" "}
              {member.fullName || "este cliente"}. Lo que subas aquí se asigna
              solo a esta persona.
            </p>
            <TrainerResourceManager
              fixedResourceType="diet"
              hidePageHeader
              assignToMemberId={id}
              assignToMemberLabel={
                member.fullName?.trim() || member.email || "este cliente"
              }
              pageTitle=""
              pageSubtitle=""
              emptyTitle="Ningún plan de dieta con este cliente"
              emptyDescription="Sube un PDF o imagen arriba; se compartirá solo con esta persona. El listado global de dietas está en el menú Dietas."
              assignToMemberHubHref="/trainer/diets"
              assignToMemberHubLabel="Hub de dietas"
            />
          </div>
        </TabsContent>
        */}

        <TabsContent value="resources" className="mt-0 outline-none">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <p className="mb-4 text-sm text-gray-500">
              Documentos compartidos (incluidos planes en PDF como tipo{" "}
              <span className="text-gray-300">dieta</span> si lo indicas al
              subir). Filtra por categoría; todo queda asignado solo a{" "}
              {member.fullName || "este cliente"}.
            </p>
            <TrainerResourceManager
              hidePageHeader
              assignToMemberId={id}
              assignToMemberLabel={
                member.fullName?.trim() || member.email || "este cliente"
              }
              pageTitle=""
              pageSubtitle=""
              emptyTitle="Ningún documento compartido con este cliente"
              emptyDescription="Sube un archivo arriba o gestiona la biblioteca completa desde Recursos en el menú."
              showHubResourcesLink
            />
          </div>
        </TabsContent>
      </Tabs>

      <SendFormDialog
        open={sendDialogOpen}
        onOpenChange={(open) => {
          setSendDialogOpen(open);
          if (!open) setTemplateToSend(null);
        }}
        template={templateToSend}
        preselectedMemberId={id}
        onSent={() => setSendDialogOpen(false)}
      />
      <AssignRoutineDialog
        open={routineDialogOpen}
        onOpenChange={(open) => {
          setRoutineDialogOpen(open);
          if (!open) setRoutineToSend(null);
        }}
        template={routineToSend}
        preselectedMemberId={id}
        onAssigned={() => {
          setRoutineDialogOpen(false);
          void refreshRoutineAssignments();
        }}
      />
      <CustomRoutineDialog
        open={customRoutineDialogOpen}
        onOpenChange={setCustomRoutineDialogOpen}
        memberId={id}
        memberName={member?.fullName || member?.email || "Cliente"}
        onCreated={() => {
          setCustomRoutineDialogOpen(false);
          void refreshRoutineAssignments();
        }}
      />
      <ExerciseDetailDialog
        open={routineExerciseDetailOpen}
        onOpenChange={setRoutineExerciseDetailOpen}
        exercise={routineExerciseDetail}
      />
    </div>
  );
}
