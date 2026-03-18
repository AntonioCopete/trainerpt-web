// ============================================
// Form System Types - Prepared for NestJS API
// ============================================

// --- Field Types ---

export type CustomFieldType = "text" | "number" | "photo";

export interface CustomField {
  id: string;
  type: CustomFieldType;
  label: string;
  required: boolean;
  /** Only for "number" fields */
  unit?: string;
  /** Display order */
  order: number;
}

// --- Mandatory measurement keys ---

export const MANDATORY_MEASUREMENTS = [
  "shoulders",
  "chest",
  "biceps",
  "waist",
  "hips",
  "quadriceps",
  "calves",
] as const;

export type MeasurementKey = (typeof MANDATORY_MEASUREMENTS)[number];

export const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  shoulders: "Hombros",
  chest: "Pecho",
  biceps: "Bíceps",
  waist: "Cintura",
  hips: "Cadera",
  quadriceps: "Cuádriceps",
  calves: "Gemelos",
};

// --- Mandatory basic data keys (always required) ---

export const MANDATORY_BASICS = ["weight", "age"] as const;
export type BasicKey = (typeof MANDATORY_BASICS)[number];

export const BASIC_LABELS: Record<BasicKey, string> = {
  weight: "Peso",
  age: "Edad",
};

export const BASIC_UNITS: Record<BasicKey, string> = {
  weight: "kg",
  age: "años",
};

export type MandatoryKey = BasicKey | MeasurementKey;

// --- Mandatory photo types ---

export const MANDATORY_PHOTOS = ["front", "side"] as const;
export type PhotoType = (typeof MANDATORY_PHOTOS)[number];

export const PHOTO_LABELS: Record<PhotoType, string> = {
  front: "Foto frontal",
  side: "Foto lateral",
};

// --- Default fields for new templates ---

export function getDefaultTemplateFields(): CustomField[] {
  return [
    {
      id: "weight",
      type: "number",
      label: "Peso",
      unit: "kg",
      required: true,
      order: 0,
    },
    {
      id: "age",
      type: "number",
      label: "Edad",
      unit: "años",
      required: true,
      order: 1,
    },
    {
      id: "shoulders",
      type: "number",
      label: "Hombros",
      unit: "cm",
      required: true,
      order: 2,
    },
    {
      id: "chest",
      type: "number",
      label: "Pecho",
      unit: "cm",
      required: true,
      order: 3,
    },
    {
      id: "biceps",
      type: "number",
      label: "Bíceps",
      unit: "cm",
      required: true,
      order: 4,
    },
    {
      id: "waist",
      type: "number",
      label: "Cintura",
      unit: "cm",
      required: true,
      order: 5,
    },
    {
      id: "hips",
      type: "number",
      label: "Cadera",
      unit: "cm",
      required: true,
      order: 6,
    },
    {
      id: "quadriceps",
      type: "number",
      label: "Cuádriceps",
      unit: "cm",
      required: true,
      order: 7,
    },
    {
      id: "calves",
      type: "number",
      label: "Gemelos",
      unit: "cm",
      required: true,
      order: 8,
    },
    {
      id: "front",
      type: "photo",
      label: "Foto frontal",
      required: true,
      order: 9,
    },
    {
      id: "side",
      type: "photo",
      label: "Foto lateral",
      required: true,
      order: 10,
    },
  ];
}

// --- Template ---

export interface FormTemplate {
  id: string;
  trainerId: string;
  name: string;
  description: string;
  schema: CustomField[];
  /** Optional; when present (e.g. from API or derived from schema) used for fill-form UI */
  customFields?: CustomField[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  description: string;
  /** Custom fields including stable, i18n-friendly id (e.g. "weight", "body_fat") */
  customFields: CustomField[];
}

export interface UpdateTemplatePayload extends CreateTemplatePayload {
  id: string;
}

// --- Sent Form (assignment to a client) ---

export type FormAssignmentStatus = "pending" | "completed";

export interface FormAssignment {
  id: string;
  templateId: string | null;
  template: FormTemplate | null;
  trainerId: string;
  clientId: string;
  clientName: string;
  status: FormAssignmentStatus;
  /** Fecha de envío; backend usa createdAt según Prisma */
  createdAt: string;
  /** @deprecated Usar createdAt; mantener por compatibilidad con backend */
  sentAt?: string;
  /** Fecha límite opcional para completar */
  dueAt?: string | null;
}

/** Fecha de envío para mostrar; acepta createdAt o sentAt (legacy) */
export function formatAssignmentSentDate(assignment: {
  createdAt?: string | null;
  sentAt?: string | null;
}): string {
  const raw = assignment.createdAt ?? assignment.sentAt;
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Fecha de respuesta (FormResponse.submittedAt) */
export function formatResponseDate(submittedAt: string | undefined): string {
  if (!submittedAt) return "—";
  const d = new Date(submittedAt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface SendFormPayload {
  templateId: string;
  clientId: string;
}

// --- Form Response (client submission) ---

export interface MeasurementData {
  /** kg */
  weight: number;
  /** years */
  age: number;
  shoulders: number;
  chest: number;
  biceps: number;
  waist: number;
  hips: number;
  quadriceps: number;
  calves: number;
}

export interface PhotoData {
  front: string; // URL or base64
  side: string;
}

export interface CustomFieldValue {
  fieldId: string;
  value: string | number;
}

export interface FormResponse {
  id: string;
  assignmentId: string;
  assignment: FormAssignment;
  clientId: string;
  clientName: string;
  measurements: MeasurementData;
  photos: PhotoData;
  customFieldValues: CustomFieldValue[];
  submittedAt: string;
}

export interface SubmitFormPayload {
  assignmentId: string;
  measurements: MeasurementData;
  photos: {
    front: File | null;
    side: File | null;
  };
  customFieldValues: CustomFieldValue[];
}

// --- Client (minimal, for selecting recipients) ---

export interface MemberSummary {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

// --- Field ID: clave estable, independiente del idioma (ej: weight, body_fat) ---

/**
 * Devuelve un id placeholder único para un campo nuevo (ej: field_0, field_1).
 * El usuario debe sustituirlo por una clave estándar (inglés, minúsculas).
 */
export function nextPlaceholderFieldId(existingIds: string[]): string {
  const set = new Set(existingIds);
  let n = 0;
  while (set.has(`field_${n}`)) n++;
  return `field_${n}`;
}

/** Normaliza input del usuario a id válido: solo [a-z0-9_], minúsculas */
export function normalizeFieldId(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 64) || ""
  );
}
