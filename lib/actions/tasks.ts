"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TaskStatus } from "@prisma/client";
import { canCreateTask, canEditTask } from "@/lib/permissions";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { taskSchema } from "@/lib/validations/entities";

function parse(formData: FormData) {
  return taskSchema.parse(Object.fromEntries(formData));
}

function completedAt(status: TaskStatus) {
  return status === "CONCLUIDO" ? new Date() : null;
}

function revalidateTaskPaths(id?: string) {
  revalidatePath("/tarefas");
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/tarefas/${id}`);
}

export async function createTask(formData: FormData) {
  const user = await requireUser();
  if (!canCreateTask(user.role)) throw new Error("Sem permissão para criar tarefas.");
  const data = parse(formData);

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      dueDate: data.dueDate,
      status: data.status,
      priority: data.priority,
      internalNotes: data.internalNotes ?? null,
      completedAt: completedAt(data.status),
      organizationId: user.organizationId,
      clientProjectId: data.clientProjectId ?? null,
      departmentId: data.departmentId,
      responsibleId: data.responsibleId ?? null,
      createdById: user.id,
      histories: { create: { userId: user.id, action: "Tarefa criada", newValue: data.title } },
    },
  });

  revalidateTaskPaths(task.id);
  redirect(`/tarefas/${task.id}`);
}

export async function updateTask(id: string, formData: FormData) {
  const user = await requireUser();
  const data = parse(formData);

  const current = await prisma.task.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!current || !canEditTask(user, current)) throw new Error("Sem permissão para editar esta tarefa.");

  const changes = [
    ["Status alterado", current.status, data.status],
    ["Responsável alterado", current.responsibleId, data.responsibleId ?? null],
    ["Vencimento alterado", current.dueDate.toISOString(), data.dueDate.toISOString()],
    ["Prioridade alterada", current.priority, data.priority],
    ["Setor alterado", current.departmentId, data.departmentId],
  ].filter(([, previousValue, newValue]) => previousValue !== newValue);

  await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description ?? null,
      clientProjectId: data.clientProjectId ?? null,
      departmentId: data.departmentId,
      responsibleId: data.responsibleId ?? null,
      dueDate: data.dueDate,
      status: data.status,
      priority: data.priority,
      internalNotes: data.internalNotes ?? null,
      completedAt: completedAt(data.status),
      histories: {
        create: changes.map(([action, previousValue, newValue]) => ({
          userId: user.id,
          action: String(action),
          previousValue: previousValue ? String(previousValue) : null,
          newValue: newValue ? String(newValue) : null,
        })),
      },
    },
  });

  revalidateTaskPaths(id);
  redirect(`/tarefas/${id}`);
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const user = await requireUser();
  const task = await prisma.task.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!task || !canEditTask(user, task)) throw new Error("Sem permissão para alterar esta tarefa.");

  await prisma.task.update({
    where: { id },
    data: {
      status,
      completedAt: completedAt(status),
      histories: { create: { userId: user.id, action: "Status alterado", previousValue: task.status, newValue: status } },
    },
  });

  revalidateTaskPaths(id);
}

export async function createTaskComment(id: string, formData: FormData) {
  const user = await requireUser();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const task = await prisma.task.findFirst({ where: { id, organizationId: user.organizationId }, select: { id: true } });
  if (!task) throw new Error("Tarefa não encontrada.");

  await prisma.taskComment.create({ data: { taskId: id, authorId: user.id, text } });
  revalidateTaskPaths(id);
}
