/**
 * Subida directa a GCS vía URL firmada devuelta por el backend.
 * Backend: POST /resources/:resourceId/upload-url { filename, contentType }
 */

export async function uploadResourceFile(opts: {
  uploadUrl: string;
  file: File;
  contentType: string;
}): Promise<void> {
  const { uploadUrl, file, contentType } = opts;
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType || file.type || "application/pdf" },
  });
  if (!putRes.ok) {
    throw new Error(
      `La subida del archivo falló (${putRes.status}). Inténtalo de nuevo.`,
    );
  }
}
