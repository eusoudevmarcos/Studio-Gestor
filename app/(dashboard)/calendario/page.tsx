import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PriorityBadge } from "@/components/badges/priority-badge";
import { StatusBadge } from "@/components/badges/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCalendarBuckets } from "@/lib/data";
import { formatDate } from "@/lib/utils";

type BucketProps = {
  title: string;
  tasks: Awaited<ReturnType<typeof getCalendarBuckets>>["today"];
};

function Bucket({ title, tasks }: BucketProps) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        {tasks.length ? (
          tasks.map((task) => (
            <Link key={task.id} href={`/tarefas/${task.id}`} className="rounded-md border border-slate-100 p-3 hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-950">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{task.clientProject?.name ?? "Sem empresa"} · {task.department.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(task.dueDate)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState title="Sem tarefas" className="border-0 bg-slate-50" />
        )}
      </CardContent>
    </Card>
  );
}

export default async function CalendarPage() {
  const buckets = await getCalendarBuckets();

  return (
    <div className="grid gap-5">
      <PageHeader title="Calendário" description="Tarefas agrupadas por vencimento operacional." actionHref="/tarefas/nova" actionLabel="Nova tarefa" actionIcon={CalendarDays} />
      <section className="grid gap-5 xl:grid-cols-2">
        <Bucket title="Atrasadas" tasks={buckets.overdue} />
        <Bucket title="Hoje" tasks={buckets.today} />
        <Bucket title="Amanhã" tasks={buckets.tomorrow} />
        <Bucket title="Esta semana" tasks={buckets.thisWeek} />
        <Bucket title="Próxima semana" tasks={buckets.nextWeek} />
        <Bucket title="Futuras" tasks={buckets.future} />
      </section>
    </div>
  );
}
