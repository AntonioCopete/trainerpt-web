"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Ruler, Camera, Loader2 } from "lucide-react";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";
import {
  fetchMemberProgress,
  type MemberProgressPayload,
} from "@/src/app/lib/member-progress-api";
import { getPresignedPhotoUrlsBatch } from "@/src/app/lib/forms-upload";
import {
  isBaseFormTemplateFieldId,
  photoTypeForFieldId,
} from "@/src/app/lib/types/forms";
import { PhotoUpload } from "./PhotoUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MemberProgressPanelProps {
  /** Si se omite, se usa el progreso del usuario actual (vista miembro). */
  memberId?: string;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function MemberProgressPanel({ memberId }: MemberProgressPanelProps) {
  const supabase = createSupabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<MemberProgressPayload | null>(null);
  const [metricId, setMetricId] = useState<string>("");
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [photosLoading, setPhotosLoading] = useState(false);

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
          setProgress(null);
          return;
        }
        const data = await fetchMemberProgress({ token, memberId });
        if (cancelled) return;
        setProgress(data);
        const presetNumbers = data.numberFields.filter((field) =>
          isBaseFormTemplateFieldId(field.id),
        );
        const preferred =
          presetNumbers.find((f) => f.id === "weight")?.id ??
          presetNumbers[0]?.id ??
          "";
        setMetricId(preferred);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar");
          setProgress(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [memberId, supabase]);

  const presetNumberFields = useMemo(
    () =>
      progress?.numberFields.filter((field) =>
        isBaseFormTemplateFieldId(field.id),
      ) ?? [],
    [progress],
  );

  const presetPhotoFields = useMemo(
    () =>
      progress?.photoFields.filter((field) =>
        isBaseFormTemplateFieldId(field.id),
      ) ?? [],
    [progress],
  );

  const photoKeysSignature = useMemo(() => {
    if (!progress) return "";
    const keys = new Set<string>();
    for (const p of progress.points) {
      for (const k of Object.values(p.photoKeys)) {
        keys.add(k);
      }
    }
    return [...keys].sort().join("\0");
  }, [progress]);

  useEffect(() => {
    if (!progress || photoKeysSignature === "") {
      setPhotoUrls({});
      return;
    }

    const keys = photoKeysSignature.split("\0").filter(Boolean);
    if (keys.length === 0) {
      setPhotoUrls({});
      return;
    }

    let cancelled = false;

    async function presign() {
      setPhotosLoading(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        if (!token) return;
        const urls = await getPresignedPhotoUrlsBatch(keys, token);
        if (!cancelled) setPhotoUrls(urls);
      } catch {
        if (!cancelled) setPhotoUrls({});
      } finally {
        if (!cancelled) setPhotosLoading(false);
      }
    }

    void presign();
    return () => {
      cancelled = true;
    };
  }, [progress, photoKeysSignature, supabase]);

  const chartData = useMemo(() => {
    if (!progress || !metricId) return [];
    return progress.points
      .filter((p) => metricId in p.numbers)
      .map((p) => ({
        date: p.submittedAt,
        label: formatShortDate(p.submittedAt),
        value: p.numbers[metricId]!,
        templateName: p.templateName,
      }));
  }, [progress, metricId]);

  const selectedField = presetNumberFields.find((f) => f.id === metricId);

  const photoTimelinePoints = useMemo(() => {
    if (!progress) return [];
    return [...progress.points]
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      )
      .filter((point) =>
        presetPhotoFields.some((f) => Boolean(point.photoKeys[f.id])),
      );
  }, [progress, presetPhotoFields]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (!progress || progress.points.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Aún no hay envíos completados. Cuando completes formularios con medidas
        o fotos, verás aquí la evolución en el tiempo.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {presetNumberFields.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Evolución de medidas
              </h3>
            </div>
            {metricId ? (
              <Select value={metricId} onValueChange={setMetricId}>
                <SelectTrigger className="w-full border-gray-700 bg-gray-900 text-white sm:w-[240px]">
                  <SelectValue placeholder="Métrica" />
                </SelectTrigger>
                <SelectContent>
                  {presetNumberFields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                      {f.unit ? ` (${f.unit})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          {chartData.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay datos numéricos para esta métrica en los envíos guardados.
            </p>
          ) : (
            <div className="h-[280px] w-full rounded-xl border border-gray-800 bg-gray-900/40 p-2 pr-4 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="label"
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    domain={["auto", "auto"]}
                    width={44}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as (typeof chartData)[0];
                      return (
                        <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm shadow-xl">
                          <p className="text-xs text-gray-400">
                            {row.templateName}
                          </p>
                          <p className="font-medium text-white">
                            {selectedField?.label ?? "Valor"}:{" "}
                            {payload[0].value}
                            {selectedField?.unit
                              ? ` ${selectedField.unit}`
                              : ""}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(row.date).toLocaleString("es-ES", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#ea580c" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      )}

      {presetPhotoFields.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Fotos en el tiempo
            </h3>
            {photosLoading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-500" />
            ) : null}
          </div>

          {photoTimelinePoints.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay fotos en los envíos guardados.
            </p>
          ) : (
            photoTimelinePoints.map((point) => (
              <div
                key={`${point.assignmentId}-${point.submittedAt}`}
                className="rounded-xl border border-gray-800 bg-gray-900/40 p-4"
              >
                <p className="mb-3 text-xs text-gray-500">
                  {new Date(point.submittedAt).toLocaleString("es-ES", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                  <span className="ml-2 text-gray-600">
                    · {point.templateName}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {presetPhotoFields.map((pf) => {
                    const key = point.photoKeys[pf.id];
                    if (!key) return null;
                    const url = photoUrls[key] ?? "";
                    return (
                      <PhotoUpload
                        key={`${point.submittedAt}-${pf.id}-${url || "pending"}`}
                        photoType={photoTypeForFieldId(pf.id)}
                        value={url}
                        readOnly
                        compact
                        showLabel={false}
                        labelText={pf.label}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {presetNumberFields.length === 0 && presetPhotoFields.length === 0 && (
        <p className="text-sm text-gray-500">
          Los envíos completados no incluyen campos preestablecidos de medidas
          ni fotos.
        </p>
      )}
    </div>
  );
}
