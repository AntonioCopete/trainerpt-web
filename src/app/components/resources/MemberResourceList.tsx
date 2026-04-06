"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Loader2,
  Download,
  UtensilsCrossed,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import type {
  MemberResource,
  ResourceType,
} from "@/src/app/lib/types/resources";
import { RESOURCE_TYPE_LABELS } from "@/src/app/lib/types/resources";
import {
  getMemberResourceDownloadUrl,
  listMemberResources,
} from "@/src/app/lib/resources-api";

export interface MemberResourceListProps {
  /**
   * Sin definir: hub con todos los recursos compartidos + filtros por tipo.
   * Con valor: solo esa categoría (p. ej. página Dietas).
   */
  fixedResourceType?: ResourceType;
  pageTitle: string;
  pageSubtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  /** Con fixedResourceType (p. ej. diet): enlace al listado completo */
  showLinkToAllResources?: boolean;
}

export function MemberResourceList({
  fixedResourceType,
  pageTitle,
  pageSubtitle,
  emptyTitle,
  emptyDescription,
  showLinkToAllResources,
}: MemberResourceListProps) {
  const supabase = createSupabaseBrowser();
  const [rawAll, setRawAll] = useState<MemberResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [listFilter, setListFilter] = useState<ResourceType | "all">("all");

  const items = useMemo(() => {
    if (fixedResourceType) {
      return rawAll.filter((r) => r.resourceType === fixedResourceType);
    }
    if (listFilter === "all") return rawAll;
    return rawAll.filter((r) => r.resourceType === listFilter);
  }, [rawAll, fixedResourceType, listFilter]);

  /** Vista fija (p. ej. dietas) pero el API solo devolvió otros tipos */
  const emptyBecauseWrongTab =
    !loading &&
    Boolean(fixedResourceType) &&
    rawAll.length > 0 &&
    items.length === 0;

  /** Hub: hay documentos pero ninguno del tipo seleccionado */
  const emptyBecauseTypeFilter =
    !loading &&
    !fixedResourceType &&
    rawAll.length > 0 &&
    items.length === 0 &&
    listFilter !== "all";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) {
        setRawAll([]);
        return;
      }
      const all = await listMemberResources(token);
      setRawAll(all);
    } catch {
      setRawAll([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const download = async (r: MemberResource) => {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    if (!token) return;
    const url = await getMemberResourceDownloadUrl(token, r.id);
    if (!url) {
      toast.error("No se pudo obtener el enlace de descarga.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const showTypeFilters = !fixedResourceType;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
          <p className="mt-1 text-sm text-gray-400">{pageSubtitle}</p>
        </div>
        {showLinkToAllResources ? (
          <Button
            variant="outline"
            asChild
            className="border-gray-700 bg-gray-800 text-gray-200 shadow-none hover:bg-gray-700 hover:text-white"
          >
            <Link href="/member/resources" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Ver todos los recursos
            </Link>
          </Button>
        ) : null}
      </div>

      {showTypeFilters ? (
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

      {loading ? (
        <div className="flex justify-center py-16 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : emptyBecauseWrongTab ? (
        <div className="rounded-2xl border border-dashed border-amber-500/35 bg-amber-500/[0.07] px-6 py-12 text-center">
          {fixedResourceType === "diet" ? (
            <FileText className="mx-auto h-10 w-10 text-amber-500/80" />
          ) : (
            <UtensilsCrossed className="mx-auto h-10 w-10 text-amber-500/80" />
          )}
          <p className="mt-3 font-medium text-amber-50">
            {fixedResourceType === "diet"
              ? "No tienes planes de dieta compartidos"
              : "Nada que mostrar en esta categoría"}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            {fixedResourceType === "diet"
              ? "Tu entrenador te ha compartido otros documentos (rutina u otros), pero ninguno marcado como dieta. Míralos en Recursos."
              : "Prueba otra pestaña o revisa el listado completo en Recursos."}
          </p>
          <Button
            variant="outline"
            asChild
            className="mt-6 border-amber-500/40 bg-gray-900 text-amber-100 shadow-none hover:bg-gray-800 hover:text-white"
          >
            <Link href="/member/resources" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Ir a Recursos
            </Link>
          </Button>
        </div>
      ) : emptyBecauseTypeFilter ? (
        <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 px-6 py-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-gray-600" />
          <p className="mt-3 font-medium text-gray-300">
            No hay documentos de tipo «{RESOURCE_TYPE_LABELS[listFilter]}»
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Tienes otros archivos compartidos; prueba «Todos» u otro filtro.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-gray-600 bg-gray-800 text-gray-100 shadow-none hover:bg-gray-700"
            onClick={() => setListFilter("all")}
          >
            Ver todos
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 px-6 py-12 text-center">
          {fixedResourceType === "diet" || listFilter === "diet" ? (
            <UtensilsCrossed className="mx-auto h-10 w-10 text-gray-600" />
          ) : (
            <FileText className="mx-auto h-10 w-10 text-gray-600" />
          )}
          <p className="mt-3 font-medium text-gray-300">{emptyTitle}</p>
          <p className="mt-1 text-sm text-gray-500">{emptyDescription}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-white">{r.title}</p>
                <p className="text-xs text-gray-500">
                  {RESOURCE_TYPE_LABELS[r.resourceType as ResourceType]} ·{" "}
                  {r.filename}
                </p>
                {r.description ? (
                  <p className="mt-1 text-sm text-gray-400">{r.description}</p>
                ) : null}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void download(r)}
                className="shrink-0 border-gray-600 bg-gray-800 text-gray-100 shadow-none hover:bg-gray-700 hover:text-white [&_svg]:text-gray-300"
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                Descargar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
