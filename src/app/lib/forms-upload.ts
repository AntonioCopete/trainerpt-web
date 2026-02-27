/**
 * S3 presigned upload flow for form assignment photos.
 * Backend: POST /forms/assignments/:assignmentId/upload-url
 * DTO: PresignedUploadUrlDto { filename, contentType }
 */

export interface PresignedUploadUrlDto {
  filename: string;
  contentType: string;
}

export interface PresignedUploadUrlResult {
  /** URL presignada para PUT (tu backend la devuelve como uploadUrl) */
  uploadUrl: string;
  fileUrl?: string;
  key: string;
}

export async function uploadPhotoWithPresignedUrl(opts: {
  assignmentId: string;
  file: File;
  /** Nombre del archivo para el DTO (ej: "front", "side", "custom_fieldId") */
  filename: string;
  token: string;
}): Promise<string> {
  const { assignmentId, file, filename, token } = opts;
  const contentType = file.type || "image/jpeg";
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  const res = await fetch(
    `${base}/forms/assignments/${assignmentId}/upload-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename,
        contentType,
      } as PresignedUploadUrlDto),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      err || `No se pudo obtener la URL de subida (${res.status}).`,
    );
  }
  const data = (await res.json()) as PresignedUploadUrlResult;
  const uploadUrl = data?.uploadUrl;
  if (!uploadUrl?.trim()) {
    throw new Error("El servidor no devolvió una URL de subida válida.");
  }
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });
  if (!putRes.ok) {
    throw new Error(
      `La subida del archivo falló (${putRes.status}). Inténtalo de nuevo.`,
    );
  }
  const key = (data.key ?? filename)?.trim();
  if (!key) {
    throw new Error("El servidor no devolvió la clave del archivo subido.");
  }
  return key;
}

/** Obtiene URL de lectura presignada para una foto en S3 (visualizar respuesta) */
export async function getPresignedPhotoUrl(
  key: string,
  token: string,
): Promise<string> {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  const res = await fetch(
    `${base}/forms/photo-url?key=${encodeURIComponent(key)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error("No se pudo obtener la URL de la foto");
  const data = (await res.json()) as { url?: string };
  return data.url ?? key;
}
