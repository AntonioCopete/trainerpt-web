/**
 * Mensaje de error legible al guardar entidades con nombre + descripción vía API
 * (plantillas de rutina y plantillas de formulario).
 */
export function messageFromTemplateSaveResponse(
  res: Response,
  data: unknown,
  fallback: string,
): string {
  const raw =
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message: unknown }).message === "string"
      ? (data as { message: string }).message.trim()
      : "";
  const lower = raw.toLowerCase();
  const looksEmptyField =
    lower.includes("vac") ||
    lower.includes("empty") ||
    lower.includes("obligator") ||
    lower.includes("required") ||
    lower.includes("blank") ||
    lower.includes("must not") ||
    lower.includes("missing");

  if (res.status === 400 || res.status === 422) {
    if (
      (lower.includes("descripci") || /\bdescription\b/.test(lower)) &&
      looksEmptyField
    ) {
      return "La descripción es obligatoria.";
    }
    if (
      (lower.includes("nombre") ||
        /\bname\b/.test(lower) ||
        lower.includes("title")) &&
      looksEmptyField
    ) {
      return "El nombre es obligatorio.";
    }
  }

  if (/error interno|internal server error/i.test(raw)) {
    return "No se pudo guardar. Comprueba que el nombre y la descripción estén rellenados.";
  }

  return raw || fallback;
}
