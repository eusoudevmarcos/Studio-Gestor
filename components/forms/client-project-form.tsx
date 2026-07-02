"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
  accountingActivities,
  accountingActivityLabels,
  accountingInvoiceModelLabels,
  accountingInvoiceModels,
  accountingTaxRegimeLabels,
  accountingTaxRegimes,
  brazilianStates,
  isAccountingSegmentName,
  type AccountingInvoiceModel,
} from "@/lib/accounting";
import { getFiscalRoutineTemplates } from "@/lib/fiscal-routines";
import { clientProjectStatusLabels, clientProjectTypeLabels } from "@/lib/labels";
import type { ClientProjectInput } from "@/lib/validations/entities";
import { clientProjectSchema, clientProjectStatuses, clientProjectTypes } from "@/lib/validations/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, type FormAction, toFormData } from "@/components/forms/form-utils";

type Option = { id: string; name: string | null; email?: string };

type ClientProjectFormProps = {
  action: FormAction;
  segments: Option[];
  users: Option[];
  defaultValues?: Partial<z.input<typeof clientProjectSchema>>;
};

function toOptionalBoolean(value: unknown) {
  if (value === undefined || value === "") return undefined;
  return value === true || value === "true" || value === "on";
}

function toInvoiceModels(value: unknown): AccountingInvoiceModel[] {
  if (Array.isArray(value)) return value.filter((item): item is AccountingInvoiceModel => accountingInvoiceModels.includes(item));
  if (typeof value === "string") {
    return value
      .split(",")
      .filter((item): item is AccountingInvoiceModel => accountingInvoiceModels.includes(item as AccountingInvoiceModel));
  }
  return [];
}

