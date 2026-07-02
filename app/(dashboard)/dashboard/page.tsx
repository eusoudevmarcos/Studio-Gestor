import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PriorityBadge } from "@/components/badges/priority-badge";
import { StatusBadge } from "@/components/badges/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { getDashboardData } from "@/lib/data";
import { formatDate, isOverdue } from "@/lib/utils";

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
        title="Dashboard"
        description="Visão gerencial de prazos, entregas, pendências e produtividade."
        actionHref="/tarefas/nova"
        actionLabel="Nova tarefa"
        actionIcon={ClipboardCheck}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Vencem hoje" value={data.cards.dueToday} description="Tarefas com prazo para hoje" icon={CalendarClock} />
        <DashboardCard title="Atrasadas" value={data.cards.overdue} description="Pendências fora do prazo" icon={AlertTriangle} />
        <DashboardCard title="Esta semana" value={data.cards.weekTasks} description="Agenda operacional da semana" icon={Clock3} />
        <DashboardCard title="Concluídas no mês" value={data.cards.completedThisMonth} description="Produtividade mensal" icon={CheckCircle2} />
        <DashboardCard title="Aguardando cliente" value={data.cards.waitingClient} description="Dependências externas" icon={BriefcaseBusiness} />
        <DashboardCard title="Clientes/projetos ativos" value={data.cards.activeClients} description="Carteira em operação" icon={BriefcaseBusiness} />
        <DashboardCard title="Rotinas ativas" value={data.cards.activeRoutines} description="Modelos geradores de tarefas" icon={FolderKanban} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos vencimentos</CardTitle>
            <CardDescription>Tarefas abertas ordenadas por prazo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.nextTasks.length ? (
              data.nextTasks.map((task) => (
                <Link key={task.id} href={`/tarefas/${task.id}`} className="grid gap-3 rounded-md border border-slate-100 p-3 hover:border-sky-200 hover:bg-sky-50/40 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-medium text-slate-950">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.clientProject?.name ?? "Sem cliente/projeto"} · {task.department.name}</p>
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
              <EmptyState title="Sem próximos vencimentos" description="As tarefas abertas aparecerão aqui." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarefas críticas</CardTitle>
            <CardDescription>Prioridades alta e crítica que exigem atenção.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.criticalTasks.length ? (
              data.criticalTasks.map((task) => (
                <Link key={task.id} href={`/tarefas/${task.id}`} className="grid gap-3 rounded-md border border-slate-100 p-3 hover:border-rose-200 hover:bg-rose-50/40 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-medium text-slate-950">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.responsible?.name ?? "Sem responsável"} · {task.department.name}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState title="Sem tarefas críticas" description="Prioridades críticas e altas aparecerão aqui." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Pendências por setor</CardTitle></CardHeader>
          <CardContent><RankingList rows={data.departmentRows} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pendências por segmento</CardTitle></CardHeader>
          <CardContent><RankingList rows={data.segmentRows} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Produtividade por responsável</CardTitle></CardHeader>
          <CardContent><RankingList rows={data.responsibleRows} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Clientes com mais pendências</CardTitle></CardHeader>
          <CardContent><RankingList rows={data.clientRows} /></CardContent>
        </Card>
      </section>
    </div>
  );
}
