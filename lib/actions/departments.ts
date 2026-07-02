"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageSegments } from "@/lib/permissions";
import { requireUser } from "@/lib/auth/session";
import { departmentSchema } from "@/lib/validations/entities";
import { mutateDemoStore, nextDemoId } from "@/lib/demo-store";

function parse(formData: FormData) {
  return departmentSchema.parse(Object.fromEntries(formData));
}

async function assertCanManage() {
  const user = await requireUser();
  if (!canManageSegments(user.role) && user.role !== "COORDENADOR") {
    throw new Error("Sem permissão para gerenciar setores.");
  }
  return user;
}

export async function createDepartment(formData: FormData) {
  const user = await assertCanManage();
  const data = parse(formData);

  await mutateDemoStore((store) => {
    const createdAt = new Date();
    store.departments.push({
      id: nextDemoId("dep"),
      name: data.name,
      description: data.description ?? null,
      segmentId: data.segmentId ?? null,
      active: data.active,
      organizationId: user.organizationId,
      createdAt,
      updatedAt: createdAt,
    });
  });

  revalidatePath("/setores");
  redirect("/setores");
}

export async function updateDepartment(id: string, formData: FormData) {
  const user = await assertCanManage();
  const data = parse(formData);

  await mutateDemoStore((store) => {
    const department = store.departments.find((item) => item.id === id && item.organizationId === user.organizationId);
    if (!department) throw new Error("Setor não encontrado.");
    department.name = data.name;
    department.description = data.description ?? null;
    department.segmentId = data.segmentId ?? null;
    department.active = data.active;
    department.updatedAt = new Date();
  });

  revalidatePath("/setores");
  redirect("/setores");
}
