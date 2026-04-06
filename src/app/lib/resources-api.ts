import type {
  MemberResource,
  ResourceType,
  TrainerResource,
} from "./types/resources";

function apiBase(): string {
  const b = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!b) throw new Error("NEXT_PUBLIC_BACKEND_URL no configurada");
  return b;
}

export async function listTrainerResources(
  token: string,
  type?: ResourceType | "all",
): Promise<TrainerResource[]> {
  const q =
    type && type !== "all" ? `?resourceType=${encodeURIComponent(type)}` : "";
  const res = await fetch(`${apiBase()}/resources${q}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json().catch(() => ({}))) as {
    resources?: TrainerResource[];
  };
  return Array.isArray(data.resources) ? data.resources : [];
}

export async function createTrainerResource(
  token: string,
  body: {
    title: string;
    description: string;
    resourceType: ResourceType;
    filename: string;
    contentType: string;
    size: number;
  },
): Promise<{ resource: TrainerResource } | null> {
  const res = await fetch(`${apiBase()}/resources`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as {
    resource?: TrainerResource;
  };
  return data.resource ? { resource: data.resource } : null;
}

export async function requestResourceUploadUrl(
  token: string,
  resourceId: string,
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; key: string } | null> {
  const res = await fetch(
    `${apiBase()}/resources/${encodeURIComponent(resourceId)}/upload-url`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename, contentType }),
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as {
    uploadUrl?: string;
    key?: string;
  };
  if (!data.uploadUrl?.trim()) return null;
  return { uploadUrl: data.uploadUrl, key: (data.key ?? filename).trim() };
}

export async function deleteTrainerResource(
  token: string,
  resourceId: string,
): Promise<boolean> {
  const res = await fetch(
    `${apiBase()}/resources/${encodeURIComponent(resourceId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  return res.ok;
}

/** Sustituye el conjunto de miembros con acceso al recurso */
export async function patchResourceShares(
  token: string,
  resourceId: string,
  memberIds: string[],
): Promise<boolean> {
  const res = await fetch(
    `${apiBase()}/resources/${encodeURIComponent(resourceId)}/shares`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ memberIds }),
      cache: "no-store",
    },
  );
  return res.ok;
}

export async function getTrainerResourceDownloadUrl(
  token: string,
  resourceId: string,
): Promise<string | null> {
  const res = await fetch(
    `${apiBase()}/resources/${encodeURIComponent(resourceId)}/download-url`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { url?: string };
  return data.url?.trim() ?? null;
}

/** Acepta `filename` o `fileName` según versión del API. */
function normalizeMemberResourceRow(
  raw: Record<string, unknown>,
): MemberResource | null {
  const id = typeof raw.id === "string" ? raw.id : null;
  if (!id) return null;
  const rt = raw.resourceType;
  if (rt !== "diet" && rt !== "routine" && rt !== "general") return null;
  const filename =
    (typeof raw.filename === "string" && raw.filename) ||
    (typeof raw.fileName === "string" && raw.fileName) ||
    "";
  const title = typeof raw.title === "string" ? raw.title : "";
  const description =
    typeof raw.description === "string" || raw.description === null
      ? (raw.description as string | null)
      : null;
  const contentType =
    typeof raw.contentType === "string" ? raw.contentType : "";
  const createdAt =
    typeof raw.createdAt === "string"
      ? raw.createdAt
      : new Date().toISOString();
  return {
    id,
    title,
    description,
    resourceType: rt,
    filename,
    contentType,
    createdAt,
  };
}

export async function listMemberResources(
  token: string,
): Promise<MemberResource[]> {
  const res = await fetch(`${apiBase()}/members/me/resources`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json().catch(() => ({}))) as {
    resources?: unknown[];
  };
  if (!Array.isArray(data.resources)) return [];
  return data.resources
    .map((row) =>
      row && typeof row === "object"
        ? normalizeMemberResourceRow(row as Record<string, unknown>)
        : null,
    )
    .filter((r): r is MemberResource => r != null);
}

export async function getMemberResourceDownloadUrl(
  token: string,
  resourceId: string,
): Promise<string | null> {
  const res = await fetch(
    `${apiBase()}/members/me/resources/${encodeURIComponent(resourceId)}/download-url`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { url?: string };
  return data.url?.trim() ?? null;
}
