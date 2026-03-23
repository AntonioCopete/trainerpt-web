"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RoutineTemplateExercise } from "@/src/app/lib/types/routines";
import { SafeHtml } from "@/src/app/components/routines/SafeHtml";

interface ExerciseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: RoutineTemplateExercise | null;
}

export function ExerciseDetailDialog({
  open,
  onOpenChange,
  exercise,
}: ExerciseDetailDialogProps) {
  if (!exercise) return null;

  const renderExerciseDescription = (
    value: string | string[] | null | undefined,
  ) => {
    if (!value) return null;
    if (Array.isArray(value)) {
      const lines = value.map((line) => line?.trim()).filter(Boolean);
      if (lines.length === 0) return null;
      return (
        <ul className="text-sm leading-6 text-gray-300 [&_li]:ml-5 [&_li]:list-disc">
          {lines.map((line, idx) => (
            <li key={`${idx}-${line}`}>{line}</li>
          ))}
        </ul>
      );
    }
    return (
      <SafeHtml
        html={value}
        className="text-sm leading-6 text-gray-300 [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-2"
      />
    );
  };

  const imageUrls =
    (exercise.imageUrls && exercise.imageUrls.length > 0
      ? exercise.imageUrls
      : exercise.imageUrl
        ? [exercise.imageUrl]
        : []) ?? [];
  const videoUrls =
    (exercise.videoUrls && exercise.videoUrls.length > 0
      ? exercise.videoUrls
      : exercise.videoUrl
        ? [exercise.videoUrl]
        : []) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-4xl border-gray-800 bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>{exercise.name}</DialogTitle>
          <div className="flex items-center">
            {exercise.source === "custom" && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                Creado por ti
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Autor:{" "}
            {exercise.source === "custom"
              ? exercise.author || "Tú"
              : "Biblioteca"}
          </p>
          {exercise.license?.shortName && (
            <p className="text-xs text-gray-500">
              Licencia:{" "}
              {exercise.license.url ? (
                <a
                  href={exercise.license.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300 hover:underline"
                >
                  {exercise.license.shortName}
                </a>
              ) : (
                exercise.license.shortName
              )}
            </p>
          )}
        </DialogHeader>
        <div className="max-h-[75vh] space-y-4 overflow-auto pr-1">
          {exercise.description ? (
            <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-200">
                Descripción
              </h4>
              {renderExerciseDescription(exercise.description)}
            </div>
          ) : null}

          {exercise.instructions ? (
            <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-200">
                Instrucciones del trainer
              </h4>
              <p className="text-sm leading-6 text-gray-300">
                {exercise.instructions}
              </p>
            </div>
          ) : null}

          {imageUrls.length > 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
              <h4 className="mb-3 text-sm font-semibold text-gray-200">
                Imagenes
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {imageUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt={exercise.name}
                      className="h-52 w-full rounded-lg border border-gray-700 bg-white object-contain"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {videoUrls.length > 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
              <h4 className="mb-3 text-sm font-semibold text-gray-200">
                Videos
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {videoUrls.map((url) => (
                  <video
                    key={url}
                    src={url}
                    controls
                    className="h-52 w-full rounded-lg border border-gray-700 bg-black object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
