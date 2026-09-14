"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  cellStatuses,
  closingModules,
  closingSteps,
  isCompetence,
  resolveStep,
  type CellStatus,
  type ClosingModule,
} from "@/lib/closing";
import { mutateDemoStore, nextDemoId, type DemoClosingCell, type DemoStore } from "@/lib/demo-store";

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

function revalidateClosingPaths(module: ClosingModule) {
  revalidatePath(module === "FISCAL" ? "/fiscal" : "/folha");
  revalidatePath("/dashboard");
}

function findRow(store: DemoStore, clientProjectId: string, module: ClosingModule, competence: string) {
  return store.closingRows.find((row) => row.clientProjectId === clientProjectId && row.module === module && row.competence === competence);
}

function upsertCell(
  store: DemoStore,
  input: { clientProjectId: string; module: ClosingModule; competence: string; stepKey: string; status: CellStatus; note: string | null; doneAt: Date | null },
  userId: string,
) {
  const now = new Date();
  const existing = store.closingCells.find(
    (cell) =>
      cell.clientProjectId === input.clientProjectId &&
      cell.module === input.module &&
      cell.competence === input.competence &&
      cell.stepKey === input.stepKey,
  );

  if (existing) {
    existing.status = input.status;
    existing.note = input.note;
    existing.doneAt = input.doneAt;
    existing.updatedById = userId;
    existing.updatedAt = now;
    return existing;
  }

  const cell: DemoClosingCell = {
    id: nextDemoId("cel"),
    clientProjectId: input.clientProjectId,
    module: input.module,
    competence: input.competence,
    stepKey: input.stepKey,
    status: input.status,
    note: input.note,
    doneAt: input.doneAt,
    updatedById: userId,
    updatedAt: now,
  };
  store.closingCells.push(cell);
  return cell;
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

  await mutateDemoStore((store) => {
    const client = store.clientProjects.find((item) => item.id === input.clientProjectId);
    if (!client) throw new Error("Empresa não encontrada.");

    const note = String(input.note ?? "").trim() || null;
    const doneAt = status === "OK" ? (readDate(input.doneAt) ?? new Date()) : readDate(input.doneAt);
    upsertCell(store, { clientProjectId: client.id, module: closingModule, competence, stepKey, status, note, doneAt }, user.id);
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

  await mutateDemoStore((store) => {
    const client = store.clientProjects.find((item) => item.id === input.clientProjectId);
    if (!client) throw new Error("Empresa não encontrada.");

    const now = new Date();
    const note = String(input.note ?? "").trim() || null;
    const noMovement = input.noMovement === undefined ? undefined : input.noMovement;
    const row = findRow(store, client.id, closingModule, competence);

    if (row) {
      row.note = note;
      if (noMovement !== undefined) row.noMovement = noMovement;
      row.updatedById = user.id;
      row.updatedAt = now;
    } else {
      store.closingRows.push({
        id: nextDemoId("row"),
        clientProjectId: client.id,
        module: closingModule,
        competence,
        noMovement: noMovement ?? null,
        note,
        updatedById: user.id,
        updatedAt: now,
      });
    }

    // Células nunca editadas não são armazenadas, então passam a refletir o novo padrão
    // ("S. Mov." ou pendente) automaticamente; as editadas à mão são preservadas.
  });

  revalidateClosingPaths(closingModule);
}

export type BulkRowInput = {
  clientProjectId: string;
  module: ClosingModule;
  competence: string;
  action: "CONCLUIR" | "REABRIR";
};

// Conclui todas as etapas pendentes da linha (ou reabre todas as concluídas).
export async function bulkClosingRow(input: BulkRowInput) {
  const user = await requireUser();
  assertCanWrite(user.role);
  const closingModule = readModule(input.module);
  const competence = readCompetence(input.competence);

  await mutateDemoStore((store) => {
    const client = store.clientProjects.find((item) => item.id === input.clientProjectId);
    if (!client) throw new Error("Empresa não encontrada.");
    const row = findRow(store, client.id, closingModule, competence);
    const now = new Date();

    closingSteps[closingModule].forEach((step) => {
      const resolution = resolveStep(client, closingModule, step.key, competence, { noMovement: row?.noMovement });
      if (!resolution.applicable) return;

      const stored = store.closingCells.find(
        (cell) => cell.clientProjectId === client.id && cell.module === closingModule && cell.competence === competence && cell.stepKey === step.key,
      );
      const currentStatus = stored?.status ?? resolution.defaultStatus;

      if (input.action === "CONCLUIR" && (currentStatus === "PENDENTE" || currentStatus === "ATENCAO")) {
        upsertCell(store, { clientProjectId: client.id, module: closingModule, competence, stepKey: step.key, status: "OK", note: stored?.note ?? null, doneAt: now }, user.id);
      }

      if (input.action === "REABRIR" && stored && stored.status !== resolution.defaultStatus) {
        store.closingCells = store.closingCells.filter((cell) => cell.id !== stored.id);
      }
    });
  });

  revalidateClosingPaths(closingModule);
}
