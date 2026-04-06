/**
 * Recursos compartidos (PDFs, documentos) — contrato pensado para API Nest/backend.
 * Endpoints esperados: GET/POST/PATCH/DELETE /resources, POST .../upload-url,
 * PATCH .../shares, GET /members/me/resources
 */

export type ResourceType = "diet" | "routine" | "general";

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  diet: "Dieta",
  routine: "Rutina",
  general: "General",
};

export interface TrainerResource {
  id: string;
  title: string;
  description?: string | null;
  resourceType: ResourceType;
  filename: string;
  contentType: string;
  size?: number | null;
  storageKey?: string | null;
  createdAt: string;
  updatedAt?: string;
  /** IDs de miembros con los que se comparte (si el API los devuelve) */
  sharedMemberIds?: string[];
}

export interface MemberResource {
  id: string;
  title: string;
  description?: string | null;
  resourceType: ResourceType;
  filename: string;
  contentType: string;
  createdAt: string;
}
