import { getFiscalObligationLines } from "@/lib/fiscal-routines";

export const accountingTaxRegimes = ["SIMPLES_NACIONAL", "LUCRO_PRESUMIDO", "LUCRO_REAL", "MEI", "IMUNE_ISENTA"] as const;
export const accountingActivities = ["COMERCIO", "SERVICO", "COMERCIO_SERVICO"] as const;
export const accountingInvoiceModels = ["NFE", "NFCE", "NFSE_PREFEITURA", "NFSE_NACIONAL"] as const;
export const brazilianStates = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export type AccountingTaxRegime = (typeof accountingTaxRegimes)[number];
export type AccountingActivity = (typeof accountingActivities)[number];
export type AccountingInvoiceModel = (typeof accountingInvoiceModels)[number];
export type BrazilianState = (typeof brazilianStates)[number];

export const accountingTaxRegimeLabels: Record<AccountingTaxRegime, string> = {
  SIMPLES_NACIONAL: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro Presumido",
  LUCRO_REAL: "Lucro Real",
  MEI: "MEI",
  IMUNE_ISENTA: "Imune/Isenta",
};

export const accountingActivityLabels: Record<AccountingActivity, string> = {
  COMERCIO: "Com\u00e9rcio",
  SERVICO: "Servi\u00e7o",
  COMERCIO_SERVICO: "Com\u00e9rcio e servi\u00e7o",
};

export const accountingInvoiceModelLabels: Record<AccountingInvoiceModel, string> = {
  NFE: "NF-e",
  NFCE: "NFC-e",
  NFSE_PREFEITURA: "NFS-e prefeitura",
  NFSE_NACIONAL: "NFS-e nacional",
};

export type AccountingProfile = {
  accountingTaxRegime?: AccountingTaxRegime | null;
  accountingActivity?: AccountingActivity | null;
  accountingState?: string | null;
  hasRentalIrrf?: boolean | null;
  hasMonthlyMovement?: boolean | null;
  issuesInvoices?: boolean | null;
  invoiceModels?: AccountingInvoiceModel[] | null;
};

function normalize(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isAccountingSegmentName(name?: string | null) {
  return normalize(name).includes("contabilidade");
}

export function getAccountingObligations(profile: AccountingProfile) {
  return getFiscalObligationLines(profile);
}
