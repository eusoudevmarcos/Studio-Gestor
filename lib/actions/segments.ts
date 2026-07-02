"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { segmentSchema } from "@/lib/validations/entities";
import { requireUser } from "@/lib/auth/session";
import { canManageSegments } from "@/lib/permissions";
import { mutateDemoStore, nextDemoId } from "@/lib/demo-store";

function parse(formData: FormData) {
  return segmentSchema.parse(Object.fromEntries(formData));
}

async function assertCanManage() {
  const user = await requireUser();
  if (!canManageSegments(user.role)) throw new Error("Sem permissão para gerenciar segmentos.");
  return user;
}

export async function createSegment(formData: FormData) {
  const user = await assertCanManage();
  const data = parse(formData);

  await mutateDemoStore((store) => {
    const createdAt = new Date();
    store.segments.push({
      id: nextDemoId("seg"),
      name: data.name,
      description: data.description ?? null,
      active: data.active,
      organizationId: user.organizationId,
      createdAt,
      updatedAt: createdAt,
    });
  });

  revalidatePath("/segmentos");
  redirect("/segmentos");
}

export async function updateSegment(id: string, formData: FormData) {
  const user = await assertCanManage();
  const data = parse(formData);

  await mutateDemoStore((store) => {
    const segment = store.segments.find((item) => item.id === id && item.organizationId === user.organizationId);
    if (!segment) throw new Error("Segmento não encontrado.");
    segment.name = data.name;
    segment.description = data.description ?? null;
    segment.active = data.active;
    segment.updatedAt = new Date();
  });

  revalidatePath("/segmentos");
  redirect("/segmentos");
}
