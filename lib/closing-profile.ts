import type { ClientProject } from "@prisma/client";
import { closingModules, stepOverrideValues, type ClosingModule, type CompanyProfile, type StepOverride } from "@/lib/closing";

// Converte o registro do banco (Json/enum do Prisma) no perfil usado pelas regras de aplicabilidade.
export function toStepOverrides(value: unknown): Record<string, StepOverride> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, StepOverride] =>
      stepOverrideValues.includes(entry[1] as StepOverride),
    ),
  );
}

export function toProfile(client: ClientProject): CompanyProfile {
  return {
    accountingTaxRegime: client.accountingTaxRegime,
    accountingActivity: client.accountingActivity,
    accountingState: client.accountingState,
    stateRegistration: client.stateRegistration,
    districtRegistration: client.districtRegistration,
    hasMonthlyMovement: client.hasMonthlyMovement,
    issuesInvoices: client.issuesInvoices,
    hasRentalIrrf: client.hasRentalIrrf,
    employeesCount: client.employeesCount,
    modules: client.modules.filter((module): module is ClosingModule => closingModules.includes(module)),
    stepOverrides: toStepOverrides(client.stepOverrides),
  };
}
