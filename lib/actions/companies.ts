"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ClientProjectStatus, ClientProjectType } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { onlyDigits, parseActivity, parseTaxRegime, brazilianStates, type BrazilianState } from "@/lib/accounting";
import { closingModules } from "@/lib/closing";
import { accountingSegmentId, mutateDemoStore, nextDemoId, type DemoClientProject } from "@/lib/demo-store";
import { companySchema, type CompanyInput } from "@/lib/validations/entities";

function parse(formData: FormData) {
  return companySchema.parse(Object.fromEntries(formData));
}

function assertCanWrite(role: string) {
  if (role === "CONSULTA") throw new Error("Usuário de consulta não pode alterar empresas.");
}

function revalidateCompanyPaths(id?: string) {
  revalidatePath("/empresas");
  if (id) revalidatePath(`/empresas/${id}`);
  revalidatePath("/fiscal");
  revalidatePath("/folha");
  revalidatePath("/dashboard");
}

function applyInput(client: DemoClientProject, data: CompanyInput) {
  client.code = data.code ?? null;
  client.name = data.name;
  client.document = data.document ? onlyDigits(data.document) || data.document : null;
  client.stateRegistration = data.stateRegistration ?? null;
  client.districtRegistration = data.districtRegistration ?? null;
  client.status = data.status;
  client.mainResponsibleUserId = data.mainResponsibleUserId ?? null;
  client.notes = data.notes ?? null;
  client.accountingTaxRegime = data.accountingTaxRegime;
  client.accountingActivity = data.accountingActivity;
  client.accountingState = data.accountingState;
  client.hasMonthlyMovement = data.hasMonthlyMovement;
  client.issuesInvoices = data.issuesInvoices;
  client.hasRentalIrrf = data.hasRentalIrrf;
  client.employeesCount = data.employeesCount ?? null;
  client.modules = data.modules;
  client.stepOverrides = data.stepOverrides;
  client.updatedAt = new Date();
}

export async function createCompany(formData: FormData) {
  const user = await requireUser();
  assertCanWrite(user.role);
  const data = parse(formData);

  const id = await mutateDemoStore((store) => {
    const createdAt = new Date();
    const client: DemoClientProject = {
      id: nextDemoId("emp"),
      code: null,
      name: "",
      document: null,
      stateRegistration: null,
      districtRegistration: null,
      type: ClientProjectType.CLIENTE,
      status: ClientProjectStatus.ATIVO,
      notes: null,
      accountingTaxRegime: null,
      accountingActivity: null,
      accountingState: null,
      hasMonthlyMovement: true,
      issuesInvoices: false,
      hasRentalIrrf: false,
      employeesCount: null,
      modules: [...closingModules],
      stepOverrides: {},
      mainResponsibleUserId: null,
      segmentId: accountingSegmentId,
      organizationId: user.organizationId,
      createdAt,
      updatedAt: createdAt,
    };
    applyInput(client, data);
    store.clientProjects.push(client);
    return client.id;
  });

  revalidateCompanyPaths(id);
  redirect(`/empresas/${id}`);
}

export async function updateCompany(id: string, formData: FormData) {
  const user = await requireUser();
  assertCanWrite(user.role);
  const data = parse(formData);

  await mutateDemoStore((store) => {
    const client = store.clientProjects.find((item) => item.id === id && item.organizationId === user.organizationId);
    if (!client) throw new Error("Empresa não encontrada.");
    applyInput(client, data);
  });

  revalidateCompanyPaths(id);
  redirect(`/empresas/${id}`);
}

export async function deleteCompany(id: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "GESTOR") throw new Error("Somente admin ou gestor podem excluir empresas.");

  await mutateDemoStore((store) => {
    store.clientProjects = store.clientProjects.filter((item) => item.id !== id);
    store.closingRows = store.closingRows.filter((item) => item.clientProjectId !== id);
    store.closingCells = store.closingCells.filter((item) => item.clientProjectId !== id);
    store.tasks.forEach((task) => {
      if (task.clientProjectId === id) task.clientProjectId = null;
    });
  });

  revalidateCompanyPaths();
  redirect("/empresas");
}

