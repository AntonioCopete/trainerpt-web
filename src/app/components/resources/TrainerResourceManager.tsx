"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Share2,
  Trash2,
  Download,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import type { MemberSummary } from "@/src/app/lib/types/forms";
import type {
  ResourceType,
  TrainerResource,
} from "@/src/app/lib/types/resources";
import { RESOURCE_TYPE_LABELS } from "@/src/app/lib/types/resources";
import {
  createTrainerResource,
  deleteTrainerResource,
  getTrainerResourceDownloadUrl,
  listTrainerResources,
  patchResourceShares,
  requestResourceUploadUrl,
} from "@/src/app/lib/resources-api";
import { uploadResourceFile } from "@/src/app/lib/resources-upload";

/** Muchos navegadores no informan MIME en .xlsx/.xls; el backend necesita uno estable para firmar el PUT. */
function guessTrainerResourceContentType(file: File): string {
  const t = file.type?.trim();
  if (t) return t;
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (n.endsWith(".xls")) return "application/vnd.ms-excel";
  return "application/octet-stream";
}

export interface TrainerResourceManagerProps {
  /** Si se define (p. ej. Dietas), solo este tipo en listado y al crear */
  fixedResourceType?: ResourceType;
  pageTitle: string;
  pageSubtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  showLinkToAllResources?: boolean;
  /** Ficha de cliente: tras subir se hace PATCH shares solo con este miembro */
  assignToMemberId?: string;
  assignToMemberLabel?: string;
  /** Oculta título/subtítulo superiores (p. ej. dentro de una tarjeta en ficha miembro) */
  hidePageHeader?: boolean;
  /** Con assignToMemberId: enlace a la biblioteca global */
  showHubResourcesLink?: boolean;
  /** Sustituye href/etiqueta del botón del banner (p. ej. /trainer/diets en ficha cliente) */
  assignToMemberHubHref?: string;
  assignToMemberHubLabel?: string;
  /** Acciones extra a la derecha del título (p. ej. botón "Cómo funciona"). Solo se muestra si hidePageHeader=false. */
  headerActions?: React.ReactNode;
}

