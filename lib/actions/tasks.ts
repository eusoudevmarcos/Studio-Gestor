"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TaskStatus } from "@prisma/client";
import { canCreateTask, canEditTask } from "@/lib/permissions";
import { requireUser } from "@/lib/auth/session";
import { taskSchema } from "@/lib/validations/entities";
import { mutateDemoStore, nextDemoId } from "@/lib/demo-store";

function parse(formData: FormData) {
  return taskSchema.parse(Object.fromEntries(formData));
}

function completedAt(status: TaskStatus) {
  return status === "CONCLUIDO" ? new Date() : null;
}

export async function createTask(formData: FormData) {
  const user = await requireUser();
  if (!canCreateTask(user.role)) throw new Error("Sem permissão para criar tarefas.");

  const data = parse(formData);
  let taskId = "";

  await mutateDemoStore((store) => {
    const createdAt = new Date();
    taskId = nextDemoId("task");
    store.tasks.push({
      id: taskId,
      ...data,
      systemKey: null,
      competence: null,
      completedAt: completedAt(data.status),
      organizationId: user.organizationId,
      createdById: user.id,
      clientProjectId: data.clientProjectId ?? null,
      segmentId: data.segmentId ?? null,
      routineId: data.routineId ?? null,
      responsibleId: data.responsibleId ?? null,
      description: data.description ?? null,
      internalNotes: data.internalNotes ?? null,
      createdAt,
      updatedAt: createdAt,
    });

    store.histories.push({
      id: nextDemoId("hist"),
      taskId,
      userId: user.id,
      action: "Tarefa criada",
      previousValue: null,
      newValue: data.title,
      createdAt,
    });
  });

  revalidatePath("/tarefas");
  redirect(`/tarefas/${taskId}`);
}

export async function updateTask(id: string, formData: FormData) {
  const user = await requireUser();
  const data = parse(formData);

  await mutateDemoStore((store) => {
    const current = store.tasks.find((task) => task.id === id && task.organizationId === user.organizationId);
    if (!current || !canEditTask(user, current)) {
      throw new Error("Sem permissão para editar esta tarefa.");
    }

    const changes = [
      ["Status alterado", current.status, data.status],
      ["Responsável alterado", current.responsibleId, data.responsibleId ?? null],
      ["Vencimento alterado", current.dueDate.toISOString(), data.dueDate.toISOString()],
      ["Prioridade alterada", current.priority, data.priority],
      ["Setor alterado", current.departmentId, data.departmentId],
    ].filter(([, previousValue, newValue]) => previousValue !== newValue);

    current.title = data.title;
    current.description = data.description ?? null;
    current.clientProjectId = data.clientProjectId ?? null;
    current.segmentId = data.segmentId ?? null;
    current.departmentId = data.departmentId;
    current.routineId = data.routineId ?? null;
    current.responsibleId = data.responsibleId ?? null;
    current.dueDate = data.dueDate;
    current.status = data.status;
    current.priority = data.priority;
    current.internalNotes = data.internalNotes ?? null;
    current.completedAt = completedAt(data.status);
    current.updatedAt = new Date();

    changes.forEach(([action, previousValue, newValue]) => {
      store.histories.push({
        id: nextDemoId("hist"),
        taskId: current.id,
        userId: user.id,
        action: String(action),
        previousValue: previousValue ? String(previousValue) : null,
        newValue: newValue ? String(newValue) : null,
        createdAt: new Date(),
      });
    });
  });

  revalidatePath("/tarefas");
  redirect(`/tarefas/${id}`);
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const user = await requireUser();

  await mutateDemoStore((store) => {
    const task = store.tasks.find((item) => item.id === id && item.organizationId === user.organizationId);
    if (!task || !canEditTask(user, task)) {
      throw new Error("Sem permissão para alterar esta tarefa.");
    }
    const previousValue = task.status;
    task.status = status;
    task.completedAt = completedAt(status);
    task.updatedAt = new Date();
    store.histories.push({
      id: nextDemoId("hist"),
      taskId: id,
      userId: user.id,
      action: "Status alterado",
      previousValue,
      newValue: status,
      createdAt: new Date(),
    });
  });

  revalidatePath("/tarefas");
}

export async function createTaskComment(id: string, formData: FormData) {
  const user = await requireUser();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  await mutateDemoStore((store) => {
    const task = store.tasks.find((item) => item.id === id && item.organizationId === user.organizationId);
    if (!task) throw new Error("Tarefa não encontrada.");
    store.comments.push({
      id: nextDemoId("comment"),
      taskId: id,
      authorId: user.id,
      text,
      createdAt: new Date(),
    });
  });

  revalidatePath(`/tarefas/${id}`);
}
