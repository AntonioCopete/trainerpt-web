import type { RoutineTemplateExercise } from "@/src/app/lib/types/routines";

/**
 * Clona el schema de una plantilla o snapshot de asignación para crear una plantilla nueva.
 * Quita IDs de línea que no deben reusarse en el alta.
 */
export function cloneRoutineSchemaForNewTemplate(
  schema: RoutineTemplateExercise[] | unknown,
): RoutineTemplateExercise[] {
  if (!Array.isArray(schema)) return [];

  const out: RoutineTemplateExercise[] = [];
  let idx = 0;
  for (const raw of schema) {
    if (!raw || typeof raw !== "object") continue;
    const item = structuredClone(raw) as RoutineTemplateExercise & {
      id?: string;
    };
    delete item.id;
    item.order = idx++;
    out.push(item);
  }
  return out;
}