export function TrainerResourceManager({
  fixedResourceType,
  pageTitle,
  pageSubtitle,
  emptyTitle,
  emptyDescription,
  showLinkToAllResources,
  assignToMemberId,
  assignToMemberLabel,
  hidePageHeader,
  showHubResourcesLink,
  assignToMemberHubHref,
  assignToMemberHubLabel,
  headerActions,
}: TrainerResourceManagerProps) {
  const supabase = createSupabaseBrowser();
  const [resources, setResources] = useState<TrainerResource[]>([]);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [listFilter, setListFilter] = useState<ResourceType | "all">(
    fixedResourceType ?? "all",
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createType, setCreateType] = useState<ResourceType>(
    fixedResourceType ?? "general",
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareResource, setShareResource] = useState<TrainerResource | null>(
    null,
  );
  const [shareSelection, setShareSelection] = useState<Set<string>>(new Set());
  const [shareSaving, setShareSaving] = useState(false);

  const fileInputId = useId();

  const effectiveListType =
    fixedResourceType ?? (listFilter === "all" ? "all" : listFilter);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) {
        setResources([]);
        return;
      }
      const [resList, memRes] = await Promise.all([
        listTrainerResources(token, effectiveListType),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/members`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }).then((r) => (r.ok ? r.json() : { members: [] })),
      ]);
      setResources(resList);
      setMembers(Array.isArray(memRes.members) ? memRes.members : []);
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, effectiveListType]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayedResources = useMemo(() => {
    if (!assignToMemberId?.trim()) return resources;
    return resources.filter((r) =>
      (r.sharedMemberIds ?? []).includes(assignToMemberId),
    );
  }, [resources, assignToMemberId]);

  const assignLabel = assignToMemberLabel?.trim() || "este cliente";

  const openShare = (r: TrainerResource) => {
    setShareResource(r);
    const initial = new Set(r.sharedMemberIds ?? []);
    setShareSelection(initial);
    setShareOpen(true);
  };

  const toggleMember = (id: string) => {
    setShareSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllMembers = () => {
    setShareSelection(new Set(members.map((m) => m.id)));
  };

  const clearAllMembers = () => setShareSelection(new Set());

  const saveShares = async () => {
    if (!shareResource) return;
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    if (!token) return;
    setShareSaving(true);
    try {
      const ok = await patchResourceShares(
        token,
        shareResource.id,
        Array.from(shareSelection),
      );
      if (!ok) {
        toast.error(
          "No se pudo actualizar el acceso. ¿Está implementado PATCH /resources/:id/shares?",
        );
        return;
      }
      toast.success("Compartido actualizado");
      setShareOpen(false);
      await load();
    } finally {
      setShareSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    if (!description.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }
    if (!file) {
      toast.error(
        "Selecciona un archivo: PDF, JPEG, PNG o Excel (.xlsx / .xls) (máx. 30 MB).",
      );
      return;
    }

    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    if (!token) {
      toast.error("Sesión no válida");
      return;
    }

    const resourceType = fixedResourceType ?? createType;
    const contentType = guessTrainerResourceContentType(file);

    setUploading(true);
    try {
      const created = await createTrainerResource(token, {
        title: title.trim(),
        description: description.trim(),
        resourceType,
        filename: file.name,
        contentType,
        size: file.size,
      });

      if (!created?.resource?.id) {
        toast.error(
          "No se pudo registrar el recurso. El backend debe exponer POST /resources con el cuerpo documentado en resources-api.ts.",
        );
        return;
      }

      const rid = created.resource.id;
      const urlInfo = await requestResourceUploadUrl(
        token,
        rid,
        file.name,
        contentType,
      );

      if (!urlInfo) {
        toast.error(
          "No se obtuvo URL de subida. Implementa POST /resources/:id/upload-url.",
        );
        return;
      }

      await uploadResourceFile({
        uploadUrl: urlInfo.uploadUrl,
        file,
        contentType,
      });

      if (assignToMemberId?.trim()) {
        const shared = await patchResourceShares(token, rid, [
          assignToMemberId.trim(),
        ]);
        if (!shared) {
          toast.error(
            "Archivo subido, pero no se pudo asignar al cliente. Actualiza el acceso desde Recursos → Compartir.",
          );
        } else {
          toast.success(`Recurso subido y compartido con ${assignLabel}`);
        }
      } else {
        toast.success("Recurso subido");
      }
      setTitle("");
      setDescription("");
      setFile(null);
      await load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al subir el archivo",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (r: TrainerResource) => {
    if (!confirm(`¿Eliminar «${r.title}»? Se quitará el acceso de todos.`))
      return;
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    if (!token) return;
    const ok = await deleteTrainerResource(token, r.id);
    if (!ok) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Eliminado");
    await load();
  };

  const handleDownload = async (r: TrainerResource) => {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    if (!token) return;
    const url = await getTrainerResourceDownloadUrl(token, r.id);
    if (!url) {
      toast.error(
        "No se pudo obtener el enlace de descarga (GET .../download-url).",
      );
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={hidePageHeader ? "space-y-6" : "space-y-8"}>
      {!hidePageHeader ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
            <p className="mt-1 text-sm text-gray-400">{pageSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {headerActions}
            {showLinkToAllResources ? (
              <Button
                variant="outline"
                asChild
                className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800"
              >
                <Link href="/trainer/resources" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Ver todos los recursos
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {assignToMemberId?.trim() ? (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-100/90">
            Las subidas desde esta ficha se comparten automáticamente con{" "}
            <span className="font-medium text-white">{assignLabel}</span>.
            Puedes ampliar o quitar acceso con «Compartir» en cada documento.
          </p>
          {showHubResourcesLink !== false ? (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="shrink-0 border-gray-600 bg-gray-800 text-gray-200 shadow-none hover:bg-gray-700 hover:text-white"
            >
              <Link
                href={assignToMemberHubHref ?? "/trainer/resources"}
                className="gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                {assignToMemberHubLabel ?? "Biblioteca global"}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {!fixedResourceType ? (
        <div className="flex flex-wrap gap-2">
          {(["all", "diet", "routine", "general"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setListFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                listFilter === f
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {f === "all" ? "Todos" : RESOURCE_TYPE_LABELS[f]}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-white">
          {assignToMemberId?.trim()
            ? "Subir documento para este cliente"
            : "Subir nuevo recurso"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-gray-300">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Plan nutricional enero"
              className="h-10 border-gray-700 bg-gray-800 py-0 text-sm text-white placeholder:text-gray-500"
            />
          </div>
          {!fixedResourceType ? (
            <div className="space-y-1.5">
              <Label className="text-gray-300">Tipo</Label>
              <div className="relative">
                <select
                  value={createType}
                  onChange={(e) =>
                    setCreateType(e.target.value as ResourceType)
                  }
                  className="h-10 w-full cursor-pointer appearance-none rounded-md border border-gray-700 bg-gray-800 py-0 pl-3 pr-10 text-sm text-white shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-orange-500/60 focus-visible:ring-2 focus-visible:ring-orange-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                >
                  {(Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[]).map(
                    (k) => (
                      <option key={k} value={k}>
                        {RESOURCE_TYPE_LABELS[k]}
                      </option>
                    ),
                  )}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
              </div>
            </div>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label className="text-gray-300">
            Descripción <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Para qué sirve este documento"
            rows={2}
            className="border-gray-700 bg-gray-800 text-white resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={fileInputId} className="text-gray-300">
            Archivo <span className="text-red-500">*</span>
          </Label>
          <div className="flex min-h-11 items-center gap-3 rounded-md border border-gray-700 bg-gray-800/80 px-3 py-2">
            <input
              id={fileInputId}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="peer sr-only"
            />
            <label
              htmlFor={fileInputId}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-md bg-gradient-to-r from-zinc-500 to-zinc-600 px-4 text-sm font-medium text-white shadow-sm transition hover:from-zinc-400 hover:to-zinc-500 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500/70 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-900"
            >
              Elegir archivo
            </label>
            <span className="min-w-0 flex-1 truncate text-sm text-gray-200">
              {file ? file.name : "Ningún archivo seleccionado"}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Formatos permitidos: <span className="text-gray-400">PDF</span>,{" "}
            <span className="text-gray-400">JPEG</span>,{" "}
            <span className="text-gray-400">PNG</span>,{" "}
            <span className="text-gray-400">Excel (.xlsx / .xls)</span>. Tamaño
            máximo 30&nbsp;MB. Subida directa al bucket con URL firmada (GCS).
          </p>
        </div>
        <Button
          type="submit"
          disabled={uploading}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo…
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {assignToMemberId?.trim()
                ? `Subir y compartir con ${assignLabel}`
                : "Subir y guardar"}
            </>
          )}
        </Button>
      </form>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">
          {assignToMemberId?.trim()
            ? `Documentos compartidos con ${assignLabel}`
            : "Tu biblioteca"}
        </h2>
        {loading ? (
          <div className="flex justify-center py-12 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : displayedResources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 px-6 py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-600" />
            <p className="mt-3 font-medium text-gray-300">{emptyTitle}</p>
            <p className="mt-1 text-sm text-gray-500">{emptyDescription}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {displayedResources.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white truncate">{r.title}</p>
                  <p className="text-xs text-gray-500">
                    {RESOURCE_TYPE_LABELS[r.resourceType]} · {r.filename}
                  </p>
                  {r.description ? (
                    <p className="mt-1 text-sm text-gray-400 line-clamp-2">
                      {r.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-gray-600">
                    {assignToMemberId?.trim() ? (
                      <>
                        <span className="text-gray-400">
                          {assignLabel} puede ver y descargar este archivo.
                        </span>
                        {(r.sharedMemberIds?.length ?? 0) > 1 ? (
                          <span className="mt-0.5 block text-gray-500">
                            También compartido con{" "}
                            {(r.sharedMemberIds!.length ?? 0) - 1} cliente(s)
                            más.
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <>
                        Compartido con{" "}
                        {(r.sharedMemberIds?.length ?? 0) === 0
                          ? "nadie aún"
                          : `${r.sharedMemberIds!.length} cliente(s)`}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDownload(r)}
                    className="border-gray-600 bg-gray-800 text-gray-100 shadow-none hover:bg-gray-700 hover:text-white [&_svg]:text-gray-300"
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
                    Descargar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openShare(r)}
                    className="border-gray-600 bg-gray-800 text-gray-100 shadow-none hover:bg-gray-700 hover:text-white [&_svg]:text-gray-300"
                  >
                    <Share2 className="mr-1 h-3.5 w-3.5" />
                    Compartir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDelete(r)}
                    className="border-red-800/60 bg-gray-900 text-red-400 shadow-none hover:bg-red-950/50 hover:text-red-300 [&_svg]:text-red-400"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compartir con clientes</DialogTitle>
            <DialogDescription className="text-gray-400">
              Elige quién puede ver y descargar «{shareResource?.title}». Puedes
              añadir clientes nuevos más adelante sin volver a subir el archivo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 py-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={selectAllMembers}
              className="bg-gray-800 text-gray-200"
            >
              Todos
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearAllMembers}
              className="text-gray-400"
            >
              Ninguno
            </Button>
          </div>
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {members.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay clientes. Invítalos desde la sección Clientes.
              </p>
            ) : (
              members.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-800 bg-gray-800/50 px-3 py-2 hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={shareSelection.has(m.id)}
                    onChange={() => toggleMember(m.id)}
                    className="rounded border-gray-600"
                  />
                  <span className="text-sm text-gray-200">{m.fullName}</span>
                  <span className="truncate text-xs text-gray-500">
                    {m.email}
                  </span>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareOpen(false)}
              className="border-gray-600 bg-gray-800 text-gray-100 shadow-none hover:bg-gray-700 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void saveShares()}
              disabled={shareSaving}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white"
            >
              {shareSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
