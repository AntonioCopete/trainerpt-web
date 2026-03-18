"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ClipboardList,
  Search,
  UserPlus,
  Archive,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TemplateCard } from "../../components/forms/TemplateCard";
import { SendFormDialog } from "../../components/forms/SendFormDialog";
import { InviteClientDialog } from "../../components/InviteClientDialog";
import type { FormTemplate } from "../../lib/types/forms";
import { createSupabaseBrowser } from "../../lib/supabase/browser";
import { toast } from "sonner";

export default function TrainerFormsPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(
    null,
  );
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [archivedTemplates, setArchivedTemplates] = useState<FormTemplate[]>(
    [],
  );
  const [showArchived, setShowArchived] = useState(false);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const supabase = createSupabaseBrowser();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      const data = await res.json();

      //   const data = await getTemplates();
      setTemplates(data.templates);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  );

  const fetchArchivedTemplates = useCallback(async () => {
    setLoadingArchived(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template/archived`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const data = await res.json();
      setArchivedTemplates(data.templates ?? []);
    } catch {
      toast.error("Error al cargar plantillas archivadas");
    } finally {
      setLoadingArchived(false);
    }
  }, [supabase]);

  const handleToggleArchived = () => {
    const newState = !showArchived;
    setShowArchived(newState);
    if (newState && archivedTemplates.length === 0) {
      fetchArchivedTemplates();
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template/${id}/restore`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const restored = archivedTemplates.find((t) => t.id === id);
        if (restored) {
          setTemplates((prev) => [...prev, { ...restored, isArchived: false }]);
          setArchivedTemplates((prev) => prev.filter((t) => t.id !== id));
        }
        toast.success("Plantilla restaurada");
      } else {
        toast.error("Error al restaurar la plantilla");
      }
    } catch {
      toast.error("Error al restaurar la plantilla");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const archived = templates.find((t) => t.id === id);
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        if (archived) {
          setArchivedTemplates((prev) => [
            { ...archived, isArchived: true },
            ...prev,
          ]);
        }
        toast.success("Plantilla archivada");
      } else {
        toast.error("Error al archivar la plantilla");
      }
    } catch {
      toast.error("Error al archivar la plantilla");
    }
  };

  const handleSend = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setSendDialogOpen(true);
  };

  const duplicateTemplate = async (id: string) => {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template/${id}/duplicate`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    const data = await res.json();
    if (res.ok && data.template) {
      toast.success("Plantilla duplicada correctamente");
      setTemplates((prev) => [...prev, data.template]);
    } else {
      toast.error("Error al duplicar la plantilla");
      console.error(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Plantillas de formularios
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Diseña los formularios que luego enviarás a tus clientes para su
            seguimiento
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setInviteDialogOpen(true)}
            className="gap-2 border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <UserPlus className="h-4 w-4" />
            Invitar cliente
          </Button>
          <Button
            onClick={() => router.push("/trainer/forms/new")}
            className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-lg shadow-red-500/20"
          >
            <Plus className="h-4 w-4" />
            Nueva plantilla
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar plantillas..."
          className="h-10 rounded-xl border-gray-800 bg-gray-900 pl-10 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20"
        />
      </div>

      {/* Templates grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-gray-800 bg-gray-900/60"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-gray-900/30 py-16"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800/60">
            <ClipboardList className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-300">
            {search ? "Sin resultados" : "Sin plantillas"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 text-center max-w-xs">
            {search
              ? "Prueba con otro termino de busqueda"
              : "Crea tu primera plantilla de formulario para empezar a hacer seguimiento a tus clientes"}
          </p>
          {!search && (
            <Button
              onClick={() => router.push("/trainer/forms/new")}
              className="mt-6 gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            >
              <Plus className="h-4 w-4" />
              Crear plantilla
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((template, i) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={i}
                onEdit={(id) => router.push(`/trainer/forms/${id}/edit`)}
                onDuplicate={(id) => {
                  duplicateTemplate(id);
                }}
                onDelete={handleDelete}
                onSend={handleSend}
                onClick={(id) => router.push(`/trainer/forms/${id}`)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Archived templates section */}
      {!loading && (
        <div className="mt-8 border-t border-gray-800 pt-6">
          <button
            type="button"
            onClick={handleToggleArchived}
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-gray-400 hover:bg-gray-900/60 hover:text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Archive className="h-4 w-4" />
              <span className="text-sm font-medium">
                Plantillas archivadas
                {archivedTemplates.length > 0 && (
                  <span className="ml-2 text-gray-500">
                    ({archivedTemplates.length})
                  </span>
                )}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showArchived ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showArchived && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  {loadingArchived ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-700 border-t-orange-500" />
                    </div>
                  ) : archivedTemplates.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500">
                      No hay plantillas archivadas
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {archivedTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-300">
                              {template.name}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {template.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(template.id)}
                            className="ml-3 gap-1.5 text-xs text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restaurar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Send dialog */}
      <SendFormDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        template={selectedTemplate}
        onSent={fetchTemplates}
      />
      <InviteClientDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
}
