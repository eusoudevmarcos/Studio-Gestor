"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
  accountingActivities,
  accountingActivityLabels,
  accountingTaxRegimeLabels,
  accountingTaxRegimes,
  brazilianStates,
} from "@/lib/accounting";
import {
  closingModuleLabels,
  closingModules,
  closingSteps,
  defaultCompetence,
  overrideKey,
  resolveModuleSteps,
  type ClosingModule,
  type StepOverride,
} from "@/lib/closing";
import { clientProjectStatusLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { CompanyInput } from "@/lib/validations/entities";
import { companySchema, clientProjectStatuses } from "@/lib/validations/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, type FormAction } from "@/components/forms/form-utils";

type Option = { id: string; name: string | null; email?: string };

type CompanyFormProps = {
  action: FormAction;
  users: Option[];
  defaultValues?: Partial<z.input<typeof companySchema>>;
};

function toModules(value: unknown): ClosingModule[] {
  if (Array.isArray(value)) return value.filter((item): item is ClosingModule => closingModules.includes(item));
  if (typeof value === "string" && value) return value.split(",").filter((item): item is ClosingModule => closingModules.includes(item as ClosingModule));
  return [];
}

function toOverrides(value: unknown): Record<string, StepOverride> {
  if (value && typeof value === "object") return value as Record<string, StepOverride>;
  if (typeof value === "string" && value) {
    try {
      return JSON.parse(value) as Record<string, StepOverride>;
    } catch {
      return {};
    }
  }
  return {};
}

export function CompanyForm({ action, users, defaultValues }: CompanyFormProps) {
  const [pending, startTransition] = useTransition();
  const form = useForm<z.input<typeof companySchema>, unknown, CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      code: "",
      name: "",
      document: "",
      stateRegistration: "",
      districtRegistration: "",
      status: "ATIVO",
      mainResponsibleUserId: "",
      notes: "",
      accountingTaxRegime: undefined,
      accountingActivity: undefined,
      accountingState: undefined,
      hasMonthlyMovement: true,
      issuesInvoices: false,
      hasRentalIrrf: false,
      employeesCount: undefined,
      modules: [...closingModules],
      stepOverrides: {},
      ...defaultValues,
    },
  });
  /* eslint-disable react-hooks/incompatible-library */
  const watched = form.watch();
  /* eslint-enable react-hooks/incompatible-library */
  const modules = toModules(watched.modules);
  const overrides = toOverrides(watched.stepOverrides);
  const employeesRaw = watched.employeesCount;
  const employeesCount = employeesRaw === undefined || employeesRaw === null || employeesRaw === "" ? null : Number(employeesRaw);
  const previewProfile = {
    accountingTaxRegime: (watched.accountingTaxRegime || null) as CompanyInput["accountingTaxRegime"] | null,
    accountingActivity: (watched.accountingActivity || null) as CompanyInput["accountingActivity"] | null,
    accountingState: (watched.accountingState || null) as string | null,
    stateRegistration: String(watched.stateRegistration ?? ""),
    districtRegistration: String(watched.districtRegistration ?? ""),
    hasMonthlyMovement: Boolean(watched.hasMonthlyMovement),
    issuesInvoices: Boolean(watched.issuesInvoices),
    hasRentalIrrf: Boolean(watched.hasRentalIrrf),
    employeesCount: Number.isFinite(employeesCount) ? employeesCount : null,
    modules,
    stepOverrides: overrides,
  };
  const competence = defaultCompetence();

  function setOverride(module: ClosingModule, stepKey: string, value: string) {
    const next = { ...overrides };
    const key = overrideKey(module, stepKey);
    if (value === "APLICA" || value === "NAO_APLICA") next[key] = value;
    else delete next[key];
    form.setValue("stepOverrides", next, { shouldDirty: true });
  }

  function onSubmit(values: CompanyInput) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === null) return formData.append(key, "");
      if (Array.isArray(value)) return formData.append(key, value.join(","));
      if (typeof value === "object") return formData.append(key, JSON.stringify(value));
      formData.append(key, String(value));
    });
    startTransition(() => {
      void action(formData);
    });
  }

  return (
    <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
      <section className="grid gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Cadastro</h3>
          <p className="mt-1 text-sm text-slate-500">Mesmos campos da planilha: código, empresa, CNPJ, inscrições, atividade, UF e regime.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-6">
          <div className="grid gap-2 md:col-span-1">
            <Label htmlFor="code">Código</Label>
            <Input id="code" inputMode="numeric" placeholder="Ex.: 12" {...form.register("code")} />
          </div>
          <div className="grid gap-2 md:col-span-3">
            <Label htmlFor="name">Empresa</Label>
            <Input id="name" {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="document">CNPJ</Label>
            <Input id="document" inputMode="numeric" placeholder="00.000.000/0000-00" {...form.register("document")} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="stateRegistration">Inscrição estadual</Label>
            <Input id="stateRegistration" {...form.register("stateRegistration")} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="districtRegistration">CF/DF</Label>
            <Input id="districtRegistration" placeholder="Somente empresas do DF" {...form.register("districtRegistration")} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="accountingState">UF</Label>
            <Select id="accountingState" {...form.register("accountingState")}>
              <option value="">Selecione</option>
              {brazilianStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </Select>
            <FieldError message={form.formState.errors.accountingState?.message} />
          </div>
          <div className="grid gap-2 md:col-span-3">
            <Label htmlFor="accountingActivity">Atividade</Label>
            <Select id="accountingActivity" {...form.register("accountingActivity")}>
              <option value="">Selecione</option>
              {accountingActivities.map((activity) => (
                <option key={activity} value={activity}>{accountingActivityLabels[activity]}</option>
              ))}
            </Select>
            <FieldError message={form.formState.errors.accountingActivity?.message} />
          </div>
          <div className="grid gap-2 md:col-span-3">
            <Label htmlFor="accountingTaxRegime">Regime</Label>
            <Select id="accountingTaxRegime" {...form.register("accountingTaxRegime")}>
              <option value="">Selecione</option>
              {accountingTaxRegimes.map((regime) => (
                <option key={regime} value={regime}>{accountingTaxRegimeLabels[regime]}</option>
              ))}
            </Select>
            <FieldError message={form.formState.errors.accountingTaxRegime?.message} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="employeesCount">Funcionários</Label>
            <Input id="employeesCount" type="number" min={0} placeholder="Em branco = não informado" {...form.register("employeesCount")} />
            <FieldError message={form.formState.errors.employeesCount?.message} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="status">Situação</Label>
            <Select id="status" {...form.register("status")}>
              {clientProjectStatuses.map((status) => (
                <option key={status} value={status}>{clientProjectStatusLabels[status]}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="mainResponsibleUserId">Responsável</Label>
            <Select id="mainResponsibleUserId" {...form.register("mainResponsibleUserId")}>
              <option value="">Sem responsável</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name ?? user.email}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register("hasMonthlyMovement")} />
            Tem movimento mensal
          </label>
          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register("issuesInvoices")} />
            Emite nota (DW NF)
          </label>
          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register("hasRentalIrrf")} />
            IRRF de aluguel (REINF)
          </label>
          {closingModules.map((module) => (
            <label key={module} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" value={module} className="h-4 w-4 rounded border-slate-300" {...form.register("modules")} />
              Fechamento {closingModuleLabels[module]}
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border border-sky-100 bg-sky-50/40 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Obrigações pelo perfil</h3>
          <p className="mt-1 text-sm text-slate-500">
            Prévia do que aparece na matriz para a competência {competence.slice(5, 7)}/{competence.slice(0, 4)}. Cinza = não se aplica.
          </p>
        </div>
        {closingModules.map((module) => {
          const enabled = modules.includes(module);
          const resolved = resolveModuleSteps(previewProfile, module, competence);
          return (
            <div key={module} className="grid gap-2">
              <p className="text-xs font-semibold uppercase text-slate-500">
                {closingModuleLabels[module]}
                {!enabled ? " · desativado" : null}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {resolved.map(({ step, resolution }) => (
                  <span
                    key={step.key}
                    title={resolution.reason}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs font-semibold",
                      resolution.applicable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-100 text-slate-400 line-through",
                    )}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <details className="rounded-lg border border-slate-200 bg-white">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-950">Avançado: forçar aplicabilidade por etapa</summary>
        <div className="grid gap-4 border-t border-slate-100 p-4">
          <p className="text-sm text-slate-500">
            Use apenas nas exceções (ex.: Simples Nacional obrigado a entregar SPED em determinado estado). &quot;Automático&quot; segue o perfil.
          </p>
          {closingModules.map((module) => (
            <div key={module} className="grid gap-2">
              <p className="text-xs font-semibold uppercase text-slate-500">{closingModuleLabels[module]}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {closingSteps[module].map((step) => {
                  const key = overrideKey(module, step.key);
                  return (
                    <label key={key} className="grid gap-1 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">{step.label}</span>
                      <Select className="h-9" value={overrides[key] ?? ""} onChange={(event) => setOverride(module, step.key, event.target.value)}>
                        <option value="">Automático</option>
                        <option value="APLICA">Sempre aplica</option>
                        <option value="NAO_APLICA">Nunca aplica</option>
                      </Select>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </details>

      <div className="grid gap-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" placeholder="Ex.: sem certificado digital, contato do responsável, particularidades..." {...form.register("notes")} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar empresa
      </Button>
    </form>
  );
}
