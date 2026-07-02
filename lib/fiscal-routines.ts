import type { AccountingInvoiceModel, AccountingProfile } from "@/lib/accounting";

export const fiscalRoutineKeys = [
  "fiscal-documents",
  "invoice-nfe",
  "invoice-nfce",
  "invoice-nfse-prefeitura",
  "invoice-nfse-nacional",
  "xml-in-entrada",
  "xml-in-saida",
  "tax-adjust-pis-cofins",
  "tax-adjust-icms",
  "tax-calculation-review",
  "tax-guides",
  "pgdas-d",
  "defis",
  "dctfweb",
  "efd-icms-ipi",
  "efd-contribuicoes",
  "iss-nfse",
  "irrf-aluguel",
] as const;

export type FiscalRoutineKey = (typeof fiscalRoutineKeys)[number];

export type FiscalRoutineTemplate = {
  key: FiscalRoutineKey;
  name: string;
  description: string;
  recurrence: "MENSAL" | "ANUAL";
  defaultDueDay: number;
  defaultPriority: "MEDIA" | "ALTA";
  category: "operacional" | "obrigacao";
};

const fiscalTemplates: Record<FiscalRoutineKey, FiscalRoutineTemplate> = {
  "fiscal-documents": {
    key: "fiscal-documents",
    name: "Confer\u00eancia fiscal mensal",
    description: "Conferir documentos fiscais, receitas, compras, servi\u00e7os tomados e pend\u00eancias da compet\u00eancia.",
    recurrence: "MENSAL",
    defaultDueDay: 5,
    defaultPriority: "MEDIA",
    category: "operacional",
  },
  "invoice-nfe": {
    key: "invoice-nfe",
    name: "Confer\u00eancia de NF-e",
    description: "Conferir emiss\u00e3o de NF-e, cancelamentos, denega\u00e7\u00f5es e documentos pendentes.",
    recurrence: "MENSAL",
    defaultDueDay: 5,
    defaultPriority: "MEDIA",
    category: "operacional",
  },
  "invoice-nfce": {
    key: "invoice-nfce",
    name: "Confer\u00eancia de NFC-e",
    description: "Conferir NFC-e emitidas, redu\u00e7\u00f5es, cancelamentos e movimento de varejo.",
    recurrence: "MENSAL",
    defaultDueDay: 5,
    defaultPriority: "MEDIA",
    category: "operacional",
  },
  "invoice-nfse-prefeitura": {
    key: "invoice-nfse-prefeitura",
    name: "Confer\u00eancia de NFS-e prefeitura",
    description: "Conferir NFS-e emitidas no portal da prefeitura, reten\u00e7\u00f5es e ISS.",
    recurrence: "MENSAL",
    defaultDueDay: 5,
    defaultPriority: "MEDIA",
    category: "operacional",
  },
  "invoice-nfse-nacional": {
    key: "invoice-nfse-nacional",
    name: "Confer\u00eancia de NFS-e nacional",
    description: "Conferir NFS-e emitidas no emissor nacional, reten\u00e7\u00f5es e ISS.",
    recurrence: "MENSAL",
    defaultDueDay: 5,
    defaultPriority: "MEDIA",
    category: "operacional",
  },
  "xml-in-entrada": {
    key: "xml-in-entrada",
    name: "Importa\u00e7\u00e3o XML de entrada",
    description: "Importar XMLs de entrada, conferir compras, devolu\u00e7\u00f5es e documentos tomados.",
    recurrence: "MENSAL",
    defaultDueDay: 6,
    defaultPriority: "MEDIA",
    category: "operacional",
  },
  "xml-in-saida": {
    key: "xml-in-saida",
    name: "Importa\u00e7\u00e3o XML de sa\u00edda",
    description: "Importar XMLs de sa\u00edda e conferir notas emitidas na compet\u00eancia.",
    recurrence: "MENSAL",
    defaultDueDay: 6,
    defaultPriority: "MEDIA",
    category: "operacional",
  },
  "tax-adjust-pis-cofins": {
    key: "tax-adjust-pis-cofins",
    name: "Ajustes de PIS/COFINS",
    description: "Conferir bases, CSTs, cr\u00e9ditos, receitas e ajustes de PIS/COFINS.",
    recurrence: "MENSAL",
    defaultDueDay: 10,
    defaultPriority: "ALTA",
    category: "operacional",
  },
  "tax-adjust-icms": {
    key: "tax-adjust-icms",
    name: "Ajustes de ICMS",
    description: "Conferir CFOP, CST/CSOSN, cr\u00e9ditos, d\u00e9bitos, DIFAL, ST e ajustes de ICMS.",
    recurrence: "MENSAL",
    defaultDueDay: 10,
    defaultPriority: "ALTA",
    category: "operacional",
  },
  "tax-calculation-review": {
    key: "tax-calculation-review",
    name: "Apura\u00e7\u00e3o e confer\u00eancia fiscal",
    description: "Apurar tributos, revisar bases, cruzar relat\u00f3rios e conferir fechamento fiscal da compet\u00eancia.",
    recurrence: "MENSAL",
    defaultDueDay: 15,
    defaultPriority: "ALTA",
    category: "operacional",
  },
  "tax-guides": {
    key: "tax-guides",
    name: "Gera\u00e7\u00e3o de guias fiscais",
    description: "Gerar guias de impostos aplic\u00e1veis, conferir vencimentos e separar comprovantes para envio.",
    recurrence: "MENSAL",
    defaultDueDay: 20,
    defaultPriority: "ALTA",
    category: "operacional",
  },
  "pgdas-d": {
    key: "pgdas-d",
    name: "PGDAS-D e DAS do Simples Nacional",
    description: "Apurar ou transmitir o PGDAS-D mensal e emitir o DAS do Simples Nacional.",
    recurrence: "MENSAL",
    defaultDueDay: 20,
    defaultPriority: "ALTA",
    category: "obrigacao",
  },
  defis: {
    key: "defis",
    name: "DEFIS anual",
    description: "Preparar e transmitir a DEFIS anual quando aplic\u00e1vel ao Simples Nacional.",
    recurrence: "ANUAL",
    defaultDueDay: 31,
    defaultPriority: "MEDIA",
    category: "obrigacao",
  },
  dctfweb: {
    key: "dctfweb",
    name: "DCTFWeb mensal",
    description: "Transmitir DCTFWeb mensal, com movimento ou vazia, conforme o caso.",
    recurrence: "MENSAL",
    defaultDueDay: 15,
    defaultPriority: "ALTA",
    category: "obrigacao",
  },
  "efd-icms-ipi": {
    key: "efd-icms-ipi",
    name: "EFD ICMS/IPI",
    description: "Gerar, validar e transmitir a EFD ICMS/IPI quando obrigat\u00f3ria pelo regime, UF e atividade.",
    recurrence: "MENSAL",
    defaultDueDay: 20,
    defaultPriority: "ALTA",
    category: "obrigacao",
  },
  "efd-contribuicoes": {
    key: "efd-contribuicoes",
    name: "EFD Contribui\u00e7\u00f5es",
    description: "Gerar, validar e transmitir a EFD Contribui\u00e7\u00f5es para empresas fora do Simples Nacional.",
    recurrence: "MENSAL",
    defaultDueDay: 15,
    defaultPriority: "ALTA",
    category: "obrigacao",
  },
  "iss-nfse": {
    key: "iss-nfse",
    name: "ISS e NFS-e",
    description: "Conferir obriga\u00e7\u00f5es municipais de ISS e NFS-e quando houver servi\u00e7os.",
    recurrence: "MENSAL",
    defaultDueDay: 10,
    defaultPriority: "MEDIA",
    category: "obrigacao",
  },
  "irrf-aluguel": {
    key: "irrf-aluguel",
    name: "IRRF sobre aluguel",
    description: "Apurar IRRF sobre aluguel, emitir DARF e controlar o comprovante mensal.",
    recurrence: "MENSAL",
    defaultDueDay: 20,
    defaultPriority: "ALTA",
    category: "obrigacao",
  },
};

