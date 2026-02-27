"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Search, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MemberSummary } from "../../lib/types/forms";
import { createSupabaseBrowser } from "../../lib/supabase/browser";
import { InviteClientDialog } from "../../components/InviteClientDialog";

export default function TrainerClientsPage() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const supabase = createSupabaseBrowser();

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const data = await res.json();
      setMembers(data.members ?? []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filtered = members.filter(
    (m) =>
      m.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="mt-1 text-sm text-gray-400">
            Gestiona los clientes vinculados a tu cuenta
          </p>
        </div>
        <Button
          onClick={() => setInviteDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-lg shadow-red-500/20"
        >
          <UserPlus className="h-4 w-4" />
          Invitar cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="h-10 rounded-xl border-gray-800 bg-gray-900 pl-10 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-gray-800 bg-gray-900/60"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-gray-900/30 py-16"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800/60">
            <User className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-300">
            {search ? "Sin resultados" : "Aún no tienes clientes"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 text-center max-w-xs">
            {search
              ? "Prueba con otro término de búsqueda"
              : "Invita a tus clientes con un enlace para que se registren y aparezcan aquí"}
          </p>
          {!search && (
            <Button
              onClick={() => setInviteDialogOpen(true)}
              className="mt-6 gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            >
              <UserPlus className="h-4 w-4" />
              Invitar cliente
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/trainer/members/${member.id}`)}
                className="group flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900/60 p-5 transition-colors hover:border-gray-700 hover:bg-gray-900/80 cursor-pointer"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
                  <User className="h-6 w-6 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {member.fullName || "Sin nombre"}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-sm text-gray-500">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {member.email}
                  </p>
                </div>
                <span className="text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <InviteClientDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
}
