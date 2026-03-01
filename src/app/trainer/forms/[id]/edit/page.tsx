"use client";

import { useState, useEffect, use, useCallback } from "react";
import { TemplateEditor } from "../../../../components/forms/TemplateEditor";
import type { FormTemplate } from "../../../../lib/types/forms";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
// import { getTemplate } from "@/lib/api/forms";

export default function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createSupabaseBrowser();

  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forms/template/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      if (!res.ok) {
        setTemplate(null);
        return;
      }

      const data = await res.json();
      const tpl = data.template;
      if (!tpl) {
        setTemplate(null);
        return;
      }
      const schema = tpl.schema ?? [];
      tpl.customFields = schema.filter((field) => !field.required);
      setTemplate(tpl);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-red-500" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="py-20 text-center text-gray-500">
        Plantilla no encontrada
      </div>
    );
  }

  return <TemplateEditor existing={template} />;
}
