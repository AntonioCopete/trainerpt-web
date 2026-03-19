"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ResponseViewer } from "../../../components/forms/ResponseViewer";
import { createSupabaseBrowser } from "../../../lib/supabase/browser";
import { getPresignedPhotoUrl } from "../../../lib/forms-upload";
import type { FormAssignment, CustomField } from "../../../lib/types/forms";

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] = useState<FormAssignment | null>(null);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [submittedAt, setSubmittedAt] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
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

        // Get schema fields
        const template = rawAssignment.template ?? null;
        const schemaSource =
          template?.customFields ??
          template?.schema ??
          rawAssignment.schemaSnapshot;
        const schemaFields: CustomField[] = Array.isArray(schemaSource)
          ? schemaSource.map((f: CustomField, i: number) => ({
              ...f,
              id: f.id ?? `field_${f.order ?? i}`,
            }))
          : [];

        // Get member info
        const member = rawAssignment.member;
        const name =
          rawAssignment.clientName ??
          member?.fullName ??
          member?.email ??
          "Cliente";

        setAssignment({
          ...rawAssignment,
          template: template ? { ...template, schema: schemaFields } : null,
          clientName: name,
        });
        setFields(schemaFields);
        setClientName(name);

        // Get response
        const rawResponse =
          data.response ?? rawAssignment.responses?.[0] ?? data.responses?.[0];
        if (!rawResponse?.answers || rawAssignment.status !== "completed") {
          return;
        }

        const answers = rawResponse.answers as Record<string, unknown>;
        setSubmittedAt(rawResponse.submittedAt ?? "");

        // Separate values and photos
        const photoFields = schemaFields.filter((f) => f.type === "photo");
        const valueFields = schemaFields.filter((f) => f.type !== "photo");

        // Extract values
        const extractedValues: Record<string, string | number> = {};
        for (const field of valueFields) {
          const val = answers[field.id];
          if (val !== undefined && val !== null) {
            extractedValues[field.id] = val as string | number;
          }
        }
        if (!cancelled) setValues(extractedValues);

        // Get presigned URLs for photos
        const urls: Record<string, string> = {};
        for (const field of photoFields) {
          const s3Key = answers[field.id];
          if (typeof s3Key === "string" && s3Key) {
            try {
              urls[field.id] = await getPresignedPhotoUrl(s3Key, token);
            } catch {
              urls[field.id] = "";
            }
          }
        }
        if (!cancelled) setPhotoUrls(urls);
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

  if (assignment.status !== "completed" || !submittedAt) {
    const statusText =
      assignment.status === "archived"
        ? "Cancelado"
        : assignment.status === "missed"
          ? "Tiempo agotado"
          : "Pendiente de completar";

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
              {clientName} · {statusText}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-center text-gray-500">
          {assignment.status === "archived"
            ? "Este formulario fue cancelado por el entrenador."
            : assignment.status === "missed"
              ? "Este formulario ya no puede completarse."
              : "Este formulario aún no ha sido completado por el miembro."}
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
            Respuesta de {clientName}
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            {assignment.template?.name ?? "Formulario"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <ResponseViewer
          clientName={clientName}
          submittedAt={submittedAt}
          fields={fields}
          values={values}
          photoUrls={photoUrls}
        />
      </div>
    </div>
  );
}
