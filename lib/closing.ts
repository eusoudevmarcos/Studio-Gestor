import type { AccountingActivity, AccountingTaxRegime } from "@/lib/accounting";

/*
 * Fechamento por competência.
 *
 * Reproduz as planilhas do escritório: cada módulo (Fiscal, Folha) tem colunas fixas
 * (etapas) e cada empresa é uma linha. A aplicabilidade de cada etapa é derivada do
 * perfil da empresa (regime, atividade, UF, inscrição, funcionários...) e pode ser
 * forçada por empresa via `stepOverrides`.
 */

export const closingModules = ["FISCAL", "FOLHA"] as const;
export type ClosingModule = (typeof closingModules)[number];

export const closingModuleLabels: Record<ClosingModule, string> = {
  FISCAL: "Fiscal",
  FOLHA: "Folha",
};

export const cellStatuses = ["NAO_APLICA", "PENDENTE", "OK", "SEM_MOVIMENTO", "NAO_DEVIDO", "ATENCAO"] as const;
export type CellStatus = (typeof cellStatuses)[number];

export const cellStatusLabels: Record<CellStatus, string> = {
  NAO_APLICA: "Não se aplica",
  PENDENTE: "Pendente",
  OK: "Concluído",
  SEM_MOVIMENTO: "Sem movimento",
  NAO_DEVIDO: "Não devido no mês",
  ATENCAO: "Atenção",
};

// Texto curto exibido dentro da célula (igual à planilha).
export const cellStatusShortLabels: Record<CellStatus, string> = {
  NAO_APLICA: "",
  PENDENTE: "",
  OK: "ok",
  SEM_MOVIMENTO: "S. Mov.",
  NAO_DEVIDO: "Não",
  ATENCAO: "!",
};

export const stepOverrideValues = ["APLICA", "NAO_APLICA"] as const;
export type StepOverride = (typeof stepOverrideValues)[number];

export type ClosingStep = {
  key: string;
  label: string;
  group: string;
  description: string;
  dueDay?: number;
};

export const closingSteps: Record<ClosingModule, ClosingStep[]> = {
  FISCAL: [
    { key: "dw_nf", label: "DW NF", group: "Apuração", description: "Download das notas fiscais emitidas e recebidas na competência." },
    { key: "import", label: "IMPORT", group: "Apuração", description: "Importação dos XML / NFS-e no sistema fiscal." },
    { key: "ajuste", label: "AJUSTE", group: "Apuração", description: "Ajustes de CFOP, CST/CSOSN, PIS/COFINS e ICMS." },
    { key: "apurar", label: "APURAR", group: "Apuração", description: "Apuração dos tributos da competência." },
    { key: "das", label: "DAS", group: "Apuração", description: "PGDAS-D transmitido e DAS emitido (Simples Nacional / MEI).", dueDay: 20 },
    { key: "pis", label: "PIS", group: "Obrigações", description: "Guia de PIS apurada e emitida.", dueDay: 25 },
    { key: "cofins", label: "COFINS", group: "Obrigações", description: "Guia de COFINS apurada e emitida.", dueDay: 25 },
    { key: "irpj", label: "IRPJ", group: "Obrigações", description: "IRPJ trimestral (competências 03, 06, 09 e 12).", dueDay: 30 },
    { key: "csll", label: "CSLL", group: "Obrigações", description: "CSLL trimestral (competências 03, 06, 09 e 12).", dueDay: 30 },
    { key: "sped_icms", label: "SPED ICMS", group: "Obrigações", description: "EFD ICMS/IPI (ou LFE no DF) transmitida.", dueDay: 20 },
    { key: "efd_cont", label: "EFD CONT", group: "Obrigações", description: "EFD Contribuições transmitida.", dueDay: 15 },
    { key: "reinf", label: "REINF", group: "Obrigações", description: "EFD-Reinf transmitida (retenções, IRRF sobre aluguel).", dueDay: 15 },
    { key: "mit", label: "MIT", group: "Obrigações", description: "Módulo de Inclusão de Tributos preenchido.", dueDay: 25 },
    { key: "dctfweb", label: "DCTFWEB", group: "Obrigações", description: "DCTFWeb transmitida.", dueDay: 25 },
  ],
  FOLHA: [
    { key: "eventos", label: "EVENTOS", group: "Fechamento folha", description: "Eventos do mês recebidos e lançados (faltas, horas, férias, admissões, rescisões)." },
    { key: "calculo", label: "CALCULO", group: "Fechamento folha", description: "Folha calculada." },
    { key: "confer", label: "CONFER", group: "Fechamento folha", description: "Folha conferida." },
    { key: "recibos", label: "RECIBOS", group: "Fechamento folha", description: "Recibos / holerites gerados." },
    { key: "extratos", label: "EXTRATOS", group: "Fechamento folha", description: "Extratos e relatórios da folha gerados." },
    { key: "esocial", label: "ESOCIAL", group: "Fechamento folha", description: "Eventos periódicos do eSocial enviados.", dueDay: 15 },
    { key: "gfd", label: "GFD", group: "Fechamento folha", description: "Guia do FGTS Digital emitida.", dueDay: 20 },
    { key: "inss", label: "INSS", group: "Fechamento folha", description: "DARF de INSS (DCTFWeb) emitida.", dueDay: 20 },
    { key: "envio", label: "ENVIO", group: "Fechamento folha", description: "Guias, recibos e relatórios enviados ao cliente." },
  ],
};

