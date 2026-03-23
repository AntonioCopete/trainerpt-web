"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createSupabaseBrowser } from "@/src/app/lib/supabase/browser";

interface CustomExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CustomExerciseDialog({
  open,
  onOpenChange,
  onCreated,
}: CustomExerciseDialogProps) {
  const supabase = createSupabaseBrowser();
  const [name, setName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [descriptionLines, setDescriptionLines] = useState<string[]>([""]);
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setCategoryName("");
    setDescriptionLines([""]);
    setImageUrl("");
    setVideoUrl("");
  }, [open]);

  const updateDescriptionLine = (index: number, value: string) => {
    setDescriptionLines((prev) =>
      prev.map((line, idx) => (idx === index ? value : line)),
    );
  };

  const addDescriptionLine = () => {
    setDescriptionLines((prev) => [...prev, ""]);
  };

  const removeDescriptionLine = (index: number) => {
    setDescriptionLines((prev) => {
      if (prev.length === 1) return [""];
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const normalizedDescription = descriptionLines
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/routines/exercises/custom`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            categoryName: categoryName.trim() || undefined,
            description: normalizedDescription || undefined,
            imageUrl: imageUrl.trim() || undefined,
            videoUrl: videoUrl.trim() || undefined,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message ?? "No se pudo crear el ejercicio");
        return;
      }

      toast.success("Ejercicio creado");
      onCreated?.();
      onOpenChange(false);
    } catch {
      toast.error("No se pudo crear el ejercicio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nuevo ejercicio propio</DialogTitle>
          <DialogDescription className="text-gray-400">
            Este ejercicio sera visible solo para ti al crear rutinas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del ejercicio"
            className="border-gray-700 bg-gray-800 text-gray-100"
          />
          <Input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Categoria (opcional)"
            className="border-gray-700 bg-gray-800 text-gray-100"
          />
          <div className="space-y-2 rounded-lg border border-gray-700 bg-gray-800/40 p-3">
            <p className="text-xs text-gray-400">
              Descripción en pasos (cada línea se guarda como un item)
            </p>
            <div className="space-y-2">
              {descriptionLines.map((line, index) => (
                <div key={`line-${index}`} className="flex items-center gap-2">
                  <span className="w-6 text-xs text-gray-400">
                    {index + 1}.
                  </span>
                  <Input
                    value={line}
                    onChange={(e) =>
                      updateDescriptionLine(index, e.target.value)
                    }
                    placeholder={`Paso ${index + 1}`}
                    className="border-gray-700 bg-gray-800 text-gray-100"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeDescriptionLine(index)}
                    className="border-gray-700 bg-transparent px-2 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    -
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addDescriptionLine}
              className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Añadir línea
            </Button>
          </div>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="URL de imagen (opcional)"
            className="border-gray-700 bg-gray-800 text-gray-100"
          />
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="URL de video (opcional)"
            className="border-gray-700 bg-gray-800 text-gray-100"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
          >
            {saving ? "Guardando..." : "Crear ejercicio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
