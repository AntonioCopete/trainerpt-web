"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ResponseViewer } from "../../../../../components/forms/ResponseViewer";
import type { FormResponse } from "../../../../../lib/types/forms";
// import { getResponse } from "@/lib/api/forms";

export default function ResponseDetailPage({
  params,
}: {
  params: Promise<{ id: string; responseId: string }>;
}) {
  const { id, responseId } = use(params);
  const router = useRouter();
  const [response, setResponse] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getResponse(responseId).then((r) => {
    //   setResponse(r);
    //   setLoading(false);
    // });
  }, [responseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-red-500" />
      </div>
    );
  }

  if (!response) {
    return (
      <div className="py-20 text-center text-gray-500">
        Respuesta no encontrada
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/trainer/forms/${id}`)}
          className="rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Respuesta de {response.clientName}
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            {response.assignment.template.name}
          </p>
        </div>
      </div>

      {/* Response content */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <ResponseViewer response={response} />
      </div>
    </div>
  );
}
