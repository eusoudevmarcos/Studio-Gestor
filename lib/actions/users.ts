"use server";

import { revalidatePath } from "next/cache";
import { canManageUsers } from "@/lib/permissions";
import { requireUser } from "@/lib/auth/session";
import { userEditSchema } from "@/lib/validations/entities";
import { mutateDemoStore } from "@/lib/demo-store";

export async function updateUser(id: string, formData: FormData) {
  const currentUser = await requireUser();
  if (!canManageUsers(currentUser.role)) {
    throw new Error("Sem permissão para editar usuários.");
  }

  const data = userEditSchema.parse(Object.fromEntries(formData));

  await mutateDemoStore((store) => {
    const user = store.users.find((item) => item.id === id && item.organizationId === currentUser.organizationId);
    if (!user) throw new Error("Usuário não encontrado.");
    user.name = data.name;
    user.role = data.role;
    user.departmentId = data.departmentId ?? null;
    user.active = data.active;
    user.updatedAt = new Date();
  });

  revalidatePath("/equipe");
}
