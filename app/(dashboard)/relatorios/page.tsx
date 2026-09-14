import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { taskStatusLabels } from "@/lib/labels";
import { getReportsData } from "@/lib/data";
import { formatDate } from "@/lib/utils";

function ReportList({ rows }: { rows: { name: string; count: number }[] }) {
  if (!rows.length) return <EmptyState title="Sem dados" className="border-0 bg-slate-50" />;
  return (
    <div className="grid gap-2">
      {rows.map((row) => (
        <div key={row.name} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2">
          <span className="text-sm text-slate-700">{taskStatusLabels[row.name as keyof typeof taskStatusLabels] ?? row.name}</span>
          <strong className="text-sm text-slate-950">{row.count}</strong>
        </div>
      ))}
    </div>
  );
}

export default async function ReportsPage() {
  const data = await getReportsData();

  return (
    <div className="grid gap-5">
      <PageHeader title="Relatórios" description="Indicadores básicos de tarefas por status, setor, segmento, responsável e empresa." actionIcon={BarChart3} />
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Card><CardHeader><CardTitle>Tarefas por status</CardTitle></CardHeader><CardContent><ReportList rows={data.byStatus} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Tarefas por setor</CardTitle></CardHeader><CardContent><ReportList rows={data.byDepartment} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Tarefas por segmento</CardTitle></CardHeader><CardContent><ReportList rows={data.bySegment} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Tarefas por responsável</CardTitle></CardHeader><CardContent><ReportList rows={data.byResponsible} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Atrasadas por empresa</CardTitle></CardHeader><CardContent><ReportList rows={data.overdueByClient} /></CardContent></Card>
      </section>
      <Card>
        <CardHeader><CardTitle>Concluídas no mês</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {data.completedThisMonth.length ? (
            data.completedThisMonth.map((task) => (
              <Link key={task.id} href={`/tarefas/${task.id}`} className="grid gap-3 rounded-md border border-slate-100 p-3 hover:bg-slate-50 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-medium text-slate-950">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{task.clientProject?.name ?? "Sem empresa"} · {task.department.name}</p>
                </div>
                <span className="text-sm text-slate-500">{formatDate(task.completedAt)}</span>
              </Link>
            ))
          ) : (
            <EmptyState title="Nenhuma tarefa concluída no mês" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