const invoiceRoutineMap: Record<AccountingInvoiceModel, FiscalRoutineKey> = {
  NFE: "invoice-nfe",
  NFCE: "invoice-nfce",
  NFSE_PREFEITURA: "invoice-nfse-prefeitura",
  NFSE_NACIONAL: "invoice-nfse-nacional",
};

function isCommerceActivity(profile: AccountingProfile) {
  return profile.accountingActivity === "COMERCIO" || profile.accountingActivity === "COMERCIO_SERVICO";
}

function isServiceActivity(profile: AccountingProfile) {
  return profile.accountingActivity === "SERVICO" || profile.accountingActivity === "COMERCIO_SERVICO";
}

function isServiceOnlyInDf(profile: AccountingProfile) {
  return profile.accountingState === "DF" && profile.accountingActivity === "SERVICO";
}

function usesStandardFiscalRegime(profile: AccountingProfile) {
  return ["SIMPLES_NACIONAL", "LUCRO_PRESUMIDO", "LUCRO_REAL"].includes(profile.accountingTaxRegime ?? "");
}

function hasMonthlyMovement(profile: AccountingProfile) {
  return profile.hasMonthlyMovement !== false;
}

export function requiresEfdIcmsIpi(profile: AccountingProfile) {
  if (!isCommerceActivity(profile)) return false;
  if (!usesStandardFiscalRegime(profile)) return false;
  if (isServiceOnlyInDf(profile)) return false;
  if (profile.accountingState === "RJ" && profile.accountingTaxRegime === "SIMPLES_NACIONAL") return false;
  return true;
}

