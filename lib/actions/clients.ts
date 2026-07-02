"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { clientProjectSchema, type ClientProjectInput } from "@/lib/validations/entities";
import { mutateDemoStore, nextDemoId, syncClientFiscalRoutines } from "@/lib/demo-store";
import { isAccountingSegmentName } from "@/lib/accounting";

function parse(formData: FormData) {
  return clientProjectSchema.parse(Object.fromEntries(formData));
}

function assertCanWrite(role: string) {
  if (role === "CONSULTA") throw new Error("Usuário de consulta não pode alterar clientes/projetos.");
}

function getAccountingFields(segmentName: string | null | undefined, data: ClientProjectInput) {
  if (!isAccountingSegmentName(segmentName)) {
    return {
      accountingTaxRegime: null,
      accountingActivity: null,
      accountingState: null,
      hasMonthlyMovement: null,
      issuesInvoices: false,
      invoiceModels: [],
      hasRentalIrrf: false,
    };
  }

  if (!data.accountingTaxRegime || !data.accountingActivity || !data.accountingState) {
    throw new Error("Para clientes de Contabilidade, informe regime, atividade e UF.");
  }

  if (data.hasMonthlyMovement === undefined) {
    throw new Error("Para clientes de Contabilidade, informe se a rotina mensal tem movimento.");
  }

  if (data.hasMonthlyMovement && data.issuesInvoices === undefined) {
    throw new Error("Para clientes com movimento, informe se a empresa emite nota.");
  }

  if (data.hasMonthlyMovement && data.issuesInvoices && data.invoiceModels.length === 0) {
    throw new Error("Para empresas que emitem nota, selecione ao menos um modelo de nota.");
  }

  return {
    accountingTaxRegime: data.accountingTaxRegime,
    accountingActivity: data.accountingActivity,
    accountingState: data.accountingState,
    hasMonthlyMovement: data.hasMonthlyMovement,
    issuesInvoices: data.hasMonthlyMovement ? Boolean(data.issuesInvoices) : false,
    invoiceModels: data.hasMonthlyMovement && data.issuesInvoices ? data.invoiceModels : [],
    hasRentalIrrf: data.hasRentalIrrf,
  };
}

export async function createClientProject(formData: FormData) {
  const user = await requireUser();
  assertCanWrite(user.role);
  const data = parse(formData);

  await mutateDemoStore((store) => {
    const createdAt = new Date();
    const segment = store.segments.find((item) => item.id === data.segmentId);
    const accountingFields = getAccountingFields(segment?.name, data);
    const client = {
      id: nextDemoId("cli"),
      name: data.name,
      document: data.document ?? null,
      type: data.type,
      status: data.status,
      segmentId: data.segmentId ?? null,
      mainResponsibleUserId: data.mainResponsibleUserId ?? null,
      notes: data.notes ?? null,
      ...accountingFields,
      organizationId: user.organizationId,
      createdAt,
      updatedAt: createdAt,
    };
    store.clientProjects.push(client);
    syncClientFiscalRoutines(store, client, user.id);
  });

  revalidatePath("/clientes");
  revalidatePath("/tarefas");
  revalidatePath("/rotinas");
  redirect("/clientes");
}

export async function updateClientProject(id: string, formData: FormData) {
  const user = await requireUser();
  assertCanWrite(user.role);
  const data = parse(formData);

  await mutateDemoStore((store) => {
    const client = store.clientProjects.find((item) => item.id === id && item.organizationId === user.organizationId);
    if (!client) throw new Error("Cliente/projeto não encontrado.");
    const segment = store.segments.find((item) => item.id === data.segmentId);
    const accountingFields = getAccountingFields(segment?.name, data);
    client.name = data.name;
    client.document = data.document ?? null;
    client.type = data.type;
    client.status = data.status;
    client.segmentId = data.segmentId ?? null;
    client.mainResponsibleUserId = data.mainResponsibleUserId ?? null;
    client.notes = data.notes ?? null;
    client.accountingTaxRegime = accountingFields.accountingTaxRegime;
    client.accountingActivity = accountingFields.accountingActivity;
    client.accountingState = accountingFields.accountingState;
    client.hasMonthlyMovement = accountingFields.hasMonthlyMovement;
    client.issuesInvoices = accountingFields.issuesInvoices;
    client.invoiceModels = accountingFields.invoiceModels;
    client.hasRentalIrrf = accountingFields.hasRentalIrrf;
    client.updatedAt = new Date();
    syncClientFiscalRoutines(store, client, user.id);
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/tarefas");
  revalidatePath("/rotinas");
  redirect(`/clientes/${id}`);
}
