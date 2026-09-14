import { Edit, ReceiptText, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DepartmentBadge } from "@/components/badges/department-badge";
import { StatusBadge } from "@/components/badges/status-badge";
import { cellClasses, cellText } from "@/components/closing/cell-style";
import { DeleteCompanyButton } from "@/components/forms/delete-company-button";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { accountingActivityLabels, accountingTaxRegimeLabels, formatCnpj } from "@/lib/accounting";
import { cellStatusLabels, closingModuleLabels, closingSteps } from "@/lib/closing";
import { clientProjectStatusLabels } from "@/lib/labels";
import { getCompany, getCurrentContext } from "@/lib/data";
import type { RouteParams } from "@/lib/search-params";
import { cn, formatDate } from "@/lib/utils";

export default async function CompanyDetailPage({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = await params;
  const [item, context] = await Promise.all([getCompany(id), getCurrentContext()]);

  if (!item) notFound();
  const canDelete = context.user.role === "ADMIN" || context.user.role === "GESTOR";

  return (
    <div className="grid gap-5">
      <PageHeader
        title={item.code ? `${item.code} · ${item.name}` : item.name}
        description="Cadastro, perfil e obrigações derivadas."
      />
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/empresas/${item.id}/editar`}><Edit className="h-4 w-4" />Editar</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/fiscal?competence=${item.competence}&q=${encodeURIComponent(item.name)}`}><ReceiptText className="h-4 w-4" />Ver no Fiscal</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/folha?competence=${item.competence}&q=${encodeURIComponent(item.name)}`}><Users className="h-4 w-4" />Ver na Folha</Link>
        </Button>
        {canDelete ? <DeleteCompanyButton id={item.id} name={item.name} /> : null}
      </div>

      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="grid gap-5">
          <Card>
            <CardHeader><CardTitle>Cadastro</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div><span className="text-slate-500">Código</span><p className="font-medium">{item.code ?? "-"}</p></div>
              <div><span className="text-slate-500">CNPJ</span><p className="font-medium tabular-nums">{formatCnpj(item.document)}</p></div>
              <div><span className="text-slate-500">Inscrição estadual</span><p className="font-medium">{item.stateRegistration ?? "-"}</p></div>
              <div><span className="text-slate-500">CF/DF</span><p className="font-medium">{item.districtRegistration ?? "-"}</p></div>
              <div><span className="text-slate-500">Situação</span><p className="font-medium">{clientProjectStatusLabels[item.status]}</p></div>
              <div><span className="text-slate-500">Responsável</span><p className="font-medium">{item.mainResponsible?.name ?? "-"}</p></div>
              <div><span className="text-slate-500">Observações</span><p className="font-medium whitespace-pre-wrap">{item.notes ?? "-"}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div><span className="text-slate-500">Regime</span><p className="font-medium">{item.accountingTaxRegime ? accountingTaxRegimeLabels[item.accountingTaxRegime] : "-"}</p></div>
              <div><span className="text-slate-500">Atividade</span><p className="font-medium">{item.accountingActivity ? accountingActivityLabels[item.accountingActivity] : "-"}</p></div>
              <div><span className="text-slate-500">UF</span><p className="font-medium">{item.accountingState ?? "-"}</p></div>
              <div><span className="text-slate-500">Funcionários</span><p className="font-medium">{item.employeesCount ?? "Não informado"}</p></div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant={item.hasMonthlyMovement ? "green" : "amber"}>{item.hasMonthlyMovement ? "Com movimento" : "Sem movimento"}</Badge>
                <Badge variant={item.issuesInvoices ? "blue" : "outline"}>{item.issuesInvoices ? "Emite nota" : "Não emite nota"}</Badge>
                {item.hasRentalIrrf ? <Badge variant="red">IRRF aluguel</Badge> : null}
                {item.modules.map((module) => <Badge key={module} variant="violet">{closingModuleLabels[module]}</Badge>)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5">
          {item.closing.map(({ module, row }) => (
            <Card key={module}>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Obrigações · {closingModuleLabels[module]}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Competência {item.competenceLabel} · {row.done}/{row.applicable} concluídas</p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${module.toLowerCase()}?competence=${item.competence}&q=${encodeURIComponent(item.name)}`}>Abrir matriz</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {row.applicable ? (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {row.cells.map((cell) => {
                      const step = closingSteps[module].find((entry) => entry.key === cell.stepKey)!;
                      return (
                        <li key={cell.stepKey} className={cn("flex items-center gap-3 rounded-md border border-slate-100 px-3 py-2", !cell.applicable && "opacity-50")}>
                          <span className={cn("flex h-7 w-14 shrink-0 items-center justify-center rounded border text-[11px] font-semibold", cellClasses(cell))}>
                            {cellText(cell)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">{step.label}</p>
                            <p className="truncate text-xs text-slate-500" title={cell.reason}>
                              {cell.applicable ? cellStatusLabels[cell.status] : cell.reason}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState title={`Nenhuma etapa de ${closingModuleLabels[module]} aplicável`} description="Ative o módulo ou ajuste o perfil da empresa." className="border-0 bg-slate-50" />
                )}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader><CardTitle>Tarefas avulsas</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {item.tasks.length ? (
                item.tasks.map((task) => (
                  <Link key={task.id} href={`/tarefas/${task.id}`} className="grid gap-3 rounded-md border border-slate-100 p-3 hover:bg-slate-50 md:grid-cols-[1fr_auto]">
                    <div>
                      <p className="font-medium text-slate-950">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{task.responsible?.name ?? "Sem responsável"} · {formatDate(task.dueDate)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <DepartmentBadge name={task.department.name} />
                      <StatusBadge status={task.status} />
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState title="Sem tarefas avulsas" description="Demandas fora da rotina (alteração contratual, parcelamento...) podem ser criadas em Tarefas." className="border-0 bg-slate-50" />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
