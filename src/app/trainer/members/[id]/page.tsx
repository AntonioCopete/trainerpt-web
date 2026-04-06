"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  FolderOpen,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/src/app/lib/types/forms";
import { SendFormDialog } from "@/src/app/components/forms/SendFormDialog";
import type { FormTemplate } from "@/src/app/lib/types/forms";
import type {
  RoutineTemplate,
  RoutineAssignment,
} from "@/src/app/lib/types/routines";
import { AssignRoutineDialog } from "@/src/app/components/routines/AssignRoutineDialog";
import { CustomRoutineDialog } from "@/src/app/components/routines/CustomRoutineDialog";
import { TrainerResourceManager } from "@/src/app/components/resources/TrainerResourceManager";
import { toast } from "sonner";

export default function TrainerClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [loading, setLoading] = useState(true);
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
  const supabase = createSupabaseBrowser();

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

      <Tabs defaultValue="forms" className="w-full">
        <TabsList className="mb-2 flex h-auto w-full flex-col gap-2 rounded-xl border border-gray-800 bg-gray-900/80 p-2 sm:flex-row sm:flex-wrap sm:gap-1">
          <TabsTrigger
            value="forms"
            className="flex-1 gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm text-gray-400 data-[state=active]:border-gray-700 data-[state=active]:bg-gray-800 data-[state=active]:text-white sm:flex-initial"
          >
            <ClipboardList className="h-4 w-4 shrink-0 text-red-400" />
            Formularios
          </TabsTrigger>
          <TabsTrigger
            value="routines"
            className="flex-1 gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm text-gray-400 data-[state=active]:border-gray-700 data-[state=active]:bg-gray-800 data-[state=active]:text-white sm:flex-initial"
          >
            <Dumbbell className="h-4 w-4 shrink-0 text-orange-400" />
            Rutinas
          </TabsTrigger>
          <TabsTrigger
            value="diets"
            className="flex-1 gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm text-gray-400 data-[state=active]:border-gray-700 data-[state=active]:bg-gray-800 data-[state=active]:text-white sm:flex-initial"
          >
            <UtensilsCrossed className="h-4 w-4 shrink-0 text-amber-400" />
            Dietas
          </TabsTrigger>
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
              <div className="space-y-2">
                {assignments
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt ?? b.sentAt ?? 0).getTime() -
                      new Date(a.createdAt ?? a.sentAt ?? 0).getTime(),
                  )
                  .map((assignment) => {
                    const sentDate = formatAssignmentSentDate(assignment);
                    const windowStatus = getAssignmentWindowStatus(assignment);

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
                          {windowStatus.dueAtFormatted && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
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
                                  router.push(
                                    `/trainer/assignments/${assignment.id}`,
                                  )
                                }
                                className="gap-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Ver respuesta
                              </Button>
                            </>
                          ) : (
                            <>
                              {assignment.status === "archived" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 text-[11px] font-medium text-gray-300">
                                  <Clock className="h-3 w-3" />
                                  Cancelado
                                </span>
                              ) : assignment.status === "missed" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">
                                  <Clock className="h-3 w-3" />
                                  Vencido
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-400">
                                  <Clock className="h-3 w-3" />
                                  Pendiente
                                </span>
                              )}

                              {assignment.status === "pending" &&
                                assignment.repeat &&
                                assignment.repeat !== "none" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={
                                      cancellingAssignmentId === assignment.id
                                    }
                                    onClick={() =>
                                      handleCancelRecurringAssignment(
                                        assignment.id,
                                      )
                                    }
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
                  })}
              </div>
            )}
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
              <Link
                href={`/trainer/routines/assignments?memberId=${id}`}
                className="inline-flex items-center rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Ver página de asignaciones de rutinas
              </Link>
              <Button
                onClick={() => setCustomRoutineDialogOpen(true)}
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
              >
                <Dumbbell className="h-3.5 w-3.5" />
                Nueva rutina personalizada
              </Button>
            </div>
            {routineAssignments.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aún no has asignado ninguna rutina a este member.
              </p>
            ) : (
              <div className="space-y-2">
                {routineAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-800/30 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {assignment.template?.name ?? "Rutina"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(assignment.startDate).toLocaleDateString(
                          "es-ES",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            timeZone: "UTC",
                          },
                        )}{" "}
                        -{" "}
                        {new Date(assignment.endDate).toLocaleDateString(
                          "es-ES",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            timeZone: "UTC",
                          },
                        )}
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-700/60 px-2 py-0.5 text-[11px] font-medium text-gray-200">
                      {assignment.computedStatus === "active"
                        ? "Activa"
                        : assignment.computedStatus === "scheduled"
                          ? "Programada"
                          : assignment.computedStatus === "archived"
                            ? "Archivada"
                            : "Finalizada"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

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

        <TabsContent value="resources" className="mt-0 outline-none">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <p className="mb-4 text-sm text-gray-500">
              Todos los tipos de documento (dieta, rutina, general) con filtros.
              Las subidas quedan asignadas solo a{" "}
              {member.fullName || "este cliente"}; usa la pestaña Dietas si
              prefieres centrarte en nutrición.
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
    </div>
  );
}
