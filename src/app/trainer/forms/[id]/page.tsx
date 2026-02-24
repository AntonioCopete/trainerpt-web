"use client";

import { useState, useEffect, use, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormPreview } from "../../../components/forms/FormPreview";
import { SendFormDialog } from "../../../components/forms/SendFormDialog";
import type {
  FormTemplate,
  FormAssignment,
  FormResponse,
} from "../../../lib/types/forms";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
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
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const supabase = createSupabaseBrowser();

  const fetchTemplate = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      const data = await res.json();

      const customFields = data.template.schema.filter(
        (field) => !field.required,
      );
      data.template.customFields = [...customFields];

      //   const data = await getTemplates();
      setTemplate(data.template);
    } finally {
      // setLoading(false);
    }
  }, []);
  useEffect(() => {
    async function load() {
      setLoading(true);
      fetchTemplate();

      //   const [tpl, assigns, resps] = await Promise.all([
      //     getTemplate(id),
      //     getAssignmentsByTemplate(id),
      //     getResponsesByTemplate(id),
      //   ]);
      //   setTemplate(tpl);
      //   setAssignments(assigns);
      //   setResponses(resps);
      setLoading(false);
    }
    load();
  }, [id]);

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
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {assignments.length}
              </p>
              <p className="text-xs text-gray-500">Enviados</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">
                {pending.length}
              </p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {completed.length}
              </p>
              <p className="text-xs text-gray-500">Completados</p>
            </div>
          </div>

          {/* Assignments list */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden">
            <div className="border-b border-gray-800 px-5 py-3">
              <h2 className="text-sm font-semibold text-white">
                Envios realizados
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
                {assignments.map((assignment) => {
                  const response = responses.find(
                    (r) => r.assignmentId === assignment.id,
                  );
                  const date = new Date(assignment.sentAt).toLocaleDateString(
                    "es-ES",
                    { day: "numeric", month: "short" },
                  );

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
                            {assignment.clientName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Enviado el {date}
                          </p>
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
                            {response && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/trainer/forms/${id}/responses/${response.id}`,
                                  )
                                }
                                className="gap-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Ver
                              </Button>
                            )}
                          </>
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
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: form preview */}
        <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
          <FormPreview
            templateName={template.name}
            templateDescription={template.description}
            customFields={template.customFields}
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
