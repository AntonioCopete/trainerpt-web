"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ResponseViewer } from "../../../components/forms/ResponseViewer";
import { createSupabaseBrowser } from "../../../lib/supabase/browser";
import { getPresignedPhotoUrl } from "../../../lib/forms-upload";
import type {
  FormAssignment,
  FormResponse,
  FormTemplate,
  CustomField,
  MeasurementData,
} from "../../../lib/types/forms";
import {
  MANDATORY_BASICS,
  MANDATORY_MEASUREMENTS,
  MANDATORY_PHOTOS,
} from "../../../lib/types/forms";

const MEASUREMENT_KEYS = [
  ...MANDATORY_BASICS,
  ...MANDATORY_MEASUREMENTS,
] as const;
const PHOTO_KEYS = [...MANDATORY_PHOTOS] as const;

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] = useState<FormAssignment | null>(null);
  const [response, setResponse] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        if (!token) {
          setError("Sesión expirada");
          return;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/assignments/${assignmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );

        if (!res.ok) {
          setError("No se pudo cargar el formulario");
          return;
        }

        const data = await res.json();
        const rawAssignment = data.assignment ?? data;
        if (!rawAssignment) {
          setError("Formulario no encontrado");
          return;
        }

        const template: FormTemplate | null = rawAssignment.template ?? null;
        const schemaSource =
          template?.customFields ??
          template?.schema ??
          rawAssignment.schemaSnapshot;
        const customFields: CustomField[] = Array.isArray(schemaSource)
          ? schemaSource
              .filter((f: CustomField) => !f.required)
              .map((f: CustomField, i: number) => ({
                ...f,
                id: f.id ?? `field_${f.order ?? i}`,
              }))
          : [];
        const member = rawAssignment.member;
        const assignmentData: FormAssignment = {
          ...rawAssignment,
          template: template ? { ...template, customFields } : null,
          clientId:
            rawAssignment.clientId ??
            rawAssignment.memberId ??
            rawAssignment.id,
          clientName:
            rawAssignment.clientName ??
            member?.fullName ??
            member?.email ??
            "Cliente",
        };
        setAssignment(assignmentData);

        const rawResponse =
          data.response ?? rawAssignment.responses?.[0] ?? data.responses?.[0];
        if (!rawResponse?.answers || assignmentData.status !== "completed") {
          setResponse(null);
          return;
        }

        const answers = rawResponse.answers as Record<string, unknown>;
        const measurements: Record<string, number> = {};
        for (const key of MEASUREMENT_KEYS) {
          const v = answers[key];
          if (typeof v === "number" && !Number.isNaN(v)) {
            measurements[key] = v;
          }
        }

        const photoKeys: string[] = [];
        for (const key of PHOTO_KEYS) {
          const v = answers[key];
          if (typeof v === "string" && v) photoKeys.push(key);
        }
        for (const [fieldId, v] of Object.entries(answers)) {
          if (
            typeof v === "string" &&
            v &&
            customFields.some((f) => f.id === fieldId && f.type === "photo")
          ) {
            photoKeys.push(fieldId);
          }
        }

        const photoUrls: Record<string, string> = {};
        for (const key of photoKeys) {
          const s3Key = String(answers[key]);
          try {
            photoUrls[key] = await getPresignedPhotoUrl(s3Key, token);
          } catch {
            photoUrls[key] = "";
          }
        }

        const customFieldValues: { fieldId: string; value: string | number }[] =
          [];
        for (const field of customFields) {
          const val = answers[field.id];
          if (val === undefined || val === null) continue;
          if (field.type === "photo") {
            customFieldValues.push({
              fieldId: field.id,
              value: photoUrls[field.id] ?? String(val),
            });
          } else {
            customFieldValues.push({
              fieldId: field.id,
              value: val as string | number,
            });
          }
        }

        const formResponse: FormResponse = {
          id: rawResponse.id,
          assignmentId: rawAssignment.id,
          assignment: {
            ...assignmentData,
            template: template ? { ...template, customFields } : null,
          },
          clientId: assignmentData.clientId,
          clientName: assignmentData.clientName,
          measurements: measurements as unknown as FormResponse["measurements"],
          photos: {
            front: photoUrls.front ?? "",
            side: photoUrls.side ?? "",
          },
          customFieldValues,
          submittedAt: rawResponse.submittedAt ?? new Date().toISOString(),
        };
        if (!cancelled) setResponse(formResponse);
      } catch {
        if (!cancelled) setError("Error al cargar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [assignmentId, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-red-500" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="py-20 text-center text-gray-500">
          {error ?? "Formulario no encontrado"}
        </div>
      </div>
    );
  }

  if (assignment.status !== "completed" || !response) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {assignment.template?.name ?? "Formulario"}
            </h1>
            <p className="mt-0.5 text-sm text-gray-400">
              {assignment.clientName} · Pendiente de completar
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-center text-gray-500">
          Este formulario aún no ha sido completado por el miembro.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Respuesta de {response.clientName}
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            {assignment.template?.name ?? "Formulario"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <ResponseViewer response={response} />
      </div>
    </div>
  );
}
