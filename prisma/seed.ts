import { PrismaClient, RoutineRecurrence, TaskPriority, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

/*
 * Seed para quando o PostgreSQL for ativado: organização do escritório, setores,
 * usuários iniciais e rotinas avulsas. As empresas entram pela tela "Importar da planilha".
 */

const prisma = new PrismaClient();

const password = "Studio@123";

const departmentTemplates = [
  ["Fiscal", "Apuração, guias e obrigações acessórias."],
  ["Folha", "Fechamento da folha, eSocial, FGTS Digital e INSS."],
  ["Contábil", "Lançamentos, conciliação e balancetes."],
  ["Societário", "Abertura, alteração e baixa de empresas."],
] as const;

const routineTemplates = [
  ["Abertura de empresa", "Societário", RoutineRecurrence.UNICA, null, TaskPriority.ALTA],
  ["Alteração contratual", "Societário", RoutineRecurrence.UNICA, null, TaskPriority.MEDIA],
  ["Baixa de empresa", "Societário", RoutineRecurrence.UNICA, null, TaskPriority.MEDIA],
  ["Balancete mensal", "Contábil", RoutineRecurrence.MENSAL, 25, TaskPriority.MEDIA],
  ["Conciliação bancária", "Contábil", RoutineRecurrence.MENSAL, 15, TaskPriority.MEDIA],
  ["Parcelamento / regularização", "Fiscal", RoutineRecurrence.UNICA, null, TaskPriority.ALTA],
] as const;

async function main() {
  const passwordHash = await hash(password, 10);

  const organization = await prisma.organization.upsert({
    where: { slug: "studio-tax" },
    update: { name: "Studio Tax", segment: "Contabilidade" },
    create: { name: "Studio Tax", slug: "studio-tax", segment: "Contabilidade" },
  });

  const segment = await prisma.segment.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: "Contabilidade" } },
    update: { description: "Rotinas fiscais, folha, contábeis e societárias do escritório.", active: true },
    create: {
      name: "Contabilidade",
      description: "Rotinas fiscais, folha, contábeis e societárias do escritório.",
      organizationId: organization.id,
    },
  });

  const departments = new Map<string, { id: string }>();
  for (const [name, description] of departmentTemplates) {
    const department = await prisma.department.upsert({
      where: { organizationId_segmentId_name: { organizationId: organization.id, segmentId: segment.id, name } },
      update: { description, active: true },
      create: { name, description, organizationId: organization.id, segmentId: segment.id },
    });
    departments.set(name, department);
  }

  for (const [name, departmentName, recurrence, defaultDueDay, defaultPriority] of routineTemplates) {
    const department = departments.get(departmentName)!;
    const existing = await prisma.routine.findFirst({ where: { organizationId: organization.id, departmentId: department.id, name } });
    const data = {
      description: `Rotina avulsa: ${name.toLowerCase()}.`,
      recurrence,
      defaultDueDay,
      defaultPriority,
      active: true,
      organizationId: organization.id,
      segmentId: segment.id,
      departmentId: department.id,
    };
    if (existing) await prisma.routine.update({ where: { id: existing.id }, data });
    else await prisma.routine.create({ data: { name, ...data } });
  }

  const users = [
    ["admin@studiogestor.com", "Admin Studio", UserRole.ADMIN, null],
    ["fiscal@studiogestor.com", "Colaborador Fiscal", UserRole.COLABORADOR, "Fiscal"],
    ["folha@studiogestor.com", "Colaborador Folha", UserRole.COLABORADOR, "Folha"],
    ["consulta@studiogestor.com", "Usuário Consulta", UserRole.CONSULTA, null],
  ] as const;

  for (const [email, name, role, departmentName] of users) {
    const departmentId = departmentName ? departments.get(departmentName)?.id : undefined;
    await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash, role, active: true, organizationId: organization.id, departmentId },
      create: { name, email, passwordHash, role, organizationId: organization.id, departmentId },
    });
  }

  console.log(`Seed concluído. Login: admin@studiogestor.com / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
