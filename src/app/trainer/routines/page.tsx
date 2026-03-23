"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarRange,
  Dumbbell,
  Edit3,
  Plus,
  Search,
  Send,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import type { RoutineTemplate } from "@/src/app/lib/types/routines";
import { AssignRoutineDialog } from "@/src/app/components/routines/AssignRoutineDialog";
import { CustomExerciseDialog } from "@/src/app/components/routines/CustomExerciseDialog";
import { RoutineTemplateDialog } from "@/src/app/components/routines/RoutineTemplateDialog";

export default function TrainerRoutinesPage() {
  const supabase = createSupabaseBrowser();
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [customExerciseDialogOpen, setCustomExerciseDialogOpen] =
    useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<RoutineTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<RoutineTemplate | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/templates`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const data = await res.json();
      setTemplates(data.templates ?? []);
    } catch {
      setTemplates([]);
      toast.error("No se pudieron cargar las rutinas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredTemplates = useMemo(
    () =>
      templates.filter(
        (template) =>
          template.name.toLowerCase().includes(search.toLowerCase()) ||
          template.description.toLowerCase().includes(search.toLowerCase()),
      ),
    [templates, search],
  );

  const handleCreateOrUpdateTemplate = async (payload: {
    name: string;
    description: string;
    schema: Array<any>;
  }) => {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;

    if (editingTemplate) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/templates/${editingTemplate.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message ?? "No se pudo actualizar la rutina");
        return;
      }
      toast.success("Rutina actualizada");
      setEditingTemplate(null);
      await fetchTemplates();
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data?.message ?? "No se pudo crear la rutina");
      return;
    }
    toast.success("Rutina creada");
    await fetchTemplates();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Plantillas de rutinas
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Crea y comparte rutinas por periodos con tus members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/trainer/routines/assignments"
            className="inline-flex h-10 items-center rounded-md border border-gray-700 bg-transparent px-4 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            Ver asignadas
          </Link>
          <Button
            variant="outline"
            onClick={() => setCustomExerciseDialogOpen(true)}
            className="gap-2 border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Wrench className="h-4 w-4" />
            Nuevo ejercicio
          </Button>
          <Button
            onClick={() => {
              setEditingTemplate(null);
              setTemplateDialogOpen(true);
            }}
            className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
          >
            <Plus className="h-4 w-4" />
            Nueva rutina
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar rutina..."
          className="h-10 rounded-xl border-gray-800 bg-gray-900 pl-10 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-gray-800 bg-gray-900/60"
            />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/30 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-800/60">
            <Dumbbell className="h-7 w-7 text-gray-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-300">
            {search ? "Sin resultados" : "Sin rutinas"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {search
              ? "Prueba otro termino de busqueda"
              : "Crea tu primera plantilla de rutina para empezar a asignar"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4"
            >
              <p className="font-semibold text-white">{template.name}</p>
              <p className="mt-1 line-clamp-2 text-sm text-gray-400">
                {template.description}
              </p>
              <p className="mt-3 text-xs text-gray-500">
                {Array.isArray(template.schema)
                  ? `${template.schema.length} ejercicios`
                  : "Sin bloques"}
              </p>
              {Array.isArray(template.schema) && template.schema.length > 0 && (
                <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                  {template.schema
                    .slice(0, 3)
                    .map((item) => item.name)
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTemplate(template);
                    setTemplateDialogOpen(true);
                  }}
                  className="gap-1 border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setAssignDialogOpen(true);
                  }}
                  className="ml-auto gap-1 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                >
                  <Send className="h-3.5 w-3.5" />
                  Asignar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 text-sm text-gray-400">
        <div className="flex items-center gap-2 text-gray-300">
          <CalendarRange className="h-4 w-4 text-orange-400" />
          Las rutinas se asignan con fecha de inicio y fin
        </div>
      </div>

      <RoutineTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        initialTemplate={editingTemplate}
        onSubmit={handleCreateOrUpdateTemplate}
      />
      <AssignRoutineDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        template={selectedTemplate}
        onAssigned={fetchTemplates}
      />
      <CustomExerciseDialog
        open={customExerciseDialogOpen}
        onOpenChange={setCustomExerciseDialogOpen}
      />
    </div>
  );
}
