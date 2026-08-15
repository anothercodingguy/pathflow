export type PlanId = "FREE" | "PRO" | "TEAM" | "ENTERPRISE";

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceINR: number;
  pricePaisa: number;
  displayPrice: string;
  interval: string;
  description: string;
  popular?: boolean;
  limits: {
    projects: string;
    runsPerMonth: number | "Unlimited";
    retentionDays: number;
    seats: number | "Unlimited";
    aiRootCause: boolean;
    gitDiffCorrelation: boolean;
    prioritySupport: boolean;
    dedicatedSla: boolean;
  };
  features: string[];
  ctaText: string;
  ctaAction: "free" | "upgrade" | "contact";
}

export const PLANS: Record<PlanId, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceINR: 0,
    pricePaisa: 0,
    displayPrice: "₹0",
    interval: "/ month",
    description: "For individuals trying PathFlow on personal projects.",
    limits: {
      projects: "1 Project",
      runsPerMonth: 500,
      retentionDays: 7,
      seats: 1,
      aiRootCause: false,
      gitDiffCorrelation: false,
      prioritySupport: false,
      dedicatedSla: false,
    },
    features: [
      "1 Project",
      "500 debugging runs / mo",
      "7-day trace retention",
      "Core execution traces",
      "Basic investigations"
    ],
    ctaText: "Start for free",
    ctaAction: "free"
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceINR: 1999,
    pricePaisa: 199900,
    displayPrice: "₹1,999",
    interval: "/ month",
    popular: true,
    description: "For developers running real production workloads.",
    limits: {
      projects: "Unlimited",
      runsPerMonth: 10000,
      retentionDays: 30,
      seats: 1,
      aiRootCause: true,
      gitDiffCorrelation: true,
      prioritySupport: true,
      dedicatedSla: false,
    },
    features: [
      "Unlimited projects",
      "10,000 debugging runs / mo",
      "30-day trace retention",
      "AI Root-cause diagnosis",
      "Git & commit diff correlation",
      "Priority email support"
    ],
    ctaText: "Start Pro",
    ctaAction: "upgrade"
  },
  TEAM: {
    id: "TEAM",
    name: "Team",
    priceINR: 7999,
    pricePaisa: 799900,
    displayPrice: "₹7,999",
    interval: "/ month",
    description: "For engineering teams debugging production together.",
    limits: {
      projects: "Unlimited",
      runsPerMonth: 50000,
      retentionDays: 90,
      seats: 5,
      aiRootCause: true,
      gitDiffCorrelation: true,
      prioritySupport: true,
      dedicatedSla: false,
    },
    features: [
      "Everything in Pro",
      "Shared team workspace",
      "5 included member seats",
      "90-day trace retention",
      "Team incident reviews",
      "Alert webhook integrations"
    ],
    ctaText: "Start Team",
    ctaAction: "upgrade"
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    priceINR: -1,
    pricePaisa: -1,
    displayPrice: "Custom",
    interval: "",
    description: "For larger teams requiring custom scale, retention, and SLA.",
    limits: {
      projects: "Custom",
      runsPerMonth: "Unlimited",
      retentionDays: 365,
      seats: "Unlimited",
      aiRootCause: true,
      gitDiffCorrelation: true,
      prioritySupport: true,
      dedicatedSla: true,
    },
    features: [
      "Custom debugging volume",
      "Dedicated SSO & SAML",
      "365-day custom retention",
      "VPC / on-prem deployment",
      "Dedicated Slack channel & SLA"
    ],
    ctaText: "Contact us",
    ctaAction: "contact"
  }
};

export function getPlanConfig(planId: string | null | undefined): PlanConfig {
  if (!planId) return PLANS.FREE;
  const upper = planId.toUpperCase() as PlanId;
  return PLANS[upper] || PLANS.FREE;
}
