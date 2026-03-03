"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  ClipboardList,
  ArrowRight,
  User,
  Eye,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { FormAssignment } from "../../lib/types/forms";
import { formatAssignmentSentDate } from "../../lib/types/forms";
import { createSupabaseBrowser } from "../../lib/supabase/browser";

export default function ClientFormsPage() {
  const [pending, setPending] = useState<FormAssignment[]>([]);
  const [completed, setCompleted] = useState<FormAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowser();

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/assignments`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const data = await res.json();
      const list: FormAssignment[] = data.assignments ?? data ?? [];
      setPending(list.filter((a: FormAssignment) => a.status === "pending"));
      setCompleted(
        list.filter((a: FormAssignment) => a.status === "completed"),
      );
    } catch {
      setPending([]);
      setCompleted([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const renderAssignment = (
    assignment: FormAssignment,
    index: number,
    isPending: boolean,
  ) => {
    const date = formatAssignmentSentDate(assignment);

    const content = (
      <>
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isPending
                ? "bg-gradient-to-br from-red-500/20 to-orange-500/20"
                : "bg-gray-800/60"
            }`}
          >
            <ClipboardList
              className={`h-5 w-5 ${
                isPending ? "text-red-400" : "text-gray-500"
              }`}
            />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-white">
              {assignment.template?.name ?? "Formulario"}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <User className="h-3 w-3" />
              <span>Enviado el {date}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPending ? (
            <>
              <Badge
                variant="secondary"
                className="border-0 bg-orange-500/10 text-orange-400 text-xs hidden sm:flex"
              >
                <Clock className="mr-1 h-3 w-3" />
                Pendiente
              </Badge>
              <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors" />
            </>
          ) : (
            <>
              <Badge
                variant="secondary"
                className="border-0 bg-green-500/10 text-green-400 text-xs"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Completado
              </Badge>
              <Eye className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors" />
            </>
          )}
        </div>
      </>
    );

    const className =
      "group flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-900/60 p-4 transition-colors cursor-pointer hover:border-gray-700 hover:bg-gray-900/80";

    const href = isPending
      ? `/member/forms/${assignment.id}`
      : `/member/forms/${assignment.id}/response`;

    return (
      <motion.div
        key={assignment.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Link href={href} prefetch={false} className={className}>
          {content}
        </Link>
      </motion.div>
    );
  };

  // 👇 helper, NO componente React (minúscula)
  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800/60">
        <ClipboardList className="h-8 w-8 text-gray-600" />
      </div>
      <p className="mt-4 text-sm text-gray-500 text-center max-w-xs">
        {message}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Mis formularios</h1>
        <p className="mt-1 text-sm text-gray-400">
          Revisa y completa los formularios de seguimiento de tu entrenador
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-gray-800 bg-gray-900/60"
            />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList className="bg-gray-900 border border-gray-800 rounded-xl p-1">
            <TabsTrigger
              value="pending"
              className="rounded-lg data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400"
            >
              Pendientes
              {pending.length > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {pending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-lg data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400"
            >
              Completados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pending.length === 0 ? (
              renderEmptyState(
                "No tienes formularios pendientes. Tu entrenador te enviará uno pronto.",
              )
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {pending.map((a, i) => renderAssignment(a, i, true))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completed.length === 0 ? (
              renderEmptyState("Aún no has completado ningún formulario.")
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {completed.map((a, i) => renderAssignment(a, i, false))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