export function ClientProjectForm({ action, segments, users, defaultValues }: ClientProjectFormProps) {
  const [pending, startTransition] = useTransition();
  const form = useForm<z.input<typeof clientProjectSchema>, unknown, ClientProjectInput>({
    resolver: zodResolver(clientProjectSchema),
    defaultValues: {
      name: "",
      document: "",
      type: "CLIENTE",
      status: "ATIVO",
      segmentId: "",
      mainResponsibleUserId: "",
      notes: "",
      accountingTaxRegime: "",
      accountingActivity: "",
      accountingState: "",
      hasMonthlyMovement: undefined,
      issuesInvoices: undefined,
      invoiceModels: [],
      hasRentalIrrf: false,
      ...defaultValues,
    },
  });
  /* eslint-disable react-hooks/incompatible-library */
  const [
    selectedSegmentId,
    accountingTaxRegime,
    accountingActivity,
    accountingState,
    hasMonthlyMovement,
    issuesInvoices,
    invoiceModels,
    hasRentalIrrf,
  ] = form.watch([
    "segmentId",
    "accountingTaxRegime",
    "accountingActivity",
    "accountingState",
    "hasMonthlyMovement",
    "issuesInvoices",
    "invoiceModels",
    "hasRentalIrrf",
  ]);
  /* eslint-enable react-hooks/incompatible-library */
  const selectedSegment = segments.find((segment) => segment.id === selectedSegmentId);
  const showAccountingProfile = isAccountingSegmentName(selectedSegment?.name);
  const monthlyMovement = toOptionalBoolean(hasMonthlyMovement);
  const invoiceIssuance = toOptionalBoolean(issuesInvoices);
  const selectedInvoiceModels = toInvoiceModels(invoiceModels);
  const fiscalRoutinePreview =
    showAccountingProfile && accountingTaxRegime && accountingActivity && accountingState && monthlyMovement !== undefined
      ? getFiscalRoutineTemplates({
          accountingTaxRegime,
          accountingActivity,
          accountingState,
          hasMonthlyMovement: monthlyMovement,
          issuesInvoices: monthlyMovement ? invoiceIssuance : false,
          invoiceModels: monthlyMovement && invoiceIssuance ? selectedInvoiceModels : [],
          hasRentalIrrf: hasRentalIrrf === true || hasRentalIrrf === "true" || hasRentalIrrf === "on",
        })
      : [];

  function onSubmit(values: ClientProjectInput) {
    startTransition(() => {
      void action(toFormData(values));
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" {...form.register("name")} />
          <FieldError message={form.formState.errors.name?.message} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="document">Documento</Label>
          <Input id="document" {...form.register("document")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="type">Tipo</Label>
          <Select id="type" {...form.register("type")}>
            {clientProjectTypes.map((type) => (
              <option key={type} value={type}>{clientProjectTypeLabels[type]}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...form.register("status")}>
            {clientProjectStatuses.map((status) => (
              <option key={status} value={status}>{clientProjectStatusLabels[status]}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="segmentId">Segmento</Label>
          <Select id="segmentId" {...form.register("segmentId")}>
            <option value="">Não vinculado</option>
            {segments.map((segment) => (
              <option key={segment.id} value={segment.id}>{segment.name}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mainResponsibleUserId">Responsável principal</Label>
          <Select id="mainResponsibleUserId" {...form.register("mainResponsibleUserId")}>
            <option value="">Sem responsável</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name ?? user.email}</option>
            ))}
          </Select>
        </div>
      </div>
      {showAccountingProfile ? (
        <section className="grid gap-4 rounded-lg border border-sky-100 bg-sky-50/40 p-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Perfil contábil</h3>
            <p className="mt-1 text-sm text-slate-500">
              Estes dados ajudam a clarear obrigações fiscais, acessórias e recorrências do cliente.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="accountingTaxRegime">Regime da empresa</Label>
              <Select id="accountingTaxRegime" required={showAccountingProfile} {...form.register("accountingTaxRegime")}>
                <option value="">Selecione</option>
                {accountingTaxRegimes.map((regime) => (
                  <option key={regime} value={regime}>{accountingTaxRegimeLabels[regime]}</option>
                ))}
              </Select>
              <FieldError message={form.formState.errors.accountingTaxRegime?.message} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountingActivity">Atividade</Label>
              <Select id="accountingActivity" required={showAccountingProfile} {...form.register("accountingActivity")}>
                <option value="">Selecione</option>
                {accountingActivities.map((activity) => (
                  <option key={activity} value={activity}>{accountingActivityLabels[activity]}</option>
                ))}
              </Select>
              <FieldError message={form.formState.errors.accountingActivity?.message} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountingState">Estado/UF</Label>
              <Select id="accountingState" required={showAccountingProfile} {...form.register("accountingState")}>
                <option value="">Selecione</option>
                {brazilianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </Select>
              <FieldError message={form.formState.errors.accountingState?.message} />
            </div>
            <label className="flex items-center gap-2 self-end rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <input id="hasRentalIrrf" type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register("hasRentalIrrf")} />
              Tem IRRF de aluguel
            </label>
          </div>
          <div className="grid gap-4 rounded-md border border-sky-100 bg-white p-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Rotina mensal padrão</p>
              <p className="mt-1 text-sm text-slate-500">
                Defina se a competência costuma ter movimento e quais etapas entram antes das obrigações.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="hasMonthlyMovement">Tem movimento mensal?</Label>
                <Select id="hasMonthlyMovement" required={showAccountingProfile} {...form.register("hasMonthlyMovement")}>
                  <option value="">Selecione</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </Select>
                <FieldError message={form.formState.errors.hasMonthlyMovement?.message} />
              </div>
              {monthlyMovement ? (
                <div className="grid gap-2">
                  <Label htmlFor="issuesInvoices">Emite nota?</Label>
                  <Select id="issuesInvoices" required={monthlyMovement} {...form.register("issuesInvoices")}>
                    <option value="">Selecione</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </Select>
                  <FieldError message={form.formState.errors.issuesInvoices?.message} />
                </div>
              ) : null}
            </div>
            {monthlyMovement && invoiceIssuance ? (
              <div className="grid gap-2">
                <Label>Modelos de nota</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {accountingInvoiceModels.map((model) => (
                    <label key={model} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                      <input
                        id={`invoiceModel-${model}`}
                        type="checkbox"
                        value={model}
                        className="h-4 w-4 rounded border-slate-300"
                        {...form.register("invoiceModels")}
                      />
                      {accountingInvoiceModelLabels[model]}
                    </label>
                  ))}
                </div>
                <FieldError message={form.formState.errors.invoiceModels?.message} />
              </div>
            ) : null}
          </div>
          <div className="rounded-md border border-sky-100 bg-white p-3">
            <p className="text-sm font-semibold text-slate-950">Rotinas fiscais padrão</p>
            {fiscalRoutinePreview.length ? (
              <ul className="mt-2 grid gap-2 text-sm text-slate-700">
                {fiscalRoutinePreview.map((routine) => (
                  <li key={routine.key} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-700" />
                    <span>
                      <strong className="font-medium text-slate-900">{routine.name}</strong>
                      <span className="text-slate-500"> · {routine.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Informe regime, atividade, UF e movimento mensal para visualizar o vínculo padrão.</p>
            )}
          </div>
        </section>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" {...form.register("notes")} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar cliente/projeto
      </Button>
    </form>
  );
}
