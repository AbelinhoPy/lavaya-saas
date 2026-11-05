export type PlanType = 'monthly' | 'semiannual' | 'annual';

export interface PlanConfig {
  id: PlanType;
  name: string;
  badge?: string;
  billingPeriodLabel: string;
  totalCharge: number; // in USD
  totalCents: string;
  monthlyEquivalent: number; // in USD
  savingsAmount: number; // in USD
  savingsPercent: number;
  savingsLabel: string;
  cycleInterval: 'month' | 'year';
  cycleFrequency: number;
  trialDays: 7;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  monthly: {
    id: 'monthly',
    name: 'Plan Mensual',
    billingPeriodLabel: 'US$20 cada mes',
    totalCharge: 20,
    totalCents: '2000',
    monthlyEquivalent: 20,
    savingsAmount: 0,
    savingsPercent: 0,
    savingsLabel: 'Cobro mes a mes',
    cycleInterval: 'month',
    cycleFrequency: 1,
    trialDays: 7,
  },
  semiannual: {
    id: 'semiannual',
    name: 'Plan Semestral',
    badge: 'Ahorro moderado (10%)',
    billingPeriodLabel: 'US$108 cada 6 meses',
    totalCharge: 108,
    totalCents: '10800',
    monthlyEquivalent: 18,
    savingsAmount: 12,
    savingsPercent: 10,
    savingsLabel: 'Ahorro de US$12 por semestre frente al mensual (equivalente a US$18/mes)',
    cycleInterval: 'month',
    cycleFrequency: 6,
    trialDays: 7,
  },
  annual: {
    id: 'annual',
    name: 'Plan Anual',
    badge: 'Mayor ahorro (20%)',
    billingPeriodLabel: 'US$192 cada 12 meses',
    totalCharge: 192,
    totalCents: '19200',
    monthlyEquivalent: 16,
    savingsAmount: 48,
    savingsPercent: 20,
    savingsLabel: 'Ahorro de US$48 por año frente al mensual (equivalente a US$16/mes)',
    cycleInterval: 'year',
    cycleFrequency: 1,
    trialDays: 7,
  },
};
