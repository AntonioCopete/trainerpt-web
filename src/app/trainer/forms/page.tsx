"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ClipboardList, Search, UserPlus } from "lucide-react";
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

  const handleDelete = async (id: string) => {
    // await deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
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
