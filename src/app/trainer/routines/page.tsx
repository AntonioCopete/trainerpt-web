"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArchiveRestore,
  CalendarRange,
  Trash2,
  Dumbbell,
  Edit3,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import type { RoutineTemplate } from "@/src/app/lib/types/routines";
import { AssignRoutineDialog } from "@/src/app/components/routines/AssignRoutineDialog";
import { RoutineTemplateDialog } from "@/src/app/components/routines/RoutineTemplateDialog";
import { TrainerExerciseLibraryDialog } from "@/src/app/components/routines/TrainerExerciseLibraryDialog";
import { messageFromTemplateSaveResponse } from "@/src/app/lib/routine-template-save-errors";

export default function TrainerRoutinesPage() {
  const supabase = createSupabaseBrowser();
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [exerciseLibraryOpen, setExerciseLibraryOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<RoutineTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<RoutineTemplate | null>(null);
  const [archivedTemplates, setArchivedTemplates] = useState<RoutineTemplate[]>(
    [],
  );
  const [showArchived, setShowArchived] = useState(false);

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

      const archivedRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/templates/archived`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const archivedData = await archivedRes.json().catch(() => ({}));
      setArchivedTemplates(archivedData.templates ?? []);
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
        toast.error(
          messageFromTemplateSaveResponse(
            res,
            data,
            "No se pudo actualizar la rutina",
          ),
        );
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
      toast.error(
        messageFromTemplateSaveResponse(
          res,
          data,
          "No se pudo crear la rutina",
        ),
      );
      return;
    }
    toast.success("Rutina creada");
    await fetchTemplates();
  };

  const archiveTemplate = async (templateId: string) => {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/templates/${templateId}/archive`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) {
      toast.error("No se pudo archivar la rutina");
      return;
    }
    toast.success("Rutina archivada");
    await fetchTemplates();
  };

  const restoreTemplate = async (templateId: string) => {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/templates/${templateId}/restore`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) {
      toast.error("No se pudo restaurar la rutina");
      return;
    }
    toast.success("Rutina restaurada");
    await fetchTemplates();
  };

  const deleteTemplatePermanently = async (templateId: string) => {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/templates/${templateId}/delete`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) {
      toast.error("No se pudo eliminar definitivamente");
      return;
    }
    toast.success("Rutina eliminada definitivamente");
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
          <Button
            variant="outline"
            onClick={() => setExerciseLibraryOpen(true)}
            className="gap-2 border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Dumbbell className="h-4 w-4" />
            Biblioteca de ejercicios
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
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowArchived((prev) => !prev)}
          className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          {showArchived ? "Ocultar archivadas" : "Ver archivadas"}
        </Button>
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
              {Array.isArray(template.schema) &&
                template.schema.length > 0 &&
                (() => {
                  // Extraer nombres únicos de entrenamientos preservando el orden
                  const trainingTitles: string[] = [];
                  const seen = new Set<string>();
                  for (const item of template.schema) {
                    const title =
                      typeof item?.trainingTitle === "string"
                        ? item.trainingTitle.trim()
                        : "";
                    if (title && !seen.has(title)) {
                      trainingTitles.push(title);
                      seen.add(title);
                    }
                  }
                  return trainingTitles.length > 0 ? (
                    <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                      {trainingTitles.join(" · ")}
                    </p>
                  ) : null;
                })()}

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
                  variant="ghost"
                  size="sm"
                  onClick={() => void archiveTemplate(template.id)}
                  className="gap-1 text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  Archivar
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

      {showArchived && (
        <div className="space-y-2 rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
          <h2 className="text-sm font-semibold text-gray-200">
            Rutinas archivadas
          </h2>
          {archivedTemplates.length === 0 ? (
            <p className="text-xs text-gray-500">No hay rutinas archivadas.</p>
          ) : (
            archivedTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2"
              >
                <p className="text-sm text-gray-200">{template.name}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void restoreTemplate(template.id)}
                    className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800"
                  >
                    Restaurar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void deleteTemplatePermanently(template.id)}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
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
      <TrainerExerciseLibraryDialog
        open={exerciseLibraryOpen}
        onOpenChange={setExerciseLibraryOpen}
      />
    </div>
  );
}
