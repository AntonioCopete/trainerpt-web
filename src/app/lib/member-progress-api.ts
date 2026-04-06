/**
 * Progreso del miembro: medidas y fotos en el tiempo (backend /forms/.../progress).
 */

export interface MemberProgressNumberField {
  id: string;
  label: string;
  unit?: string;
}

export interface MemberProgressPhotoField {
  id: string;
  label: string;
}

export interface MemberProgressPoint {
  assignmentId: string;
  templateId: string | null;
  templateName: string;
  submittedAt: string;
  numbers: Record<string, number>;
  photoKeys: Record<string, string>;
}

export interface MemberProgressPayload {
  points: MemberProgressPoint[];
  numberFields: MemberProgressNumberField[];
  photoFields: MemberProgressPhotoField[];
}

export async function fetchMemberProgress(opts: {
  token: string;
  /** Si se indica, vista trainer para ese miembro vinculado. */
  memberId?: string;
}): Promise<MemberProgressPayload> {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  const path = opts.memberId
    ? `/forms/members/${encodeURIComponent(opts.memberId)}/progress`
    : `/forms/me/progress`;

  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${opts.token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `No se pudo cargar el progreso (${res.status}).`);
  }

  const data = (await res.json()) as { progress?: MemberProgressPayload };
  const progress = data.progress;
  if (!progress || !Array.isArray(progress.points)) {
    throw new Error("Respuesta de progreso inválida.");
  }
  return progress;
}