/*
 * Importação em lote a partir do texto copiado da planilha (colunas separadas por TAB ou ";").
 * Ordem esperada: COD, EMPRESA, CNPJ, INSC. ESTADUAL, CF/DF, ATIV, UF, REGIME, FUNC, DW NF (S/N, opcional).
 * Cabeçalho é opcional. Empresas existentes (mesmo código ou mesmo nome) são atualizadas.
 */
export type ImportResult = {
  created: number;
  updated: number;
  skipped: { line: number; reason: string }[];
};

const headerWords = ["COD", "CODIGO", "CÓDIGO", "EMPRESA", "NOME"];

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();
}

function splitLine(line: string) {
  const separator = line.includes("\t") ? "\t" : ";";
  return line.split(separator).map((cell) => cell.trim());
}

function parseEmployees(value: string) {
  if (!value) return null;
  const digits = onlyDigits(value);
  return digits ? Number(digits) : null;
}

export async function importCompanies(formData: FormData): Promise<ImportResult> {
  const user = await requireUser();
  assertCanWrite(user.role);
  const raw = String(formData.get("rows") ?? "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  const result: ImportResult = { created: 0, updated: 0, skipped: [] };

  await mutateDemoStore((store) => {
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const [code = "", name = "", document = "", stateRegistration = "", districtRegistration = "", activity = "", state = "", regime = "", employees = "", dwNf = ""] =
        splitLine(line);

      if (headerWords.includes(normalizeName(code)) || headerWords.includes(normalizeName(name))) return;
      if (!name) {
        result.skipped.push({ line: lineNumber, reason: "Sem nome da empresa." });
        return;
      }

      const parsedRegime = parseTaxRegime(regime);
      const parsedActivity = parseActivity(activity);
      const parsedState = state.trim().toUpperCase();
      if (!parsedRegime) {
        result.skipped.push({ line: lineNumber, reason: `Regime não reconhecido: "${regime}".` });
        return;
      }
      if (!parsedActivity) {
        result.skipped.push({ line: lineNumber, reason: `Atividade não reconhecida: "${activity}".` });
        return;
      }
      if (!brazilianStates.includes(parsedState as BrazilianState)) {
        result.skipped.push({ line: lineNumber, reason: `UF não reconhecida: "${state}".` });
        return;
      }

      const normalizedCode = code.replace(/\D/g, "") || null;
      const existing =
        store.clientProjects.find((client) => normalizedCode && client.code === normalizedCode) ??
        store.clientProjects.find((client) => normalizeName(client.name) === normalizeName(name));
      const now = new Date();
      const client: DemoClientProject = existing ?? {
        id: nextDemoId("emp"),
        code: null,
        name: "",
        document: null,
        stateRegistration: null,
        districtRegistration: null,
        type: ClientProjectType.CLIENTE,
        status: ClientProjectStatus.ATIVO,
        notes: null,
        accountingTaxRegime: null,
        accountingActivity: null,
        accountingState: null,
        hasMonthlyMovement: true,
        issuesInvoices: false,
        hasRentalIrrf: false,
        employeesCount: null,
        modules: [...closingModules],
        stepOverrides: {},
        mainResponsibleUserId: null,
        segmentId: accountingSegmentId,
        organizationId: user.organizationId,
        createdAt: now,
        updatedAt: now,
      };

      client.code = normalizedCode ?? client.code;
      client.name = name;
      client.document = onlyDigits(document) || client.document;
      client.stateRegistration = stateRegistration || client.stateRegistration;
      client.districtRegistration = districtRegistration || client.districtRegistration;
      client.accountingTaxRegime = parsedRegime;
      client.accountingActivity = parsedActivity;
      client.accountingState = parsedState;
      const employeesCount = parseEmployees(employees);
      if (employeesCount !== null) client.employeesCount = employeesCount;
      const dwNfFlag = dwNf.trim().toUpperCase();
      if (["S", "SIM"].includes(dwNfFlag)) client.issuesInvoices = true;
      if (["N", "NAO", "NÃO"].includes(dwNfFlag)) client.issuesInvoices = false;
      client.updatedAt = now;

      if (existing) {
        result.updated += 1;
      } else {
        store.clientProjects.push(client);
        result.created += 1;
      }
    });
  });

  revalidateCompanyPaths();
  return result;
}
