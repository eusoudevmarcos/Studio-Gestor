"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TaskStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";
import { isAccountingSegmentName } from "@/lib/accounting";
import { currentFiscalCompetence, mutateDemoStore, nextDemoId, syncClientFiscalRoutines } from "@/lib/demo-store";

function normalizeCompetence(value: FormDataEntryValue | null) {
  const candidate = String(value ?? "").trim();
  return /^\d{4}-\d{2}$/.test(candidate) ? candidate : currentFiscalCompetence();
}

function fiscalRedirectUrl(competence: string, filters: { clientId?: string; overdue?: boolean; q?: string; sort?: string; status?: string } = {}) {
  const params = new URLSearchParams({ competence });
  if (filters.clientId) params.set("clientProjectId", filters.clientId);
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.overdue) params.set("overdue", "true");
  return `/fiscal?${params.toString()}`;
}

function readFiscalFilters(formData: FormData, clientId?: string) {
  return {
    clientId,
    overdue: formData.get("overdue") === "true",
    q: String(formData.get("q") ?? "").trim(),
    sort: String(formData.get("sort") ?? "").trim(),
    status: String(formData.get("filterStatus") ?? "").trim(),
  };
}

export async function generateFiscalCompetence(formData: FormData) {
  const user = await requireUser();
  const competence = normalizeCompetence(formData.get("competence"));
  const clientId = String(formData.get("clientId") ?? "").trim();
  const filters = readFiscalFilters(formData, clientId);

  await mutateDemoStore((store) => {
    store.clientProjects
      .filter((client) => (clientId ? client.id === clientId : true))
      .filter((client) => ["ATIVO", "EM_IMPLANTACAO"].includes(client.status))
      .filter((client) => {
        const segment = store.segments.find((item) => item.id === client.segmentId);
        return isAccountingSegmentName(segment?.name);
      })
      .forEach((client) => {
        syncClientFiscalRoutines(store, client, user.id, { competence });
      });
  });

  revalidatePath("/fiscal");
  revalidatePath("/tarefas");
  revalidatePath("/calendario");
  redirect(fiscalRedirectUrl(competence, filters));
}

export async function updateFiscalClientTasksStatus(formData: FormData) {
  const user = await requireUser();
  const competence = normalizeCompetence(formData.get("competence"));
  const clientId = String(formData.get("clientId") ?? "").trim();
  const status = String(formData.get("status") ?? "") as TaskStatus;
  const filters = readFiscalFilters(formData, clientId);

  if (!clientId) throw new Error("Cliente não informado.");
  if (!["PENDENTE", "CONCLUIDO", "CANCELADO"].includes(status)) throw new Error("Status em lote inválido.");

  await mutateDemoStore((store) => {
    const now = new Date();
    store.tasks
      .filter((task) => task.clientProjectId === clientId)
      .filter((task) => task.competence === competence)
      .filter((task) => task.systemKey?.startsWith("fiscal:"))
      .filter((task) => (status === "PENDENTE" ? task.status !== "PENDENTE" : !["CONCLUIDO", "CANCELADO"].includes(task.status)))
      .forEach((task) => {
        const previousValue = task.status;
        task.status = status;
        task.completedAt = status === "CONCLUIDO" ? now : null;
        task.updatedAt = now;
        store.histories.push({
          id: nextDemoId("hist"),
          taskId: task.id,
          userId: user.id,
          action: "Status fiscal alterado em lote",
          previousValue,
          newValue: status,
          createdAt: now,
        });
      });
  });

  revalidatePath("/fiscal");
  revalidatePath("/tarefas");
  revalidatePath("/calendario");
  redirect(fiscalRedirectUrl(competence, filters));
}

export async function updateFiscalTaskStatus(formData: FormData) {
  const user = await requireUser();
  const competence = normalizeCompetence(formData.get("competence"));
  const taskId = String(formData.get("taskId") ?? "").trim();
  const status = String(formData.get("status") ?? "") as TaskStatus;
  const filters = readFiscalFilters(formData);

  if (!taskId) throw new Error("Tarefa não informada.");
  if (!["PENDENTE", "CONCLUIDO", "CANCELADO"].includes(status)) throw new Error("Status inválido.");

  let clientId = "";
  await mutateDemoStore((store) => {
    const task = store.tasks.find((item) => item.id === taskId && item.competence === competence && item.systemKey?.startsWith("fiscal:"));
    if (!task) throw new Error("Tarefa fiscal não encontrada.");

    clientId = task.clientProjectId ?? "";
    filters.clientId = clientId;
    const previousValue = task.status;
    const now = new Date();
    task.status = status;
    task.completedAt = status === "CONCLUIDO" ? now : null;
    task.updatedAt = now;
    store.histories.push({
      id: nextDemoId("hist"),
      taskId: task.id,
      userId: user.id,
      action: "Status fiscal alterado",
      previousValue,
      newValue: status,
      createdAt: now,
    });
  });

  revalidatePath("/fiscal");
  revalidatePath("/tarefas");
  revalidatePath(`/tarefas/${taskId}`);
  redirect(fiscalRedirectUrl(competence, filters));
}
