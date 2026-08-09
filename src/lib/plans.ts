export type Plan = "starter" | "growth" | "premium";

export const PLAN_LIMITS: Record<Plan, number> = {
  starter: 1,
  growth: 3,
  premium: 8,
};

export const PLAN_ADMIN_LIMITS: Record<Plan, number> = {
  starter: 1,
  growth: 3,
  premium: 8,
};

export const PLAN_CONTACT_LIMITS: Record<Plan, number> = {
  starter: 1000,
  growth: 10000,
  premium: 50000,
};

export const PLAN_PRICES: Record<Plan, number> = {
  starter: 99,
  growth: 299,
  premium: 499,
};

export const PLAN_LABEL: Record<Plan, string> = {
  starter: "Starter",
  growth: "Growth",
  premium: "Premium",
};

export const NEXT_PLAN: Record<Plan, Plan | null> = {
  starter: "growth",
  growth: "premium",
  premium: null,
};

export const PLAN_ORDER: Record<Plan, number> = {
  starter: 0,
  growth: 1,
  premium: 2,
};
