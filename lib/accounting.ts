export const accountingTaxRegimes = ["SIMPLES_NACIONAL", "LUCRO_PRESUMIDO", "LUCRO_REAL", "MEI", "IMUNE_ISENTA"] as const;
export const accountingActivities = ["COMERCIO", "SERVICO", "COMERCIO_SERVICO"] as const;
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
export type BrazilianState = (typeof brazilianStates)[number];

export const accountingTaxRegimeLabels: Record<AccountingTaxRegime, string> = {
  SIMPLES_NACIONAL: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro Presumido",
  LUCRO_REAL: "Lucro Real",
  MEI: "MEI",
  IMUNE_ISENTA: "Imune/Isenta",
};

// Siglas usadas na planilha do escritório (coluna REGIME).
export const accountingTaxRegimeShortLabels: Record<AccountingTaxRegime, string> = {
  SIMPLES_NACIONAL: "SN",
  LUCRO_PRESUMIDO: "LP",
  LUCRO_REAL: "LR",
  MEI: "MEI",
  IMUNE_ISENTA: "IMUNE",
};

export const accountingActivityLabels: Record<AccountingActivity, string> = {
  COMERCIO: "Comércio (ICMS)",
  SERVICO: "Serviço (ISS)",
  COMERCIO_SERVICO: "Comércio e serviço (ICMS/ISS)",
};

// Siglas usadas na planilha do escritório (coluna ATIV).
export const accountingActivityShortLabels: Record<AccountingActivity, string> = {
  COMERCIO: "ICMS",
  SERVICO: "ISS",
  COMERCIO_SERVICO: "ICMS/ISS",
};

const regimeAliases: Record<string, AccountingTaxRegime> = {
  SN: "SIMPLES_NACIONAL",
  SIMPLES: "SIMPLES_NACIONAL",
  "SIMPLES NACIONAL": "SIMPLES_NACIONAL",
  SIMPLES_NACIONAL: "SIMPLES_NACIONAL",
  LP: "LUCRO_PRESUMIDO",
  PRESUMIDO: "LUCRO_PRESUMIDO",
  "LUCRO PRESUMIDO": "LUCRO_PRESUMIDO",
  LUCRO_PRESUMIDO: "LUCRO_PRESUMIDO",
  LR: "LUCRO_REAL",
  REAL: "LUCRO_REAL",
  "LUCRO REAL": "LUCRO_REAL",
  LUCRO_REAL: "LUCRO_REAL",
  MEI: "MEI",
  IMUNE: "IMUNE_ISENTA",
  ISENTA: "IMUNE_ISENTA",
  "IMUNE/ISENTA": "IMUNE_ISENTA",
  IMUNE_ISENTA: "IMUNE_ISENTA",
};

const activityAliases: Record<string, AccountingActivity> = {
  ICMS: "COMERCIO",
  COMERCIO: "COMERCIO",
  "COMÉRCIO": "COMERCIO",
  ISS: "SERVICO",
  SERVICO: "SERVICO",
  "SERVIÇO": "SERVICO",
  "ICMS/ISS": "COMERCIO_SERVICO",
  "ISS/ICMS": "COMERCIO_SERVICO",
  "ICMS-ISS": "COMERCIO_SERVICO",
  COMERCIO_SERVICO: "COMERCIO_SERVICO",
  AMBOS: "COMERCIO_SERVICO",
};

export function parseTaxRegime(value: string | null | undefined): AccountingTaxRegime | null {
  const key = (value ?? "").trim().toUpperCase();
  return regimeAliases[key] ?? null;
}

export function parseActivity(value: string | null | undefined): AccountingActivity | null {
  const key = (value ?? "").trim().toUpperCase();
  return activityAliases[key] ?? null;
}

export function onlyDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function formatCnpj(value: string | null | undefined) {
  const digits = onlyDigits(value);
  if (digits.length !== 14) return value?.trim() || "-";
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
