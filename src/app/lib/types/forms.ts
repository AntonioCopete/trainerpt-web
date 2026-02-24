// ============================================
// Form System Types - Prepared for NestJS API
// ============================================

// --- Field Types ---

export type CustomFieldType = "text" | "number" | "select" | "photo";

export interface SelectOption {
  id: string;
  label: string;
}

export interface CustomField {
  id: string;
  type: CustomFieldType;
  label: string;
  required: boolean;
  /** Only for "number" fields */
  unit?: string;
  /** Only for "select" fields */
  options?: SelectOption[];
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

// --- Template ---

export interface FormTemplate {
  id: string;
  trainerId: string;
  name: string;
  description: string;
  schema: CustomField[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  description: string;
  customFields: Omit<CustomField, "id">[];
}

export interface UpdateTemplatePayload extends CreateTemplatePayload {
  id: string;
}

// --- Sent Form (assignment to a client) ---

export type FormAssignmentStatus = "pending" | "completed";

export interface FormAssignment {
  id: string;
  templateId: string;
  template: FormTemplate;
  trainerId: string;
  clientId: string;
  clientName: string;
  status: FormAssignmentStatus;
  sentAt: string;
  completedAt?: string;
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

export interface ClientSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}
