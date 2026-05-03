export enum SubscriptionPlan {
  FREE = "FREE",
  STARTER = "STARTER",
  PRO = "PRO",
  ELITE = "ELITE",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  CANCELED = "CANCELED",
  EXPIRED = "EXPIRED",
  PAST_DUE = "PAST_DUE",
}

export interface SubscriptionWithUsage {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  clientCount: number;
  clientLimit: number | null;
  stripeCustomerId?: string | null;
  startedAt: string;
  endsAt?: string | null;
  canceledAt?: string | null;
}

export interface PlanInfo {
  plan: SubscriptionPlan;
  name: string;
  price: string;
  priceAmount: number;
  clientLimit: number | null;
  features: string[];
  popular?: boolean;
}

export const PLAN_INFO: Record<SubscriptionPlan, PlanInfo> = {
  [SubscriptionPlan.FREE]: {
    plan: SubscriptionPlan.FREE,
    name: "Free",
    price: "Gratis",
    priceAmount: 0,
    clientLimit: 2,
    features: ["Hasta 2 clientes"],
  },
  [SubscriptionPlan.STARTER]: {
    plan: SubscriptionPlan.STARTER,
    name: "Starter",
    price: "9€/mes",
    priceAmount: 9,
    clientLimit: 5,
    features: ["Hasta 5 clientes"],
    popular: true,
  },
  [SubscriptionPlan.PRO]: {
    plan: SubscriptionPlan.PRO,
    name: "Pro",
    price: "19€/mes",
    priceAmount: 19,
    clientLimit: 20,
    features: ["Hasta 20 clientes"],
  },
  [SubscriptionPlan.ELITE]: {
    plan: SubscriptionPlan.ELITE,
    name: "Elite",
    price: "49€/mes",
    priceAmount: 49,
    clientLimit: null,
    features: ["Clientes ilimitados"],
  },
};