export function requiresEfdContribuicoes(profile: AccountingProfile) {
  return profile.accountingTaxRegime === "LUCRO_PRESUMIDO" || profile.accountingTaxRegime === "LUCRO_REAL";
}

function getOperationalRoutineTemplates(profile: AccountingProfile) {
  if (!hasMonthlyMovement(profile)) return [];

  const routines: FiscalRoutineTemplate[] = [fiscalTemplates["fiscal-documents"]];

  if (profile.issuesInvoices) {
    (profile.invoiceModels ?? []).forEach((model) => {
      routines.push(fiscalTemplates[invoiceRoutineMap[model]]);
    });
  }

  if (isCommerceActivity(profile)) {
    routines.push(fiscalTemplates["xml-in-entrada"], fiscalTemplates["xml-in-saida"]);
  }

  if (requiresEfdContribuicoes(profile)) {
    routines.push(fiscalTemplates["tax-adjust-pis-cofins"]);
  }

  if (requiresEfdIcmsIpi(profile)) {
    routines.push(fiscalTemplates["tax-adjust-icms"]);
  }

  routines.push(fiscalTemplates["tax-calculation-review"], fiscalTemplates["tax-guides"]);
  return routines;
}

function getObligationRoutineTemplates(profile: AccountingProfile) {
  const routines: FiscalRoutineTemplate[] = [fiscalTemplates.dctfweb];

  if (profile.accountingTaxRegime === "SIMPLES_NACIONAL") {
    routines.push(fiscalTemplates["pgdas-d"], fiscalTemplates.defis);
  }

  if (requiresEfdIcmsIpi(profile)) {
    routines.push(fiscalTemplates["efd-icms-ipi"]);
  }

  if (requiresEfdContribuicoes(profile)) {
    routines.push(fiscalTemplates["efd-contribuicoes"]);
  }

  if (isServiceActivity(profile)) {
    routines.push(fiscalTemplates["iss-nfse"]);
  }

  if (profile.hasRentalIrrf) {
    routines.push(fiscalTemplates["irrf-aluguel"]);
  }

  return routines;
}

export function getFiscalRoutineTemplates(profile: AccountingProfile) {
  return [...getOperationalRoutineTemplates(profile), ...getObligationRoutineTemplates(profile)];
}

export function getFiscalObligationLines(profile: AccountingProfile) {
  return getFiscalRoutineTemplates(profile).map((routine) => routine.description);
}

export function fiscalRoutineSystemKey(key: FiscalRoutineKey) {
  return `fiscal:${key}`;
}
