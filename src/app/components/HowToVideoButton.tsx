"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TUTORIALS, type TutorialKey } from "../lib/tutorials";

interface HowToVideoButtonProps {
  tutorial: TutorialKey;
  label?: string;
  className?: string;
}

export function HowToVideoButton({
  tutorial,
  label = "Cómo funciona",
  className,
}: HowToVideoButtonProps) {
  const [open, setOpen] = useState(false);
  const data = TUTORIALS[tutorial];

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={
          className ??
          "gap-2 border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
        }
      >
        <PlayCircle className="h-4 w-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">{data.title}</DialogTitle>
          </DialogHeader>
          {open && (
            <div className="overflow-hidden rounded-lg border border-gray-800 bg-black">
              <video
                key={data.src}
                src={data.src}
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="aspect-video w-full"
              >
                Tu navegador no soporta la reproducción de vídeo HTML5.
              </video>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
