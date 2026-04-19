"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "../../lib/supabase/browser";
import {
  SubscriptionWithUsage,
  PLAN_INFO,
  SubscriptionPlan,
} from "../../lib/types/subscription";

export default function BillingPage() {
  const [subscription, setSubscription] =
    useState<SubscriptionWithUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingToPlan, setUpgradingToPlan] =
    useState<SubscriptionPlan | null>(null);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/subscriptions/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (plan === SubscriptionPlan.FREE) return;

    setUpgradingToPlan(plan);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/subscriptions/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan }),
        },
      );

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        alert("Error al crear sesión de checkout");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Error al procesar el pago");
    } finally {
      setUpgradingToPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/subscriptions/portal`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Error opening portal:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  const currentPlanInfo = subscription ? PLAN_INFO[subscription.plan] : null;
  const usagePercentage =
    subscription && subscription.clientLimit
      ? (subscription.clientCount / subscription.clientLimit) * 100
      : 0;

  return (
    <div className="min-h-screen py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
            Administra tu plan
          </h1>
          <p className="text-gray-400">Gestiona tu suscripción y facturación</p>
        </div>

        {/* Current Plan Card */}
        {subscription && currentPlanInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5" />
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">
                      Plan {currentPlanInfo.name}
                    </h2>
                    {subscription.plan !== SubscriptionPlan.FREE && (
                      <>
                        {subscription.status === "CANCELED" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium">
                            <AlertCircle className="h-3 w-3" />
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                            <Sparkles className="h-3 w-3" />
                            Activo
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    {currentPlanInfo.price}
                  </p>
                  {subscription.status === "CANCELED" &&
                    subscription.endsAt && (
                      <p className="text-sm text-yellow-400 mt-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Tu suscripción expira el{" "}
                        {new Date(subscription.endsAt).toLocaleDateString(
                          "es-ES",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            timeZone: "UTC", // Always display in UTC to match Stripe
                          },
                        )}
                      </p>
                    )}
                </div>
                {subscription.plan !== SubscriptionPlan.FREE && (
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    className="gap-2 border-gray-700 bg-gray-900 hover:border-red-500/50 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-orange-500/10 text-gray-100 hover:text-white transition-all"
                  >
                    <CreditCard className="h-4 w-4" />
                    Gestionar
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-medium">
                    Uso de clientes
                  </span>
                  <span className="text-white font-semibold">
                    {subscription.clientCount} /{" "}
                    {subscription.clientLimit ?? "∞"}
                  </span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      usagePercentage >= 100
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : usagePercentage >= 80
                          ? "bg-gradient-to-r from-orange-500 to-orange-600"
                          : "bg-gradient-to-r from-red-500 to-orange-500"
                    }`}
                  />
                </div>
                {usagePercentage >= 80 && subscription.clientLimit && (
                  <div
                    className={`flex items-start gap-2 p-3 rounded-xl ${
                      usagePercentage >= 100
                        ? "bg-red-500/10 border border-red-500/20"
                        : "bg-orange-500/10 border border-orange-500/20"
                    }`}
                  >
                    <AlertCircle
                      className={`h-5 w-5 shrink-0 mt-0.5 ${
                        usagePercentage >= 100
                          ? "text-red-400"
                          : "text-orange-400"
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        usagePercentage >= 100
                          ? "text-red-300"
                          : "text-orange-300"
                      }`}
                    >
                      {usagePercentage >= 100
                        ? "¡Has alcanzado el límite de clientes! Actualiza tu plan para agregar más."
                        : `Te quedan ${subscription.clientLimit - subscription.clientCount} cliente${subscription.clientLimit - subscription.clientCount === 1 ? "" : "s"} disponible${subscription.clientLimit - subscription.clientCount === 1 ? "" : "s"}.`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Planes Disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(PLAN_INFO).map((planInfo, index) => {
              const isCurrent = subscription?.plan === planInfo.plan;
              const canDowngrade =
                subscription &&
                PLAN_INFO[subscription.plan].priceAmount > planInfo.priceAmount;

              return (
                <motion.div
                  key={planInfo.plan}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  {/* Popular Badge - outside card to avoid clipping */}
                  {planInfo.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold shadow-lg">
                        <Sparkles className="h-3 w-3" />
                        Popular
                      </span>
                    </div>
                  )}

                  {/* Card */}
                  <div
                    className={`relative flex flex-col h-full rounded-2xl border transition-all duration-300 ${
                      planInfo.popular
                        ? "border-red-500/50 bg-gradient-to-br from-gray-900 to-red-950/30 shadow-lg shadow-red-500/20"
                        : "border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950"
                    } ${
                      isCurrent
                        ? "ring-2 ring-red-500/50"
                        : "hover:border-gray-700"
                    }`}
                  >
                    {/* Header */}
                    <div className="p-6 pb-4">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {planInfo.name}
                      </h3>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                          {planInfo.price.replace("/mes", "")}
                        </span>
                        <span className="text-gray-500">/mes</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex-grow px-6 pb-6">
                      <ul className="space-y-3">
                        {planInfo.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-300">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer */}
                    <div className="p-6 pt-0 mt-auto">
                      {isCurrent ? (
                        <div
                          role="status"
                          className="flex w-full items-center justify-center rounded-lg border border-orange-500/40 bg-gradient-to-r from-red-500/20 to-orange-500/20 py-2.5 text-sm font-semibold text-white shadow-inner shadow-black/20"
                        >
                          Plan Actual
                        </div>
                      ) : planInfo.plan === SubscriptionPlan.FREE ? (
                        <Button
                          className="w-full border-gray-700 hover:border-gray-600 hover:bg-gray-800/50"
                          variant="outline"
                          disabled
                        >
                          Plan Básico
                        </Button>
                      ) : canDowngrade ? (
                        <Button
                          className="w-full gap-2 border-gray-700 cursor-not-allowed"
                          variant="outline"
                          disabled
                        >
                          <TrendingUp className="h-4 w-4" />
                          Actualizar Plan
                        </Button>
                      ) : (
                        <Button
                          className="w-full gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/20"
                          onClick={() => handleUpgrade(planInfo.plan)}
                          disabled={upgradingToPlan !== null}
                        >
                          {upgradingToPlan === planInfo.plan ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-4 w-4" />
                              Actualizar Plan
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            Preguntas Frecuentes
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-white mb-2">
                ¿Puedo cancelar en cualquier momento?
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Sí, puedes cancelar tu suscripción en cualquier momento. Tu plan
                seguirá activo hasta el final del período pagado.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                ¿Qué pasa si supero el límite de clientes?
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                No podrás agregar más clientes hasta que actualices tu plan o
                elimines algunos clientes existentes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                ¿Puedo cambiar de plan?
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Sí, puedes actualizar tu plan en cualquier momento. Los
                downgrades requieren contactar con soporte.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
