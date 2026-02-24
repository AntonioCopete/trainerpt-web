"use client";

import { useState, useEffect } from "react";
import { Search, Send, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FormTemplate, ClientSummary } from "../../lib/types/forms";
// import { getClients, sendForm } from "@/lib/api/forms";

interface SendFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FormTemplate | null;
  onSent?: () => void;
}

export function SendFormDialog({
  open,
  onOpenChange,
  template,
  onSent,
}: SendFormDialogProps) {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      //   getClients().then(setClients);
      setSearch("");
      setSelectedClientId(null);
    }
  }, [open]);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSend = async () => {
    if (!template || !selectedClientId) return;
    setSending(true);
    try {
      //   await sendForm({ templateId: template.id, clientId: selectedClientId });
      onSent?.();
      onOpenChange(false);
    } catch {
      // Error handling would go here
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Enviar formulario</DialogTitle>
          <DialogDescription className="text-gray-400">
            {template
              ? `Enviar "${template.name}" a un cliente`
              : "Selecciona un cliente"}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="h-10 rounded-xl border-gray-700 bg-gray-800 pl-10 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20"
          />
        </div>

        {/* Client list */}
        <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
          {filteredClients.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              No se encontraron clientes
            </p>
          ) : (
            filteredClients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => setSelectedClientId(client.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  selectedClientId === client.id
                    ? "bg-red-500/10 border border-red-500/30"
                    : "hover:bg-gray-800 border border-transparent"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {client.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {client.email}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedClientId || sending}
            className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