export function getClosingStep(module: ClosingModule, stepKey: string) {
  return closingSteps[module].find((step) => step.key === stepKey) ?? null;
}

export type CompanyProfile = {
  accountingTaxRegime: AccountingTaxRegime | null;
  accountingActivity: AccountingActivity | null;
  accountingState: string | null;
  stateRegistration: string | null;
  districtRegistration: string | null;
  hasMonthlyMovement: boolean | null;
  issuesInvoices: boolean;
  hasRentalIrrf: boolean;
  employeesCount: number | null;
  modules: ClosingModule[];
  stepOverrides: Record<string, StepOverride>;
};

export type StepResolution = {
  applicable: boolean;
  defaultStatus: CellStatus;
  // Marcador curto exibido na célula enquanto pendente (ex.: "IRRF").
  flag?: string;
  reason: string;
};

export function overrideKey(module: ClosingModule, stepKey: string) {
  return `${module}:${stepKey}`;
}

// Competência no formato YYYY-MM.
export function isCompetence(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

export function competenceMonth(competence: string) {
  return Number(competence.slice(5, 7));
}

export function competenceLabel(competence: string) {
  if (!isCompetence(competence)) return competence;
  return `${competence.slice(5, 7)}/${competence.slice(0, 4)}`;
}

export function shiftCompetence(competence: string, months: number) {
  const year = Number(competence.slice(0, 4));
  const month = Number(competence.slice(5, 7)) - 1 + months;
  const date = new Date(year, month, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// A competência "em fechamento" é sempre o mês anterior ao atual.
export function defaultCompetence(date = new Date()) {
  const current = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return shiftCompetence(current, -1);
}

function isQuarterEnd(competence: string) {
  return [3, 6, 9, 12].includes(competenceMonth(competence));
}

const notApplicable = (reason: string): StepResolution => ({ applicable: false, defaultStatus: "NAO_APLICA", reason });

function resolveFiscalStep(profile: CompanyProfile, stepKey: string, competence: string, hasMovement: boolean): StepResolution {
  const regime = profile.accountingTaxRegime;
  const isSimples = regime === "SIMPLES_NACIONAL";
  const isMei = regime === "MEI";
  const isLucro = regime === "LUCRO_PRESUMIDO" || regime === "LUCRO_REAL";
  const isImune = regime === "IMUNE_ISENTA";
  const isCommerce = profile.accountingActivity === "COMERCIO" || profile.accountingActivity === "COMERCIO_SERVICO";
  const isDf = profile.accountingState === "DF";
  const hasStateRegistration = Boolean(profile.stateRegistration?.trim() || profile.districtRegistration?.trim());
  const movementStatus: CellStatus = hasMovement ? "PENDENTE" : "SEM_MOVIMENTO";

  if (!regime) return notApplicable("Regime tributário não informado.");

  switch (stepKey) {
    case "dw_nf":
      return profile.issuesInvoices
        ? { applicable: true, defaultStatus: "PENDENTE", reason: "Empresa emite nota." }
        : notApplicable("Empresa não emite nota.");
    case "import":
      if (!profile.issuesInvoices) return notApplicable("Empresa não emite nota.");
      if (!isCommerce && !isDf) return notApplicable("Serviço fora do DF não importa XML.");
      return { applicable: true, defaultStatus: movementStatus, reason: "Emite nota com ICMS ou no DF." };
    case "ajuste":
    case "apurar":
      if (isMei) return notApplicable("MEI não apura.");
      return { applicable: true, defaultStatus: movementStatus, reason: "Apuração mensal." };
    case "das":
      return isSimples || isMei
        ? { applicable: true, defaultStatus: movementStatus, reason: "Simples Nacional / MEI." }
        : notApplicable("Somente Simples Nacional / MEI.");
    case "pis":
    case "cofins":
      return isLucro
        ? { applicable: true, defaultStatus: movementStatus, reason: "Lucro Presumido / Real." }
        : notApplicable("Somente Lucro Presumido / Real.");
    case "irpj":
    case "csll":
      if (!isLucro) return notApplicable("Somente Lucro Presumido / Real.");
      return isQuarterEnd(competence)
        ? { applicable: true, defaultStatus: movementStatus, reason: "Fechamento de trimestre." }
        : { applicable: true, defaultStatus: "NAO_DEVIDO", reason: "Apuração trimestral: não vence nesta competência." };
    case "sped_icms":
      if (!isLucro && !isImune) return notApplicable("Simples Nacional / MEI dispensados.");
      if (!hasStateRegistration) return notApplicable("Sem inscrição estadual / CF-DF.");
      return { applicable: true, defaultStatus: movementStatus, reason: "Inscrição estadual ativa fora do Simples." };
    case "efd_cont":
      return isLucro || isImune
        ? { applicable: true, defaultStatus: movementStatus, reason: "Fora do Simples Nacional." }
        : notApplicable("Simples Nacional / MEI dispensados.");
    case "reinf":
      if (profile.hasRentalIrrf) return { applicable: true, defaultStatus: "PENDENTE", flag: "IRRF", reason: "Tem IRRF de aluguel." };
      if (isLucro || isImune) return { applicable: true, defaultStatus: "NAO_DEVIDO", reason: "Sem retenções cadastradas." };
      return notApplicable("Simples Nacional / MEI sem retenções.");
    case "mit":
      return isLucro
        ? { applicable: true, defaultStatus: movementStatus, reason: "Lucro Presumido / Real." }
        : notApplicable("Somente Lucro Presumido / Real.");
    case "dctfweb":
      return isLucro || isImune
        ? { applicable: true, defaultStatus: movementStatus, reason: "Fora do Simples Nacional." }
        : notApplicable("Tratado na folha (INSS).");
    default:
      return notApplicable("Etapa desconhecida.");
  }
}

function resolvePayrollStep(profile: CompanyProfile, stepKey: string): StepResolution {
  const hasEmployees = profile.employeesCount === null || profile.employeesCount > 0;

  if (stepKey === "esocial") {
    return { applicable: true, defaultStatus: "PENDENTE", reason: "eSocial obrigatório mesmo sem funcionários." };
  }

  return hasEmployees
    ? { applicable: true, defaultStatus: "PENDENTE", reason: "Empresa com funcionários." }
    : notApplicable("Empresa sem funcionários.");
}

export function resolveStep(
  profile: CompanyProfile,
  module: ClosingModule,
  stepKey: string,
  competence: string,
  options: { noMovement?: boolean | null } = {},
): StepResolution {
  if (!profile.modules.includes(module)) return notApplicable(`Módulo ${closingModuleLabels[module]} desativado para a empresa.`);

  const override = profile.stepOverrides[overrideKey(module, stepKey)];
  if (override === "NAO_APLICA") return notApplicable("Marcado manualmente como não aplicável.");

  const hasMovement = options.noMovement != null ? !options.noMovement : profile.hasMonthlyMovement !== false;

  if (override === "APLICA") {
    return { applicable: true, defaultStatus: hasMovement ? "PENDENTE" : "SEM_MOVIMENTO", reason: "Marcado manualmente como aplicável." };
  }

  return module === "FISCAL" ? resolveFiscalStep(profile, stepKey, competence, hasMovement) : resolvePayrollStep(profile, stepKey);
}

export function resolveModuleSteps(profile: CompanyProfile, module: ClosingModule, competence: string, options: { noMovement?: boolean | null } = {}) {
  return closingSteps[module].map((step) => ({ step, resolution: resolveStep(profile, module, step.key, competence, options) }));
}

export type ClosingCellView = {
  stepKey: string;
  status: CellStatus;
  applicable: boolean;
  isDefault: boolean;
  note: string | null;
  doneAt: Date | null;
  flag?: string;
  reason: string;
  updatedByName: string | null;
  updatedAt: Date | null;
};

export function isDoneStatus(status: CellStatus) {
  return status === "OK" || status === "SEM_MOVIMENTO" || status === "NAO_DEVIDO";
}

export function isOpenStatus(status: CellStatus) {
  return status === "PENDENTE" || status === "ATENCAO";
}
