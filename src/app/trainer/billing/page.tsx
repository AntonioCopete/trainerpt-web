"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error opening portal:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlanInfo = subscription ? PLAN_INFO[subscription.plan] : null;
  const usagePercentage =
    subscription && subscription.clientLimit
      ? (subscription.clientCount / subscription.clientLimit) * 100
      : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Suscripción</h1>
          <p className="text-muted-foreground">
            Administra tu plan y facturación
          </p>
        </div>

        {/* Current Plan Card */}
        {subscription && currentPlanInfo && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Plan {currentPlanInfo.name}
                    {subscription.plan !== SubscriptionPlan.FREE && (
                      <Badge variant="default">Activo</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{currentPlanInfo.price}</CardDescription>
                </div>
                {subscription.plan !== SubscriptionPlan.FREE && (
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    className="gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Gestionar Suscripción
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Clientes</span>
                  <span className="text-sm text-muted-foreground">
                    {subscription.clientCount} /{" "}
                    {subscription.clientLimit ?? "∞"}
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                {usagePercentage >= 80 && subscription.clientLimit && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                    {usagePercentage >= 100
                      ? "¡Has alcanzado el límite de clientes!"
                      : `Te quedan ${subscription.clientLimit - subscription.clientCount} clientes`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Planes Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(PLAN_INFO).map((planInfo) => {
              const isCurrent = subscription?.plan === planInfo.plan;
              const canDowngrade =
                subscription &&
                PLAN_INFO[subscription.plan].priceAmount > planInfo.priceAmount;

              return (
                <Card
                  key={planInfo.plan}
                  className={`relative flex flex-col ${
                    planInfo.popular ? "border-primary shadow-lg" : ""
                  } ${isCurrent ? "bg-muted" : ""}`}
                >
                  {planInfo.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                      Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle>{planInfo.name}</CardTitle>
                    <CardDescription>
                      <span className="text-2xl font-bold text-foreground">
                        {planInfo.price}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-2">
                      {planInfo.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-auto">
                    {isCurrent ? (
                      <Button className="w-full" variant="default" disabled>
                        Plan Actual
                      </Button>
                    ) : planInfo.plan === SubscriptionPlan.FREE ? (
                      <Button className="w-full" variant="outline" disabled>
                        Plan Básico
                      </Button>
                    ) : canDowngrade ? (
                      <Button
                        className="w-full gap-2"
                        variant="outline"
                        disabled
                      >
                        <TrendingUp className="h-4 w-4" />
                        Actualizar Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full gap-2"
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
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ or Info */}
        <Card>
          <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">
                ¿Puedo cancelar en cualquier momento?
              </h3>
              <p className="text-sm text-muted-foreground">
                Sí, puedes cancelar tu suscripción en cualquier momento. Tu plan
                seguirá activo hasta el final del período pagado.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                ¿Qué pasa si supero el límite de clientes?
              </h3>
              <p className="text-sm text-muted-foreground">
                No podrás agregar más clientes hasta que actualices tu plan o
                elimines algunos clientes existentes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">¿Puedo cambiar de plan?</h3>
              <p className="text-sm text-muted-foreground">
                Sí, puedes actualizar tu plan en cualquier momento. Los
                downgrades requieren contactar con soporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
