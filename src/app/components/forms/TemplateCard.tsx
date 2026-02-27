"use client";

import { motion } from "framer-motion";
import {
  ClipboardList,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  Send,
} from "lucide-react";
import type { FormTemplate } from "../../lib/types/forms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TemplateCardProps {
  template: FormTemplate;
  index?: number;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSend: (template: FormTemplate) => void;
  onClick: (id: string) => void;
}

export function TemplateCard({
  template,
  index = 0,
  onEdit,
  onDuplicate,
  onDelete,
  onSend,
  onClick,
}: TemplateCardProps) {
  const customFields = template.schema.filter((field) => !field?.required);
  const totalFields = template.schema.length; // 7 measurements + 2 photos + custom
  const date = new Date(template.updatedAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative rounded-2xl border border-gray-800 bg-gray-900/60 p-5 transition-colors hover:border-gray-700 hover:bg-gray-900/80 cursor-pointer"
      onClick={() => onClick(template.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
            <ClipboardList className="h-5 w-5 text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-white">
              {template.name}
            </h3>
            <p className="text-xs text-gray-500">Actualizado {date}</p>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg p-1.5 text-gray-500 opacity-0 transition-opacity hover:bg-gray-800 hover:text-gray-300 group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-gray-800 bg-gray-900 text-gray-300"
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onSend(template);
              }}
              className="gap-2 focus:bg-gray-800 focus:text-white"
            >
              <Send className="h-4 w-4" />
              Enviar a cliente
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(template.id);
              }}
              className="gap-2 focus:bg-gray-800 focus:text-white"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(template.id);
              }}
              className="gap-2 focus:bg-gray-800 focus:text-white"
            >
              <Copy className="h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(template.id);
              }}
              className="gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-400">
        {template.description}
      </p>

      {/* Footer chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300">
          {totalFields} campos
        </span>
        {customFields.length > 0 && (
          <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400">
            {customFields.length} personalizados
          </span>
        )}
      </div>
    </motion.div>
  );
}
