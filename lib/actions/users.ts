"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { normalizeEmail } from "@/lib/auth/bootstrap";
import { canManageUsers } from "@/lib/permissions";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { changePasswordSchema, userCreateSchema, userEditSchema, userPasswordSchema } from "@/lib/validations/entities";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function requireAdmin() {
  const user = await requireUser();
  if (!canManageUsers(user.role)) throw new Error("Sem permissão para gerenciar usuários.");
  return user;
}

function errorResult(cause: unknown, fallback: string): ActionResult {
  return { ok: false, error: cause instanceof Error ? cause.message : fallback };
}

async function assertNotLastAdmin(organizationId: string, userId: string) {
  const admins = await prisma.user.count({ where: { organizationId, role: "ADMIN", active: true, NOT: { id: userId } } });
  if (admins === 0) throw new Error("Mantenha pelo menos um administrador ativo.");
}

export async function updateUser(id: string, formData: FormData) {
  const currentUser = await requireAdmin();
  const data = userEditSchema.parse(Object.fromEntries(formData));

  const user = await prisma.user.findFirst({ where: { id, organizationId: currentUser.organizationId } });
  if (!user) throw new Error("Usuário não encontrado.");
  if (user.role === "ADMIN" && (data.role !== "ADMIN" || !data.active)) await assertNotLastAdmin(user.organizationId, user.id);

  await prisma.user.update({
    where: { id },
    data: { name: data.name, role: data.role, departmentId: data.departmentId ?? null, active: data.active },
  });

  revalidatePath("/equipe");
}

// Assinaturas (estado anterior, formData) para uso com useActionState nos formulários.
export async function createUserAction(_previous: ActionResult | null, formData: FormData) {
  return createUser(formData);
}

export async function changeOwnPasswordAction(_previous: ActionResult | null, formData: FormData) {
  return changeOwnPassword(formData);
}

export async function createUser(formData: FormData): Promise<ActionResult> {
  try {
    const currentUser = await requireAdmin();
    const data = userCreateSchema.parse(Object.fromEntries(formData));
    const email = normalizeEmail(data.email);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { ok: false, error: "Já existe um usuário com este e-mail." };

    await prisma.user.create({
      data: {
        name: data.name,
        email,
        passwordHash: await hash(data.password, 10),
        role: data.role,
        departmentId: data.departmentId ?? null,
        organizationId: currentUser.organizationId,
      },
    });

    revalidatePath("/equipe");
    return { ok: true, message: `Acesso criado para ${data.name}.` };
  } catch (cause) {
    return errorResult(cause, "Não foi possível criar o usuário.");
  }
}

// Admin define uma nova senha para um colaborador (ex.: esqueceu a senha).
export async function setUserPassword(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const currentUser = await requireAdmin();
    const data = userPasswordSchema.parse(Object.fromEntries(formData));

    const { count } = await prisma.user.updateMany({
      where: { id, organizationId: currentUser.organizationId },
      data: { passwordHash: await hash(data.password, 10) },
    });
    if (!count) return { ok: false, error: "Usuário não encontrado." };

    return { ok: true, message: "Senha redefinida." };
  } catch (cause) {
    return errorResult(cause, "Não foi possível redefinir a senha.");
  }
}

// Qualquer usuário troca a própria senha informando a atual.
export async function changeOwnPassword(formData: FormData): Promise<ActionResult> {
  try {
    const currentUser = await requireUser();
    const data = changePasswordSchema.parse(Object.fromEntries(formData));

    const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!user) return { ok: false, error: "Usuário não encontrado." };
    if (!(await compare(data.currentPassword, user.passwordHash))) return { ok: false, error: "Senha atual incorreta." };

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hash(data.password, 10) } });
    return { ok: true, message: "Senha alterada." };
  } catch (cause) {
    return errorResult(cause, "Não foi possível alterar a senha.");
  }
}
