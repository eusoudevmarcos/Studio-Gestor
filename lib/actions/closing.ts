"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { toProfile } from "@/lib/closing-profile";
import {
  cellStatuses,
  closingModules,
  closingSteps,
  isCompetence,
  resolveStep,
  type CellStatus,
  type ClosingModule,
} from "@/lib/closing";
import { prisma } from "@/lib/prisma/client";

function assertCanWrite(role: string) {
  if (role === "CONSULTA") throw new Error("Usuário de consulta não pode alterar o fechamento.");
}

function readModule(value: unknown): ClosingModule {
  const parsed = String(value ?? "") as ClosingModule;
  if (!closingModules.includes(parsed)) throw new Error("Módulo inválido.");
  return parsed;
}

function readCompetence(value: unknown) {
  const competence = String(value ?? "");
  if (!isCompetence(competence)) throw new Error("Competência inválida.");
  return competence;
}

function readStatus(value: unknown): CellStatus {
  const status = String(value ?? "") as CellStatus;
  if (!cellStatuses.includes(status)) throw new Error("Status inválido.");
  return status;
}

function readDate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(`${raw}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function revalidateClosingPaths(closingModule: ClosingModule) {
  revalidatePath(closingModule === "FISCAL" ? "/fiscal" : "/folha");
  revalidatePath("/dashboard");
}

async function findCompany(id: string, organizationId: string) {
  const client = await prisma.clientProject.findFirst({ where: { id, organizationId } });
  if (!client) throw new Error("Empresa não encontrada.");
  return client;
}

export type SaveCellInput = {
  clientProjectId: string;
  module: ClosingModule;
  competence: string;
  stepKey: string;
  status: CellStatus;
  note?: string | null;
  doneAt?: string | null;
};

export async function saveClosingCell(input: SaveCellInput) {
  const user = await requireUser();
  assertCanWrite(user.role);
  const closingModule = readModule(input.module);
  const competence = readCompetence(input.competence);
  const status = readStatus(input.status);
  const stepKey = String(input.stepKey ?? "");
  if (!closingSteps[closingModule].some((step) => step.key === stepKey)) throw new Error("Etapa inválida.");

  const client = await findCompany(input.clientProjectId, user.organizationId);
  const note = String(input.note ?? "").trim() || null;
  const doneAt = status === "OK" ? (readDate(input.doneAt) ?? new Date()) : readDate(input.doneAt);

  await prisma.closingCell.upsert({
    where: { clientProjectId_module_competence_stepKey: { clientProjectId: client.id, module: closingModule, competence, stepKey } },
    update: { status, note, doneAt, updatedById: user.id },
    create: { organizationId: user.organizationId, clientProjectId: client.id, module: closingModule, competence, stepKey, status, note, doneAt, updatedById: user.id },
  });

  revalidateClosingPaths(closingModule);
}

export type SaveRowInput = {
  clientProjectId: string;
  module: ClosingModule;
  competence: string;
  noMovement?: boolean | null;
  note?: string | null;
};

export async function saveClosingRow(input: SaveRowInput) {
  const user = await requireUser();
  assertCanWrite(user.role);
  const closingModule = readModule(input.module);
  const competence = readCompetence(input.competence);
  const client = await findCompany(input.clientProjectId, user.organizationId);
  const note = String(input.note ?? "").trim() || null;

  // Células nunca editadas não são armazenadas, então passam a refletir o novo padrão
  // ("S. Mov." ou pendente) automaticamente; as editadas à mão são preservadas.
  await prisma.closingRow.upsert({
    where: { clientProjectId_module_competence: { clientProjectId: client.id, module: closingModule, competence } },
    update: { note, ...(input.noMovement === undefined ? {} : { noMovement: input.noMovement }), updatedById: user.id },
    create: {
      organizationId: user.organizationId,
      clientProjectId: client.id,
      module: closingModule,
      competence,
      noMovement: input.noMovement ?? null,
      note,
      updatedById: user.id,
    },
  });

  revalidateClosingPaths(closingModule);
}

export type BulkRowInput = {
  clientProjectId: string;
  module: ClosingModule;
  competence: string;
  action: "CONCLUIR" | "REABRIR";
};

// Conclui todas as etapas pendentes da linha (ou volta todas ao padrão do perfil).
export async function bulkClosingRow(input: BulkRowInput) {
  const user = await requireUser();
  assertCanWrite(user.role);
  const closingModule = readModule(input.module);
  const competence = readCompetence(input.competence);
  const client = await findCompany(input.clientProjectId, user.organizationId);
  const profile = toProfile(client);

  const [row, storedCells] = await Promise.all([
    prisma.closingRow.findUnique({ where: { clientProjectId_module_competence: { clientProjectId: client.id, module: closingModule, competence } } }),
    prisma.closingCell.findMany({ where: { clientProjectId: client.id, module: closingModule, competence } }),
  ]);
  const now = new Date();

  for (const step of closingSteps[closingModule]) {
    const resolution = resolveStep(profile, closingModule, step.key, competence, { noMovement: row?.noMovement });
    if (!resolution.applicable) continue;

    const stored = storedCells.find((cell) => cell.stepKey === step.key);
    const currentStatus = stored?.status ?? resolution.defaultStatus;

    if (input.action === "CONCLUIR" && (currentStatus === "PENDENTE" || currentStatus === "ATENCAO")) {
      await prisma.closingCell.upsert({
        where: { clientProjectId_module_competence_stepKey: { clientProjectId: client.id, module: closingModule, competence, stepKey: step.key } },
        update: { status: "OK", doneAt: now, updatedById: user.id },
        create: {
          organizationId: user.organizationId,
          clientProjectId: client.id,
          module: closingModule,
          competence,
          stepKey: step.key,
          status: "OK",
          note: null,
          doneAt: now,
          updatedById: user.id,
        },
      });
    }

    if (input.action === "REABRIR" && stored) {
      await prisma.closingCell.delete({ where: { id: stored.id } });
    }
  }

  revalidateClosingPaths(closingModule);
}
