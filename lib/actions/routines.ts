"use server";

import { addDays, setDate, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageRoutines } from "@/lib/permissions";
import { requireUser } from "@/lib/auth/session";
import { routineSchema } from "@/lib/validations/entities";
import { mutateDemoStore, nextDemoId } from "@/lib/demo-store";

function parse(formData: FormData) {
  return routineSchema.parse(Object.fromEntries(formData));
}

async function assertCanManage() {
  const user = await requireUser();
  if (!canManageRoutines(user.role)) throw new Error("Sem permissão para gerenciar rotinas.");
  return user;
}

export async function createRoutine(formData: FormData) {
  const user = await assertCanManage();
  const data = parse(formData);

  await mutateDemoStore((store) => {
    const createdAt = new Date();
    store.routines.push({
      id: nextDemoId("rot"),
      name: data.name,
      description: data.description ?? null,
      systemKey: null,
      segmentId: data.segmentId,
      departmentId: data.departmentId,
      recurrence: data.recurrence,
      defaultDueDay: data.defaultDueDay ?? null,
      defaultPriority: data.defaultPriority,
      active: data.active,
      organizationId: user.organizationId,
      createdAt,
      updatedAt: createdAt,
    });
  });

  revalidatePath("/rotinas");
  redirect("/rotinas");
}

export async function updateRoutine(id: string, formData: FormData) {
  const user = await assertCanManage();
  const data = parse(formData);

  await mutateDemoStore((store) => {
    const routine = store.routines.find((item) => item.id === id && item.organizationId === user.organizationId);
    if (!routine) throw new Error("Rotina não encontrada.");
    routine.name = data.name;
    routine.description = data.description ?? null;
    routine.segmentId = data.segmentId;
    routine.departmentId = data.departmentId;
    routine.recurrence = data.recurrence;
    routine.defaultDueDay = data.defaultDueDay ?? null;
    routine.defaultPriority = data.defaultPriority;
    routine.active = data.active;
    routine.updatedAt = new Date();
  });

  revalidatePath("/rotinas");
  redirect("/rotinas");
}

export async function generateTaskFromRoutine(id: string) {
  const user = await assertCanManage();
  let taskId = "";

  await mutateDemoStore((store) => {
    const routine = store.routines.find((item) => item.id === id && item.organizationId === user.organizationId);
    if (!routine) throw new Error("Rotina não encontrada.");

    const today = startOfDay(new Date());
    const dueDate = routine.defaultDueDay
      ? setDate(addDays(today, routine.defaultDueDay < today.getDate() ? 30 : 0), routine.defaultDueDay)
      : addDays(today, 3);
    const createdAt = new Date();
    taskId = nextDemoId("task");

    store.tasks.push({
      id: taskId,
      title: routine.name,
      description: routine.description ?? null,
      systemKey: null,
      competence: null,
      dueDate,
      status: "PENDENTE",
      priority: routine.defaultPriority,
      internalNotes: null,
      completedAt: null,
      organizationId: user.organizationId,
      departmentId: routine.departmentId,
      segmentId: routine.segmentId,
      routineId: routine.id,
      clientProjectId: null,
      responsibleId: null,
      createdById: user.id,
      createdAt,
      updatedAt: createdAt,
    });

    store.histories.push({
      id: nextDemoId("hist"),
      taskId,
      userId: user.id,
      action: "Tarefa gerada a partir da rotina",
      newValue: routine.name,
      previousValue: null,
      createdAt,
    });
  });

  revalidatePath("/tarefas");
  redirect(`/tarefas/${taskId}`);
}
