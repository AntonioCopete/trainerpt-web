"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  ClipboardList,
  Send,
  Clock,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import type { MemberSummary, FormAssignment } from "@/src/app/lib/types/forms";
import { formatAssignmentSentDate } from "@/src/app/lib/types/forms";
import { SendFormDialog } from "@/src/app/components/forms/SendFormDialog";
import type { FormTemplate } from "@/src/app/lib/types/forms";

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
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [templateToSend, setTemplateToSend] = useState<FormTemplate | null>(
    null,
  );
  const supabase = createSupabaseBrowser();

  const openSendDialog = (template: FormTemplate) => {
    setTemplateToSend(template);
    setSendDialogOpen(true);
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;

        const [membersRes, templatesRes, assignmentsRes] = await Promise.all([
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

        if (assignmentsRes.ok) {
          const data = await assignmentsRes.json();
          const list: FormAssignment[] = data.assignments ?? data ?? [];
          setAssignments(list);
        } else {
          setAssignments([]);
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
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
          <ClipboardList className="h-4 w-4 text-red-400" />
          Enviar formulario
        </h2>
        {templates.length === 0 ? (
          <p className="text-sm text-gray-500">
            No tienes plantillas. Crea una en Formularios para poder enviarla.
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
                    <p className="text-xs text-gray-500 truncate max-w-md">
                      {tpl.description}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => openSendDialog(tpl)}
                  className="gap-1.5 shrink-0 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                >
                  <Send className="h-3.5 w-3.5" />
                  Enviar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de formularios de este miembro */}
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

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-800/30 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {assignment.template?.name ?? "Formulario"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Enviado el {sentDate}
                        {assignment.status === "completed" && (
                          <span className="ml-2 text-[11px] text-gray-500">
                            · Completado
                          </span>
                        )}
                      </p>
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-400">
                          <Clock className="h-3 w-3" />
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

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
    </div>
  );
}
