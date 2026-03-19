"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Pencil,
  Send,
  Clock,
  CheckCircle2,
  User,
  Eye,
  Archive,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormPreview } from "../../../components/forms/FormPreview";
import { SendFormDialog } from "../../../components/forms/SendFormDialog";
import type {
  FormTemplate,
  FormAssignment,
  MemberSummary,
} from "../../../lib/types/forms";
import {
  formatAssignmentSentDate,
  getAssignmentWindowStatus,
} from "../../../lib/types/forms";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import { toast } from "sonner";
// import {
//   getTemplate,
//   getAssignmentsByTemplate,
//   getResponsesByTemplate,
// } from "@/lib/api/forms";

export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const supabase = createSupabaseBrowser();

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template/${id}/archive`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        toast.success("Plantilla archivada");
        router.push("/trainer/forms");
      } else {
        toast.error("Error al archivar la plantilla");
      }
    } catch {
      toast.error("Error al archivar la plantilla");
    } finally {
      setArchiving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        const [templateRes, assignmentsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/assignments?templateId=${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            },
          ),
        ]);

        if (cancelled) return;

        if (templateRes.ok) {
          const data = await templateRes.json();
          setTemplate(data.template ?? null);
        }
        if (assignmentsRes.ok) {
          const data = await assignmentsRes.json();
          setAssignments(data.assignments ?? data ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, supabase]);

  if (loading || !template) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-red-500" />
      </div>
    );
  }

  const pending = assignments.filter((a) => a.status === "pending");
  const completed = assignments.filter((a) => a.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push("/trainer/forms")}
            className="mt-1 rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{template.name}</h1>
            <p className="mt-1 text-sm text-gray-400">{template.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleArchive}
            disabled={archiving}
            className="gap-2 border-orange-500/30 bg-transparent text-orange-400 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-300"
          >
            <Archive className="h-4 w-4" />
            {archiving ? "Archivando..." : "Archivar"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/trainer/forms/${id}/edit`)}
            className="gap-2 border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            onClick={() => setSendDialogOpen(true)}
            className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
          >
            <Send className="h-4 w-4" />
            Enviar a cliente
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: stats & assignments */}
        <div className="space-y-6 lg:col-span-3">
          {/* Quick stats */}
          {/* Quick stats: contexto de uso, no analytics complejos */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {assignments.length}
              </p>
              <p className="text-xs text-gray-500">Formularios enviados</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">
                {pending.length}
              </p>
              <p className="text-xs text-gray-500">Pendientes de completar</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {completed.length}
              </p>
              <p className="text-xs text-gray-500">Formularios completados</p>
            </div>
          </div>

          {/* Assignments list */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden">
            <div className="border-b border-gray-800 px-5 py-3">
              <h2 className="text-sm font-semibold text-white">
                Envíos de este formulario
              </h2>
            </div>

            {assignments.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-500">
                  Aun no has enviado este formulario a ningun cliente
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {assignments.map(
                  (assignment: FormAssignment & { member: MemberSummary }) => {
                    const date = formatAssignmentSentDate(assignment);
                    const windowStatus = getAssignmentWindowStatus(assignment);

                    return (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between px-5 py-3 hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {assignment.member?.fullName} -{" "}
                              {assignment.member?.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              Enviado el {date}
                            </p>
                            {windowStatus.dueAtFormatted && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                Límite: {windowStatus.dueAtFormatted}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {assignment.status === "completed" ? (
                            <>
                              <Badge
                                variant="secondary"
                                className="border-0 bg-green-500/10 text-green-400 text-xs"
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Completado
                              </Badge>
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
                          ) : assignment.status === "archived" ? (
                            <Badge
                              variant="secondary"
                              className="border-0 bg-gray-500/10 text-gray-300 text-xs"
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              Cancelado
                            </Badge>
                          ) : assignment.status === "missed" ? (
                            <Badge
                              variant="secondary"
                              className="border-0 bg-red-500/10 text-red-400 text-xs"
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              Vencido
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="border-0 bg-orange-500/10 text-orange-400 text-xs"
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              Pendiente
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: form preview */}
        <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
          <FormPreview
            templateName={template.name}
            templateDescription={template.description}
            customFields={template.schema ?? []}
          />
        </div>
      </div>

      {/* Send dialog */}
      <SendFormDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        template={template}
      />
    </div>
  );
}
