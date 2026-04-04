"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, TrendingUp, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "../lib/supabase/browser";
import { SubscriptionWithUsage } from "../lib/types/subscription";

export function SubscriptionLimitBanner() {
  const [subscription, setSubscription] =
    useState<SubscriptionWithUsage | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    const fetchSubscription = async () => {
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
      }
    };
    fetchSubscription();
  }, []);

  if (!subscription || dismissed || !subscription.clientLimit) {
    return null;
  }

  const usagePercentage =
    (subscription.clientCount / subscription.clientLimit) * 100;

  if (usagePercentage < 80) {
    return null;
  }

  const isAtLimit = usagePercentage >= 100;
  const remaining = subscription.clientLimit - subscription.clientCount;

  return (
    <Alert
      className={`relative ${
        isAtLimit
          ? "border-red-600 bg-red-50 dark:bg-red-950/20"
          : "border-orange-600 bg-orange-50 dark:bg-orange-950/20"
      }`}
    >
      <AlertTriangle
        className={`h-4 w-4 ${isAtLimit ? "text-red-600" : "text-orange-600"}`}
      />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p
            className={`font-semibold ${isAtLimit ? "text-red-900 dark:text-red-100" : "text-orange-900 dark:text-orange-100"}`}
          >
            {isAtLimit
              ? "Has alcanzado el límite de clientes"
              : `Te quedan ${remaining} cliente${remaining === 1 ? "" : "s"}`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isAtLimit
              ? `Tu plan ${subscription.plan} permite hasta ${subscription.clientLimit} clientes. Actualiza tu plan para agregar más.`
              : `Estás usando ${subscription.clientCount} de ${subscription.clientLimit} clientes disponibles.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="default">
            <Link href="/trainer/billing" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Actualizar Plan
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
