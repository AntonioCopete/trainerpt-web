export type RoutineAssignmentStatus =
  | "scheduled"
  | "active"
  | "expired"
  | "archived";

export interface RoutineTemplate {
  id: string;
  trainerId: string;
  name: string;
  description: string;
  schema: RoutineTemplateExercise[];
  isArchived: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineAssignment {
  id: string;
  trainerId: string;
  memberId: string;
  templateId?: string | null;
  template?: Pick<RoutineTemplate, "id" | "name" | "description"> | null;
  member?: {
    id: string;
    fullName: string | null;
    email: string;
  };
  schemaSnapshot: RoutineTemplateExercise[];
  startDate: string;
  endDate: string;
  status: RoutineAssignmentStatus;
  computedStatus?: RoutineAssignmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutineTemplatePayload {
  name: string;
  description: string;
  schema: RoutineTemplateExercise[];
}

export interface UpdateRoutineTemplatePayload {
  name?: string;
  description?: string;
  schema?: RoutineTemplateExercise[];
}

export interface AssignRoutinePayload {
  memberId: string;
  startDate: string;
  endDate: string;
}

export interface CreateCustomRoutinePayload {
  memberId: string;
  name: string;
  description: string;
  schema: RoutineTemplateExercise[];
  startDate: string;
  endDate: string;
}

export interface RoutineExercise {
  id: string;
  source: "wger" | "free_exercise_db" | "custom";
  externalId: number | null;
  trainerId?: string | null;
  author?: string;
  license?: {
    id?: number | null;
    shortName?: string | null;
    fullName?: string | null;
    url?: string | null;
  } | null;
  name: string;
  nameEs?: string | null;
  description?: string | string[] | null;
  descriptionEs?: string[] | null;
  categoryName?: string | null;
  categoryNameEs?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  imageUrls?: string[];
  videoUrls?: string[];
  muscles?: string[] | { name: string }[] | null;
  musclesSecondary?: string[] | { name: string }[] | null;
  /** Etiquetas listas para UI (backend); preferir sobre muscles crudos */
  muscleLabelsPrimary?: string[];
  muscleLabelsSecondary?: string[];
}

export interface RoutineTemplateExercise {
  id?: string;
  exerciseId: string;
  source: "wger" | "free_exercise_db" | "custom";
  trainerId?: string | null;
  author?: string;
  license?: {
    id?: number | null;
    shortName?: string | null;
    fullName?: string | null;
    url?: string | null;
  } | null;
  name: string;
  nameEs?: string | null;
  description?: string | string[] | null;
  descriptionEs?: string[] | null;
  categoryName?: string | null;
  categoryNameEs?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  imageUrls?: string[];
  videoUrls?: string[];
  muscles?: string[] | { name: string }[] | null;
  musclesSecondary?: string[] | { name: string }[] | null;
  instructions: string;
  trainingTitle: string;
  order: number;
}

export interface MuscleCatalogItem {
  id: string;
  name: string;
  nameEs: string;
}

export interface CreateCustomExercisePayload {
  name: string;
  description?: string;
  categoryName?: string;
  imageUrl?: string;
  videoUrl?: string;
  primaryMuscleIds?: string[];
  secondaryMuscleIds?: string[];
}

/** Respuesta de GET/PATCH ejercicio propio para el formulario de edición */
export interface CustomExerciseForEdit {
  id: string;
  name: string;
  categoryName: string | null;
  description: string;
  imageUrl: string | null;
  videoUrl: string | null;
  primaryMuscleId: string | null;
  secondaryMuscleIds: string[];
}

export const ROUTINE_STATUS_LABELS: Record<RoutineAssignmentStatus, string> = {
  scheduled: "Programada",
  active: "Activa",
  expired: "Finalizada",
  archived: "Archivada",
};

export function formatRoutineDate(dateInput: string | Date): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
