"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { onlyDigits, parseActivity, parseTaxRegime, brazilianStates, type BrazilianState } from "@/lib/accounting";
import { prisma } from "@/lib/prisma/client";
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

function toData(data: CompanyInput): Prisma.ClientProjectUncheckedUpdateInput {
  return {
    code: data.code ?? null,
    name: data.name,
    document: data.document ? onlyDigits(data.document) || data.document : null,
    stateRegistration: data.stateRegistration ?? null,
    districtRegistration: data.districtRegistration ?? null,
    status: data.status,
    mainResponsibleUserId: data.mainResponsibleUserId ?? null,
    notes: data.notes ?? null,
    accountingTaxRegime: data.accountingTaxRegime,
    accountingActivity: data.accountingActivity,
    accountingState: data.accountingState,
    hasMonthlyMovement: data.hasMonthlyMovement,
    issuesInvoices: data.issuesInvoices,
    hasRentalIrrf: data.hasRentalIrrf,
    employeesCount: data.employeesCount ?? null,
    modules: data.modules,
    stepOverrides: data.stepOverrides,
  };
}

export async function createCompany(formData: FormData) {
  const user = await requireUser();
  assertCanWrite(user.role);
  const data = parse(formData);

  const client = await prisma.clientProject.create({
    data: { ...(toData(data) as Prisma.ClientProjectUncheckedCreateInput), name: data.name, organizationId: user.organizationId },
  });

  revalidateCompanyPaths(client.id);
  redirect(`/empresas/${client.id}`);
}

export async function updateCompany(id: string, formData: FormData) {
  const user = await requireUser();
  assertCanWrite(user.role);
  const data = parse(formData);

  const { count } = await prisma.clientProject.updateMany({ where: { id, organizationId: user.organizationId }, data: toData(data) });
  if (!count) throw new Error("Empresa não encontrada.");

  revalidateCompanyPaths(id);
  redirect(`/empresas/${id}`);
}

export async function deleteCompany(id: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "GESTOR") throw new Error("Somente admin ou gestor podem excluir empresas.");

  // Fechamento é apagado em cascata; tarefas avulsas ficam sem vínculo.
  await prisma.clientProject.deleteMany({ where: { id, organizationId: user.organizationId } });

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

const headerWords = ["COD", "CODIGO", "EMPRESA", "NOME"];

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

function parseDwNf(value: string): boolean | null {
  const flag = value.trim().toUpperCase();
  if (["S", "SIM"].includes(flag)) return true;
  if (["N", "NAO", "NÃO"].includes(flag)) return false;
  return null;
}

export async function importCompanies(formData: FormData): Promise<ImportResult> {
  const user = await requireUser();
  assertCanWrite(user.role);
  const raw = String(formData.get("rows") ?? "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  const result: ImportResult = { created: 0, updated: 0, skipped: [] };

  const existingCompanies = await prisma.clientProject.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, code: true, name: true },
  });

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    const [code = "", name = "", document = "", stateRegistration = "", districtRegistration = "", activity = "", state = "", regime = "", employees = "", dwNf = ""] =
      splitLine(line);

    if (headerWords.includes(normalizeName(code)) || headerWords.includes(normalizeName(name))) continue;
    if (!name) {
      result.skipped.push({ line: lineNumber, reason: "Sem nome da empresa." });
      continue;
    }

    const parsedRegime = parseTaxRegime(regime);
    const parsedActivity = parseActivity(activity);
    const parsedState = state.trim().toUpperCase();
    if (!parsedRegime) {
      result.skipped.push({ line: lineNumber, reason: `Regime não reconhecido: "${regime}".` });
      continue;
    }
    if (!parsedActivity) {
      result.skipped.push({ line: lineNumber, reason: `Atividade não reconhecida: "${activity}".` });
      continue;
    }
    if (!brazilianStates.includes(parsedState as BrazilianState)) {
      result.skipped.push({ line: lineNumber, reason: `UF não reconhecida: "${state}".` });
      continue;
    }

    const normalizedCode = code.replace(/\D/g, "") || null;
    const existing =
      existingCompanies.find((client) => normalizedCode && client.code === normalizedCode) ??
      existingCompanies.find((client) => normalizeName(client.name) === normalizeName(name));
    const employeesCount = parseEmployees(employees);
    const issuesInvoices = parseDwNf(dwNf);

    const shared = {
      name,
      accountingTaxRegime: parsedRegime,
      accountingActivity: parsedActivity,
      accountingState: parsedState,
      ...(normalizedCode ? { code: normalizedCode } : {}),
      ...(onlyDigits(document) ? { document: onlyDigits(document) } : {}),
      ...(stateRegistration ? { stateRegistration } : {}),
      ...(districtRegistration ? { districtRegistration } : {}),
      ...(employeesCount !== null ? { employeesCount } : {}),
      ...(issuesInvoices !== null ? { issuesInvoices } : {}),
    };

    if (existing) {
      await prisma.clientProject.update({ where: { id: existing.id }, data: shared });
      result.updated += 1;
    } else {
      const created = await prisma.clientProject.create({ data: { ...shared, organizationId: user.organizationId } });
      existingCompanies.push({ id: created.id, code: created.code, name: created.name });
      result.created += 1;
    }
  }

  revalidateCompanyPaths();
  return result;
}
