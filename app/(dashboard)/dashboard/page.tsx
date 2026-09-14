import { AlertTriangle, Building2, CalendarClock, CheckCircle2, ClipboardCheck, Clock3 } from "lucide-react";
import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PriorityBadge } from "@/components/badges/priority-badge";
import { StatusBadge } from "@/components/badges/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { closingModuleLabels } from "@/lib/closing";
import { getDashboardData } from "@/lib/data";
import { cn, formatDate, isOverdue } from "@/lib/utils";

function RankingList({ rows }: { rows: { name: string; count: number }[] }) {
  if (!rows.length) return <EmptyState title="Sem dados para exibir" className="border-0 bg-slate-50" />;
  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.name} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2">
          <span className="truncate text-sm text-slate-700">{row.name}</span>
          <strong className="text-sm text-slate-950">{row.count}</strong>
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Painel"
        description="Andamento do fechamento da competência e pendências do escritório."
        actionHref="/tarefas/nova"
        actionLabel="Nova tarefa"
        actionIcon={ClipboardCheck}
      />

      <section className="grid gap-5 xl:grid-cols-2">
        {data.closing.map((summary) => {
          const path = `/${summary.module.toLowerCase()}`;
          return (
            <Card key={summary.module}>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Fechamento {closingModuleLabels[summary.module]} · {summary.competenceLabel}</CardTitle>
                  <CardDescription>
                    {summary.companiesDone}/{summary.companies} empresas fechadas · {summary.done}/{summary.applicable} etapas concluídas
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`${path}?competence=${summary.competence}`}>Abrir matriz</Link>
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-900">{summary.percent}% concluído</span>
                    <span className="text-slate-500">
                      {summary.open} pendentes{summary.attention ? ` · ${summary.attention} em atenção` : ""}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn("h-full rounded-full", summary.percent === 100 ? "bg-emerald-500" : "bg-sky-600")} style={{ width: `${summary.percent}%` }} />
                  </div>
                </div>
                {summary.pendingRows.length ? (
                  <div className="grid gap-2">
                    {summary.pendingRows.map((row) => (
                      <Link
                        key={row.id}
                        href={`${path}?competence=${summary.competence}&q=${encodeURIComponent(row.name)}`}
                        className="grid gap-2 rounded-md border border-slate-100 px-3 py-2 hover:bg-slate-50 md:grid-cols-[1fr_auto] md:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">
                            {row.code ? <span className="text-slate-400">{row.code} · </span> : null}
                            {row.name}
                          </p>
                          <p className="truncate text-xs text-slate-500">{row.pendingSteps.join(" · ")}</p>
                        </div>
                        <div className="flex gap-1.5">
                          {row.attention ? <Badge variant="amber">{row.attention} atenção</Badge> : null}
                          <Badge variant="outline">{row.open} pendentes</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={summary.companies ? "Tudo concluído" : "Nenhuma empresa com etapas aplicáveis"}
                    description={summary.companies ? "Nenhuma empresa com pendências nesta competência." : "Cadastre empresas para acompanhar o fechamento."}
                    className="border-0 bg-slate-50"
                    icon={CheckCircle2}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 grid-cols-2 xl:grid-cols-5">
        <DashboardCard title="Empresas ativas" value={data.cards.activeCompanies} description="Carteira em operação" icon={Building2} />
        <DashboardCard title="Tarefas hoje" value={data.cards.dueToday} description="Avulsas com prazo para hoje" icon={CalendarClock} />
        <DashboardCard title="Tarefas atrasadas" value={data.cards.overdue} description="Avulsas fora do prazo" icon={AlertTriangle} />
        <DashboardCard title="Esta semana" value={data.cards.weekTasks} description="Avulsas da semana" icon={Clock3} />
        <DashboardCard title="Concluídas no mês" value={data.cards.completedThisMonth} description="Avulsas concluídas" icon={CheckCircle2} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[2fr_1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Próximas tarefas avulsas</CardTitle>
            <CardDescription>Demandas fora da rotina, ordenadas por prazo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.nextTasks.length ? (
              data.nextTasks.map((task) => (
                <Link key={task.id} href={`/tarefas/${task.id}`} className="grid gap-3 rounded-md border border-slate-100 p-3 hover:border-sky-200 hover:bg-sky-50/40 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-medium text-slate-950">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.clientProject?.name ?? "Sem empresa"} · {task.department.name}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    <span className={isOverdue(task.dueDate, task.status) ? "text-sm font-semibold text-rose-700" : "text-sm text-slate-600"}>
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState title="Sem tarefas avulsas abertas" description="Crie tarefas para demandas fora da rotina." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tarefas abertas por setor</CardTitle></CardHeader>
          <CardContent><RankingList rows={data.departmentRows} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Concluídas no mês por responsável</CardTitle></CardHeader>
          <CardContent><RankingList rows={data.responsibleRows} /></CardContent>
        </Card>
      </section>
    </div>
  );
}
