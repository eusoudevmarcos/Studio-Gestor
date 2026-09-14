import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export const defaultDepartments = [
  ["Fiscal", "Apuração, guias e obrigações acessórias."],
  ["Folha", "Fechamento da folha, eSocial, FGTS Digital e INSS."],
  ["Contábil", "Lançamentos, conciliação e balancetes."],
  ["Societário", "Abertura, alteração e baixa de empresas."],
] as const;

export function organizationSlug() {
  return process.env.ORGANIZATION_SLUG?.trim() || "studio-tax";
}

export function organizationName() {
  return process.env.ORGANIZATION_NAME?.trim() || "Studio Tax";
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/*
 * Garante a organização, os setores padrão e o administrador principal
 * (ADMIN_EMAIL / ADMIN_PASSWORD do ambiente). Idempotente: roda no seed e no
 * primeiro login, então um deploy novo já nasce com acesso sem passos manuais.
 * A senha do ambiente só é usada na criação; depois disso, troque pela Equipe.
 */
export async function ensureBootstrap() {
  const organization = await prisma.organization.upsert({
    where: { slug: organizationSlug() },
    update: {},
    create: { slug: organizationSlug(), name: organizationName() },
  });

  for (const [name, description] of defaultDepartments) {
    await prisma.department.upsert({
      where: { organizationId_name: { organizationId: organization.id, name } },
      update: {},
      create: { name, description, organizationId: organization.id },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ? normalizeEmail(process.env.ADMIN_EMAIL) : "";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";

  if (adminEmail && adminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: process.env.ADMIN_NAME?.trim() || "Administrador",
          email: adminEmail,
          passwordHash: await hash(adminPassword, 10),
          role: UserRole.ADMIN,
          organizationId: organization.id,
        },
      });
    }
  }

  return organization;
}
